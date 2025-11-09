import fs from "fs";
import path from "path";
import productModel from "../model/productModel.js";
import typeOfWoodModel from "../model/typeOfWoodModel.js";
import endGrainOfWoodModel from "../model/endGrainOfWoodModel.js";
import lengthOfWoodModel from "../model/lengthOfWoodModel.js";

export const create = async (req, res) => {
  try {
    const { 
      type_of_wood_id,
      end_grain_of_wood_id,
      length_of_wood_id,
      cost_of_each,
      number_of_wood,
      total_price_of_wood,
      price_of_each,
      car_fee,
    } = req.body;

    const image = req.file
      ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
      : null;

    if (!image) {
      return res.status(400).json({ message: "Image is required." });
    }

    const product = new productModel({
      type_of_wood_id,
      end_grain_of_wood_id,
      length_of_wood_id,
      cost_of_each,
      number_of_wood,
      total_price_of_wood,
      price_of_each,
      car_fee,
      image
    });

    const savedProduct = await product.save();
    const typeOfWood = await typeOfWoodModel.findById(type_of_wood_id);
    const endGrainOfWood = await endGrainOfWoodModel.findById(end_grain_of_wood_id);
    const lengthOfWood = await lengthOfWoodModel.findById(length_of_wood_id);

    const responseData = {
      ...savedProduct._doc,
      type_of_wood_object: typeOfWood || null,
      end_grain_of_wood_object: endGrainOfWood || null,
      length_of_wood_object: lengthOfWood || null,
    };

    res.status(200).json({
      message: "Product created successfully",
      code: 200,
      data: responseData,
    });
  } catch (error) {
    console.error("Error creating new product:", error.message);
    res.status(500).json({
      message: "Internal Server Error",
      code: 500,
      data: [],
    });
  }
};

export const list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 10;

    const totalItems = await productModel.countDocuments();
    const skip = (page - 1) * size;

    const products = await productModel
      .find()
      .skip(skip)
      .limit(size)
      .sort({ createdAt: -1 });

    const enrichedProducts = await Promise.all(
      products.map(async (p) => {
        const typeOfWood = await typeOfWoodModel.findById(p.type_of_wood_id);
        const endGrainOfWood = await endGrainOfWoodModel.findById(p.end_grain_of_wood_id);
        const lengthOfWood = await lengthOfWoodModel.findById(p.length_of_wood_id);

        return {
          ...p._doc,
          type_of_wood_Object: typeOfWood || null,
          end_grain_of_wood_Object: endGrainOfWood || null,
          length_of_wood_Object: lengthOfWood || null,
        };
      })
    );

    res.status(200).json({
      message: "Product list received successfully",
      code: 200,
      data: {
        items: enrichedProducts,
        pagination: {
          currentPage: page,
          pageSize: size,
          totalItems,
          totalPages: Math.ceil(totalItems / size),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).json({
      message: "Internal Server Error",
      code: 500,
      data: [],
    });
  }
};

export const detail = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await productModel.findById(id);
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
        code: 404,
        data: [],
      });
    }

    const typeOfWood = await typeOfWoodModel.findById(product.type_of_wood_id);
    const endGrainOfWood = await endGrainOfWoodModel.findById(product.end_grain_of_wood_id);
    const lengthOfWood = await lengthOfWoodModel.findById(product.length_of_wood_id);

    const responseData = {
      ...product._doc,
      type_of_wood_Object: typeOfWood || null,
      end_grain_of_wood_Object: endGrainOfWood || null,
      length_of_wood_Object: lengthOfWood || null,
    };

    res.status(200).json({
      message: "Product detail received successfully",
      code: 200,
      data: responseData,
    });
  } catch (error) {
    console.error("Error fetching product detail:", error.message);
    res.status(500).json({
      message: "Internal Server Error",
      code: 500,
      data: [],
    });
  }
};

export const update = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            type_of_wood_id,
            end_grain_of_wood_id,
            length_of_wood_id,
            cost_of_each,
            number_of_wood,
            total_price_of_wood,
            price_of_each,
            car_fee,
        } = req.body;

        const existingProduct = await productModel.findById(id);
        if (!existingProduct) {
            return res.status(404).json({
                message: "Product not found",
                code: 404,
                data: [],
            });
        }

        let image = existingProduct.image;
        if (req.file) {
            const oldImagePath = path.join("public/upload", path.basename(existingProduct.image));
            fs.unlink(oldImagePath, (err) => {
                if (err) {
                    console.warn("Failed to delete old image:", err.message);
                } else {
                    console.log("Old image deleted:", oldImagePath);
                }
            });
            image = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
        }

        const updatedProduct = await productModel.findByIdAndUpdate(
            id,
            {
                type_of_wood_id,
                end_grain_of_wood_id,
                length_of_wood_id,
                cost_of_each,
                number_of_wood,
                total_price_of_wood,
                price_of_each,
                car_fee,
                image,
            },
            { new: true } 
        );

        const [typeOfWoodObj, endGrainOfWoodObj, lengthOfWoodObj] = await Promise.all([
            typeOfWoodModel.findById(updatedProduct.type_of_wood_id),
            endGrainOfWoodModel.findById(updatedProduct.end_grain_of_wood_id),
            lengthOfWoodModel.findById(updatedProduct.length_of_wood_id),
        ]);

        res.status(200).json({
            message: "Product updated successfully",
            code: 200,
            data: {
                ...updatedProduct.toObject(),
                type_of_wood_Object: typeOfWoodObj,
                end_grain_of_wood_Object: endGrainOfWoodObj,
                length_of_wood_Object: lengthOfWoodObj,
            },
        });
    } catch (error) {
        console.error("Error updating product:", error.message);
        res.status(500).json({
            message: "Internal Server Error",
            code: 500,
            data: [],
        });
    }
};

export const deleteById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await productModel.findById(id);
        if (!product) {
            return res.status(404).json({
                message: "Product not found",
                code: 404,
                data: [],
            });
        }

        if (product.image) {
            const imagePath = path.join("public/upload", path.basename(product.image));
            fs.unlink(imagePath, (err) => {
                if (err) {
                    console.warn("Failed to delete image file:", err.message);
                } else {
                    console.log("Image deleted:", imagePath);
                }
            });
        }

        await productModel.findByIdAndDelete(id);

        res.status(200).json({
            message: "Product deleted successfully",
            code: 200,
            data: product,
        });
    } catch (error) {
        console.error("Error deleting product:", error.message);
        res.status(500).json({
            message: "Internal Server Error",
            code: 500,
            data: [],
        });
    }
};
