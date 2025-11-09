import mongoose from "mongoose";

const endGrainOfWoodSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
        required: false,
    }
});

export default mongoose.model("end_grain_of_woods", endGrainOfWoodSchema);