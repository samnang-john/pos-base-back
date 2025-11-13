import fs from "fs";
import path from "path";
import userModel from "../model/userModel.js";
import bcrypt from "bcryptjs";

export const create = async (req, res) => {
    try {
        const {
            username,
            password,
            name,
        } = req.body;

        const image = req.file
            ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
            : null;

        if (!image) {
            return res.status(400).json({ message: "Image is required." });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new userModel({
            username,
            password: hashedPassword,
            name,
            created_at: new Date(),
            updated_at: new Date(),
            image
        });

        const savedUser = await user.save();
        res.status(200).json({
            message: "User Created Successfully!",
            code: 200,
            data: savedUser,
        });
    } catch (error) {
        console.error("Error creating user:", error.message);
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

        const totalItems = await userModel.countDocuments();
        const skip = (page - 1) * size;

        const users = await userModel
            .find()
            .skip(skip)
            .limit(size)
            .sort({ created_at: -1 });

        res.status(200).json({
            message: "Users list retrieved sucessfully",
            code: 200,
            data: {
                items: users,
                pagination: {
                    currentPage: page,
                    pageSize: size,
                    totalItems,
                    totalPages: Math.ceil(totalItems / size),
                },
            },
        });
    } catch (error) {
        console.error("Error fetching users list", error);
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
        const user = await userModel.findById(id);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                code: 404,
                data: [],
            });
        }

        res.status(200).json({
            message: "User detail retrieved successfully",
            code: 200,
            data: user
        });
    } catch (error) {
        console.error("Error fetching user detail:", error.message);
        res.status(500).json({
            message: "Internal Server Error",
            code: 500,
            data: [],
        });
    }
}

export const update = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            username,
            password,
            name,
        } = req.body;

        const existingUser = await userModel.findById(id);

        if (!existingUser) {
            return res.status(404).json({
                message: "User not found",
                code: 404,
                data: [],
            });
        }

        let image = existingUser.image;
        if (req.file) {
            const oldImagePath = path.join("public/upload", path.basename(existingUser.image));
            fs.unlink(oldImagePath, (err) => {
                if (err) {
                    console.warn("Failed to delete old image:", err.message);
                } else {
                    console.log("Old image deleted:", oldImagePath);
                }
            });
            image = `${req.protocol}://${req.get("host")}/upload/${req.file.filename}`;
        }

        let hashedPassword = existingUser.password;

        if (password && password.trim() !== "") {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        const updateUser = await userModel.findByIdAndUpdate(
            id,
            {
                username,
                password: hashedPassword,
                name,
                updated_at: new Date(),
                image
            },
            { new: true }
        );

        res.status(200).json({
            message: "User updated successfully",
            code: 200,
            data: updateUser
        });
    } catch (error) {
        console.error("Error updating user:", error.message);
        res.status(500).json({
            message: "Internal Server Error",
            code: 500,
            data: []
        });
    }
}

export const deleteById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await userModel.findById(id);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                code: 404,
                data: [],
            });
        }

        if (user.image) {
            const imagePath = path.join("public/upload", path.basename(user.image));
            fs.unlink(imagePath, (err) => {
                if (err) {
                    console.warn("Failed to delete image file:", err.message);
                } else {
                    console.log("Image deleted:", imagePath);
                }
            });
        }

        await userModel.findByIdAndDelete(id);
        res.status(200).json({
            message: "User deleted successfully",
            code: 200,
            data: user,
        });
    } catch (error) {
        console.error("Error deleting user:", error.message);
        res.status(500).json({
            message: "Internal Server Error",
            code: 500,
            data: [],
        });
    }
}