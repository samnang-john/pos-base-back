import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "category",
        required: true
    },
    type_of_wood_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "type_of_woods",
        required: false,
    },
    end_grain_of_wood_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "end_grain_of_woods",
        required: false
    },
    length_of_wood_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "length_of_woods",
        required: false
    },
    cost_of_each: {
        type: Number,
        required: false,
    },
    number_of_wood: {
        type: Number,
        required: false
    },
    total_price_of_wood: {
        type: Number,
        required: false,
    },
    price_of_each: {
        type: Number,
        required: false
    },
    car_fee: {
        type: Number,
        required: false
    },
    image: {
        type: String,
        required: false
    },
    price_per_kube: {
        type: Number,
        required: false
    },
    cost_per_kube: {
        type: Number,
        required: false
    },
    total_cube: {
        type: Number,
        required: false,
        default: null
    }
});

export default mongoose.model("products", productSchema);