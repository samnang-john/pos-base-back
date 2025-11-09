import mongoose from "mongoose";

const typeOfWoodShema = new mongoose.Schema({
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

export default mongoose.model("type_of_woods", typeOfWoodShema);