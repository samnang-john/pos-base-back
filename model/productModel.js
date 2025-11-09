import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    type_of_wood_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "type_of_woods",
        required: true,
    },
    end_grain_of_wood_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "end_grain_of_woods",
        required: true
    },
    length_of_wood_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "length_of_woods",
        required: true
    },
    cost_of_each: {
        type: Number,
        required: true,
    },
    number_of_wood: {
        type: Number,
        required: true
    },
    total_price_of_wood: {
        type: Number,
        required: true,
    },
    price_of_each: {
        type: Number,
        required: true
    },
    car_fee: {
        type: Number,
        required: true
    },
    image: {
        type: String,
        required: false
    }
});

export default mongoose.model("products", productSchema);