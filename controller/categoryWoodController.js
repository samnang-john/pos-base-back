import categoryWoodModel from "../model/categoryWoodModel.js";

export const create = async (req, res) => {
    try {
        const { name, description } = req.body;
        const newCategoryWood = new categoryWoodModel({ name, description });
        const saveCategoryWood = await newCategoryWood.save();
        res.status(200).json({
            message: "Category of wood created successfully",
            code: 200,
            data: saveCategoryWood
        });
    } catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
            code: 500,
            data: []
        });
    }
};

export const list = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const size = parseInt(req.query.size) || 10;
        
        const totalItems = await categoryWoodModel.countDocuments();

        const skip = (page - 1) * size;

        const catgoryWoods = await categoryWoodModel
            .find()
            .skip(skip)
            .limit(size)
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Category of wood list retrieved successfully",
            code: 200,
            data: {
                items: catgoryWoods,
                pagination: {
                    currentPage: page,
                    pageSize: size,
                    totalItems,
                    totalPages: Math.ceil(totalItems / size),   
                }
            }
        });
    } catch (error) {
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
        const categoryWood = await categoryWoodModel.findById(id);
        if (!categoryWood) {
            return res.status(404).json({
                message: "Category of wood not found!",
                code: 404,
                data: [],
            });
        }
        res.status(200).json({
            message: "Category of wood detail retrieved successfully",
            code: 200,
            data: categoryWood,
        })
    } catch (error) {
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
        const updateCategoryWood = await categoryWoodModel.findByIdAndUpdate(
            id,
            { name, description },
            { new: true }
        );
        if (!updateCategoryWood) {
            return res.status(404).json({
                message: "Category of wood not found!",
                code: 404,
                data: [],
            });
        }
        res.status(200).json({
            message: "Category of wood updated successfully",
            code: 200,
            data: updateCategoryWood,
        })
    } catch (error) {
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
        const deleteCategoryWood = await categoryWoodModel.findByIdAndDelete(id);
        if (!deleteCategoryWood) {
            return res.status(404).json({
                message: "Category of wood not found!",
                code: 404,
                data: [],
            });
        }
        res.status(200).json({
            message: "Category of wood deleted successfully",
            code: 200,
            data: deleteCategoryWood,
        })
    } catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
            code: 500,
            data: [],
        });
    }
}