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
    cubic_meters: {
        type: Number,
        required: false, // only set when this item is priced by volume
        default: null
    },
    length: {
        type: Number,
        required: false,
        default: null
    },
    width: {
        type: Number,
        required: false,
        default: null
    },
    thickness: {
        type: Number,
        required: false,
        default: null
    },
    price: {
        type: Number,
        required: true,
    },
    cost: {
        type: Number,
        required: true,
    },
    discount: {
        type: Number,
        default: 0, // item-level discount
    },
    total: {
        type: Number,
        required: true,
    }
}, { timestamps: true });

export default mongoose.model("order_items", orderItemSchema);