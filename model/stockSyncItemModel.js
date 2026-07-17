// model/stockSyncItemModel.js
import mongoose from "mongoose";

const stockSyncItemSchema = new mongoose.Schema({
    sync_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "stock_syncs",
        required: true
    },
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    before_qty: {
        type: Number,
        required: true
    },
    after_qty: {
        type: Number,
        required: true
    },
    total_cube: {
        type: Number,
        required: false,
        default: null
    }
}, {
    timestamps: true
});

export default mongoose.model("stock_sync_items", stockSyncItemSchema);
