import typeOfWoodModel from "../model/typeOfWoodModel.js";

export const create = async (req, res) => {
  try {
    const { name, description } = req.body;
    const newWoodType = new typeOfWoodModel({ name, description });
    const savedWoodType = await newWoodType.save();
    res.status(200).json({
      message: "Type of wood created successfully",
      code: 200,
      data: savedWoodType,
    });
  } catch (error) {
    console.error("Error creating type of wood:", error);
    res.status(500).json({
      message: "Internal Server Error",
      code: 500,
      data: [],
    });
  }
};

export const list = async (req, res) => {
  try {
    // Get pagination params with default values
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 10;

    // Count total documents
    const totalItems = await typeOfWoodModel.countDocuments();

    // Calculate skip
    const skip = (page - 1) * size;

    // Fetch data with pagination
    const woodTypes = await typeOfWoodModel
      .find()
      .skip(skip)
      .limit(size)
      .sort({ createdAt: -1 }); // optional: latest first

    res.status(200).json({
      message: "Type of wood list retrieved successfully",
      code: 200,
      data: {
        items: woodTypes,
        pagination: {
          currentPage: page,
          pageSize: size,
          totalItems,
          totalPages: Math.ceil(totalItems / size),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching type of wood list:", error);
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
    const woodType = await typeOfWoodModel.findById(id);
    if (!woodType) {
      return res.status(404).json({
        message: "Type of wood not found",
        code: 404,
        data: [],
      });
    }
    res.status(200).json({
      message: "Type of wood detail retrieved successfully",
      code: 200,
      data: woodType,
    });
  } catch (error) {
    console.error("Error fetching type of wood detail:", error);
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
    const { name, description } = req.body;
    const updatedWoodType = await typeOfWoodModel.findByIdAndUpdate(
      id,
      { name, description },
      { new: true }
    );

    if (!updatedWoodType) {
      return res.status(404).json({
        message: "Type of wood not found",
        code: 404,
        data: [],
      });
    }

    res.status(200).json({
      message: "Type of wood updated successfully",
      code: 200,
      data: updatedWoodType,
    });
  } catch (error) {
    console.error("Error updating type of wood:", error);
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
    const deletedWoodType = await typeOfWoodModel.findByIdAndDelete(id);

    if (!deletedWoodType) {
      return res.status(404).json({
        message: "Type of wood not found",
        code: 404,
        data: [],
      });
    }

    res.status(200).json({
      message: "Type of wood deleted successfully",
      code: 200,
      data: deletedWoodType,
    });
  } catch (error) {
    console.error("Error deleting type of wood:", error);
    res.status(500).json({
      message: "Internal Server Error",
      code: 500,
      data: [],
    });
  }
};
