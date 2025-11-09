import mongoose from "mongoose";

const lengthOfWoodSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: false,
    }
});

export default mongoose.model("length_of_woods", lengthOfWoodSchema);