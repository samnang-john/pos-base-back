import categoryModel from "../model/categoryModel.js";

export const create = async (req, res) => {
    try {
        const { name, description } = req.body;
        const newCategory = new categoryModel({ name, description });
        const savedCategory = await newCategory.save();
        res.status(200).json({
            message: "Category created successfully!",
            code: 200,
            data: savedCategory
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

        const totalItems = await categoryModel.countDocuments();

        const skip = (page - 1) * size;

        const category = await categoryModel
            .find()
            .skip(skip)
            .limit(size)
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Category list retrieved successfully!",
            code: 200,
            data: {
                items: category,
                pagination: {
                    currentPage: page,
                    pageSize: size,
                    totalItems,
                    totalPages: Math.ceil(totalItems / size),
                },
            },
        });
    } catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
            code: 500,
            data: []
        });
    }
};

export const detail = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await categoryModel.findById(id);
        if (!category) {
            return res.status(404).json({
                message: "Category not found!",
                code: 404,
                data: []
            });
        }

        res.status(200).json({
            message: "Category detail retrieved successfully!",
            code: 200,
            data: category
        });
    } catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
            code: 500,
            data: []
        });
    }
}

export const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const updateCategory = await categoryModel.findByIdAndUpdate(
            id, 
            { name, description },
            { new: true }
        );

        if (!updateCategory) {
            return res.status(404).json({
                message: "Category not found!",
                code: 404,
                data: [],
            });
        }

        res.status(200).json({
            message: "Category updated successfully!",
            code: 200,
            data: updateCategory
        });
    } catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
            code: 500,
            data: []
        });
    }
};

export const deletedById = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCategory = await categoryModel.findByIdAndDelete(id);

        if (!deletedCategory) {
            return res.status(404).json({
                message: "Category not found!",
                code: 404,
                data: []
            });
        }

        res.status(200).json({
            message: "Category deleted successfully!",
            code: 200,
            data: deletedCategory
        });
    } catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
            code: 500,
            data: []
        });
    }
};