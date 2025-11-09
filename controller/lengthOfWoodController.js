import lengthOfWoodModel from "../model/lengthOfWoodModel.js";

export const create = async (req, res) => {

    try {
        const { name, description } = req.body;

        const request = new lengthOfWoodModel({ name, description });
        const saveRequest = await request.save();

        res.status(200).json({
            message: "Length of wood created successfully",
            code: 200,
            data: saveRequest,
        });
    } catch (error) {
        console.error("Error creating length of wood:", error.message);
        res.status(500).json({
            message: "Internal Server Error",
            code: 500,
            data: [,]
        });
    }
}

export const list = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const size = parseInt(req.query.size) || 10;

        const totalItems = await lengthOfWoodModel.countDocuments();
        const skip = (page - 1) * size;
        const lengthOfWood = await lengthOfWoodModel
            .find()
            .skip(skip)
            .limit(size)
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Length of wood list recieved successfully",
            code: 200,
            data: {
                items: lengthOfWood,
                pagination: {
                    currentPage: page,
                    pageSize: size,
                    totalItems,
                    totalPages: Math.ceil(totalItems / size),
                },
            },
        });
    } catch (error) {
        console.error("Error fetching length of wood list", error);
        res.status(500).json({
            message: "Internal Server Error",
            code: 500,
            data: []
        });
    }
}

export const detail = async (req, res) => {
    try {
        const { id } = req.params;
        const lengthOfWood = await lengthOfWoodModel.findById(id);
        if (!lengthOfWood) {
            return res.status(404).json({
                message: "Length of wood not found",
                code: 404,
                data: [],
            });
        }
        res.status(200).json({
            message: "Length of wood detail recieved successfully",
            code: 200,
            data: lengthOfWood,
        });
    } catch (error) {
        console.error("Error fetching length of wood detail:", error);
        res.status(500).json({
            code: 500,
            data: [],
        });
    }
}

export const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const updatedLength = await lengthOfWoodModel.findByIdAndUpdate(
            id,
            { name, description },
            { new: true }
        );

        if (!updatedLength) {
            return res.status(404).json({
                message: "Length of wood not found",
                code: 404,
                data: [],
            });
        }

        res.status(200).json({
            message: "length of wood updated successfully",
            code: 200,
            data: updatedLength
        });
    } catch (error) {
        console.error("Error updating length of wood:", error);
        res.status(500).json({
            message: "Internal Server Error",
            code: 500,
            data: [],
        });
    }
}

export const deleteById = async (req, res) => {
    try {
        const { id } = req.params;
        const deleteLength = await lengthOfWoodModel.findByIdAndDelete(id);

        if (!deleteLength) {
            return res.status(404).json({
                message: "length of wood not found",
                code: 404,
                data: [],
            });
        }

        res.status(200).json({
            message: "length of wood deleted successfully",
            code: 200,
            data: deleteLength
        });
    } catch (error) {
        console.error("Error deleting length of wood:", error.message);
        res.status(500).json({
            message: "Internal Server Error",
            code: 500,
            data: []
        });
    }
}