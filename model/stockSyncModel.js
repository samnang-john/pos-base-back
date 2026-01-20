// model/stockSyncModel.js
import mongoose from "mongoose";

const stockSyncSchema = new mongoose.Schema({
    sync_invoice: {
        type: String,
        required: true,
        unique: true
    },
    note: {
        type: String
    },
    total_items: {
        type: Number,
        default: 0
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    }
}, {
    timestamps: true // createdAt = sync date
});

export default mongoose.model("stock_syncs", stockSyncSchema);
