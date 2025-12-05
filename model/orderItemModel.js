import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
    order_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "orders",
        required: true,
    },
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    price: {
        type: Number, // price per item when sold
        required: true,
    },
    total: {
        type: Number, // quantity * price
        required: true,
    }
}, { 
    timestamps: true 
});

export default mongoose.model("order_items", orderItemSchema);