import endGrainOfWoodModel from "../model/endGrainOfWoodModel.js";

export const create = async (req, res) => {
    try {
        const { name, description } = req.body;

        const request = new endGrainOfWoodModel({ name, description });
        const saveRequest = await request.save();

        res.status(200).json({
            message: "End grain of wood created successfully",
            code: 200,
            data: saveRequest,
        });
    } catch (error) {
        console.error("Error creating end grain of wood:", error.message);
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

        const totalItems = await endGrainOfWoodModel.countDocuments();
        const skip = (page -1) * size;
        const endGrainOfWood = await endGrainOfWoodModel
            .find()
            .skip(skip)
            .limit(size)
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "End grain of wood list recieved successfully",
            code: 200,
            data: {
                items: endGrainOfWood,
                pagination: {
                    currentPage: page,
                    pageSize: size,
                    totalItems,
                    totalPages: Math.ceil(totalItems / size),
                },
            },
        });
    } catch (error) {
        console.error("Error fetching end grain of wood list", error);
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
        const endGrainOfWood = await endGrainOfWoodModel.findById(id);
        if (!endGrainOfWood) {
            return res.status(404).json({
                message: "End grain of wood not found",
                code: 404,
                data: [],
            });
        }
        res.status(200).json({
            message: "End grain of wood detail recieved successfully",
            code: 200,
            data: endGrainOfWood,
        });
    } catch (error) {
        console.log("Error fetching end grain of wood detail:", error);
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
        const updatedEndGrain = await endGrainOfWoodModel.findByIdAndUpdate(
            id,
            { name, description },
            { new: true }
        );

        if (!updatedEndGrain) {
            return res.status(404).json({
                message: "End grain of wood not found",
                code: 404,
                data: [],
            });
        }

        res.status(200).json({
            message: "End grain of wood updated successfully",
            code: 200,
            data: updatedEndGrain
        });
    } catch (error ) {
        console.error("Error updating end grain of wood:", error);
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
        const deleteEndGrain = await endGrainOfWoodModel.findByIdAndDelete(id);

        if (!deleteEndGrain) {
            return res.status(404).json({
                message: "End grain of wood not found",
                code: 404,
                data: [],
            });
        }

        res.status(200).json({
            message: "End grain deleted successfully",
            code: 200,
            data: deleteEndGrain,
        });
    } catch (error) {
        console.log("Error deleting end grain of wood", error);
        res.status(500).json({
            message: "Internal Server Error",
            code: 500,
            data: []
        });
    }
}