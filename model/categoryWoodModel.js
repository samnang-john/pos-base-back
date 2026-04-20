import mongoose from "mongoose";

const categoryWoodSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true,
        unique: true,
    },
    description: {
        type: String,
        require: false,
    }
});

export default mongoose.model("category_woods", categoryWoodSchema);