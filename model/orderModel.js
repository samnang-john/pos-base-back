import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    order_number: {
        type: String,
        required: true,
        unique: true
    },
    customer: {
        type: String
    },
    subtotal: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    tax: {
        type: Number,
        default: 0,
    },
    grand_total: {
        type: Number,
        required: true,
    },
    payment_status: {
        type: String,
        enum: ["paid", "unpaid", "partial"],
        default: "unpaid",
    },
    order_date: {
        type: Date,
        default: Date.now,
    }
}, { timestamps: true });

export default mongoose.model("orders", orderSchema);