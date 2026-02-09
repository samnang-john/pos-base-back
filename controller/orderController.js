import Orders from "../model/orderModel.js";
import OrderItems from "../model/orderItemModel.js";
import Products from "../model/productModel.js";
import mongoose from "mongoose";
import { generateOrderReportPDF } from "../util/orderPdf.js";
import { generateOrderReceiptPDF } from "../util/orderReceiptPdf.js";
import { generateOrderReportExcel } from "../util/orderExcel.js";
import StockSync from "../model/stockSyncModel.js";
import StockSyncItem from "../model/stockSyncItemModel.js";

export const createOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { customer, items, discount = 0, tax = 0 } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: "Order items are required" });
        }

        let subtotal = 0;
        const orderItemsToInsert = [];

        for (const item of items) {
            if (!item.product_id || !item.quantity) {
                throw new Error("Invalid item structure");
            }

            const itemDiscount = item.discount || 0;

            const product = await Products.findOneAndUpdate(
                {
                    _id: item.product_id,
                    number_of_wood: { $gte: item.quantity }
                },
                {
                    $inc: { number_of_wood: -item.quantity }
                },
                { new: true, session }
            );

            if (!product) {
                throw new Error(`Not enough stock or product not found: ${item.product_id}`);
            }

            const price = product.price_of_each;
            const cost = product.cost_of_each;

            // price * qty - item discount
            const total = (price * item.quantity) - itemDiscount;

            subtotal += total;

            orderItemsToInsert.push({
                product_id: product._id,
                quantity: item.quantity,
                price,
                cost,
                discount: itemDiscount,
                total
            });
        }

        // order-level discount & tax
        const grandTotal = subtotal - discount + tax;

        const orderNumber = "INV-" + Date.now();

        const [order] = await Orders.create([{
            order_number: orderNumber,
            customer,
            subtotal,
            discount,
            tax,
            grand_total: grandTotal,
            payment_status: "paid"
        }], { session });

        const formattedItems = orderItemsToInsert.map(item => ({
            ...item,
            order_id: order._id
        }));

        await OrderItems.insertMany(formattedItems, { session });

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
            message: "Order created successfully",
            order,
            items: formattedItems
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        return res.status(500).json({
            message: error.message || "Something went wrong"
        });
    }
};

export const listOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const size = parseInt(req.query.size) || 10;
        const { startDate, endDate } = req.query;

        const skip = (page - 1) * size;

        const matchStage = {};

        // ✅ Optional date filter
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);

            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            matchStage.createdAt = {
                $gte: start,
                $lte: end
            };
        }

        // ✅ Total items (for pagination)
        const totalItems = await Orders.countDocuments(matchStage);

        // ✅ Aggregation for order + items
        const orders = await Orders.aggregate([
            { $match: matchStage },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: size },
            {
                $lookup: {
                    from: "order_items",
                    localField: "_id",
                    foreignField: "order_id",
                    as: "items"
                }
            }
        ]);

        res.status(200).json({
            message: "Order list retrieved successfully",
            code: 200,
            data: {
                items: orders,
                pagination: {
                    currentPage: page,
                    pageSize: size,
                    totalItems,
                    totalPages: Math.ceil(totalItems / size)
                }
            }
        });

    } catch (error) {
        console.error("Error fetching order list", error);
        res.status(500).json({
            message: "Internal Server Error",
            code: 500,
            data: []
        });
    }
};

export const getOrderDetail = async (req, res) => {
    try {
        const { id } = req.params;

        // ✅ Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }

        // ✅ Get order
        const order = await Orders.findById(id);

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        // ✅ Get order items with deep populate
        const items = await OrderItems.find({ order_id: id })
            .populate({
                path: "product_id",
                populate: [
                    {
                        path: "type_of_wood_id",
                        model: "type_of_woods",
                        select: "name description"
                    },
                    {
                        path: "end_grain_of_wood_id",
                        model: "end_grain_of_woods",
                        select: "name description"
                    },
                    {
                        path: "length_of_wood_id",
                        model: "length_of_woods",
                        select: "name description"
                    }
                ]
            });

        // ✅ Success response
        res.status(200).json({
            message: "Order detail retrieved successfully",
            code: 200,
            data: {
                order,
                items
            }
        });

    } catch (error) {
        console.error("Get order detail error:", error);

        res.status(500).json({
            message: "Internal Server Error",
            code: 500
        });
    }
};

export const downloadOrderReceipt = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Orders.findById(id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const items = await OrderItems.find({ order_id: id })
            .populate({
                path: "product_id",
                populate: [
                    { path: "type_of_wood_id", model: "type_of_woods", select: "name" },
                    { path: "end_grain_of_wood_id", model: "end_grain_of_woods", select: "name" },
                    { path: "length_of_wood_id", model: "length_of_woods", select: "name" }
                ]
            });

        generateOrderReceiptPDF(res, order, items);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to generate receipt"
        });
    }
};


export const downloadOrdersReportPDF = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const matchStage = {};

        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);

            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            matchStage.createdAt = {
                $gte: start,
                $lte: end
            };
        }

        // Get orders with items
        const orders = await Orders.aggregate([
            { $match: matchStage },
            { $sort: { createdAt: -1 } },
            {
                $lookup: {
                    from: "order_items",
                    localField: "_id",
                    foreignField: "order_id",
                    as: "items"
                }
            }
        ]);

        if (!orders.length) {
            return res.status(404).json({ message: "No orders found" });
        }

        generateOrderReportPDF(res, orders, { startDate, endDate });

    } catch (error) {
        console.error("Order report PDF error:", error);
        res.status(500).json({ message: "Failed to generate order report PDF" });
    }
};

export const downloadOrdersReportExcel = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const matchStage = {};

        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);

            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            matchStage.createdAt = {
                $gte: start,
                $lte: end
            };
        }

        const orders = await Orders.aggregate([
            { $match: matchStage },
            { $sort: { createdAt: -1 } },
            {
                $lookup: {
                    from: "order_items",
                    localField: "_id",
                    foreignField: "order_id",
                    as: "items"
                }
            }
        ]);

        if (!orders.length) {
            return res.status(404).json({ message: "No orders found" });
        }

        await generateOrderReportExcel(res, orders, { startDate, endDate });

    } catch (error) {
        console.error("Order Excel report error:", error);
        res.status(500).json({ message: "Failed to generate Excel report" });
    }
};

export const syncStock = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { items, note } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: "Stock items are required" });
        }

        // 1️⃣ Create sync header
        const syncInvoice = `SYNC-${Date.now()}`;

        const [sync] = await StockSync.create(
            [{
                sync_invoice: syncInvoice,
                note,
                total_items: items.length
            }],
            { session }
        );

        const syncItems = [];

        // 2️⃣ Loop through items
        for (const item of items) {
            if (!item.product_id || !item.quantity) {
                throw new Error("Invalid item structure");
            }

            // 3️⃣ Get product (inside transaction)
            const product = await Products.findById(item.product_id).session(session);
            if (!product) {
                throw new Error(`Product not found: ${item.product_id}`);
            }

            const beforeQty = product.number_of_wood;
            const afterQty = beforeQty + item.quantity;

            // 4️⃣ Update stock
            await Products.updateOne(
                { _id: item.product_id },
                { $inc: { number_of_wood: item.quantity } },
                { session }
            );

            // 5️⃣ Prepare sync item (IMPORTANT)
            syncItems.push({
                sync_id: sync._id,              // ✅ ObjectId
                product_id: item.product_id,    // ✅ ObjectId
                quantity: item.quantity,
                before_qty: beforeQty,
                after_qty: afterQty
            });
        }

        // 6️⃣ Insert history items
        await StockSyncItem.insertMany(syncItems, { session });

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
            message: "Stock synced successfully",
            data: {
                _id: sync._id,
                sync_invoice: sync.sync_invoice,
                note: sync.note,
                total_items: sync.total_items,
                createdAt: sync.createdAt
            }
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        console.error("Sync stock error:", error);
        return res.status(500).json({
            message: error.message || "Failed to sync stock"
        });
    }
};