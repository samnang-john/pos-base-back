import Orders from "../model/orderModel.js";
import OrderItems from "../model/orderItemModel.js";
import Products from "../model/productModel.js";
import mongoose from "mongoose";
import { generateOrderReportPDF } from "../util/orderPdf.js";
import { generateOrderReceiptPDF } from "../util/orderReceiptPdf.js";
import { generateOrderReportExcel } from "../util/orderExcel.js";
import StockSync from "../model/stockSyncModel.js";
import StockSyncItem from "../model/stockSyncItemModel.js";
import Counter from "../model/Counter.js";

// ===== Helper: Generate Invoice Number =====
const getNextInvoiceNumber = async (session) => {
    const counter = await Counter.findOneAndUpdate(
        { name: "invoice" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true, session }
    );

    return `${counter.seq.toString().padStart(6, "0")}`;
};

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
            if (!item.product_id) {
                throw new Error("Invalid item structure");
            }

            const itemDiscount = item.discount || 0;
            const cubicMeters = item.cubic_meters || null;
            const length = item.length || null;
            const width = item.width || null;
            const thickness = item.thickness || null;

            // Look up product + category first so we know which stock field to validate/decrement
            const productCheck = await Products.findById(item.product_id)
                .populate("category_id")
                .session(session);

            if (!productCheck) {
                throw new Error(`Product not found: ${item.product_id}`);
            }

            const categoryName = productCheck.category_id?.name || "";
            const isLongCategory = categoryName.toLowerCase().includes("long");

            let product;

            if (isLongCategory) {
                // ===== Validate cubic meters for Long category =====
                if (cubicMeters === null || isNaN(cubicMeters) || cubicMeters <= 0) {
                    throw new Error(
                        `cubic_meters is required and must be greater than 0 for product in category 'Long' (product_id: ${item.product_id})`
                    );
                }

                if (!productCheck.price_per_kube) {
                    throw new Error(
                        `Product ${item.product_id} has no price_per_kube set, cannot price by cubic meters`
                    );
                }

                // Deduct stock from total_cube, guarded so it can't go negative
                product = await Products.findOneAndUpdate(
                    {
                        _id: item.product_id,
                        total_cube: { $gte: cubicMeters }
                    },
                    {
                        $inc: { total_cube: -cubicMeters }
                    },
                    { new: true, session }
                );

                if (!product) {
                    throw new Error(
                        `Not enough cube stock for product: ${item.product_id}`
                    );
                }
            } else {
                // ===== Validate quantity for non-Long category =====
                if (!item.quantity || isNaN(item.quantity) || item.quantity <= 0) {
                    throw new Error(
                        `quantity is required and must be greater than 0 for product: ${item.product_id}`
                    );
                }

                // Deduct stock from number_of_wood, guarded so it can't go negative
                product = await Products.findOneAndUpdate(
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
                    throw new Error(
                        `Not enough stock or product not found: ${item.product_id}`
                    );
                }
            }

            const cost = product.cost_of_each;

            let price;
            let total;

            if (isLongCategory) {
                // Priced by volume: price_per_kube * cubic_meters
                price = product.price_per_kube;
                total = (price * cubicMeters) - itemDiscount;
            } else {
                // Default: priced by unit count
                price = product.price_of_each;
                total = (price * item.quantity) - itemDiscount;
            }

            subtotal += total;

            orderItemsToInsert.push({
                product_id: product._id,
                // Long items are priced/tracked by cubic_meters, not quantity —
                // default to 0 so it still satisfies the schema's `required` quantity field
                quantity: isLongCategory ? (item.quantity || 0) : item.quantity,
                cubic_meters: cubicMeters,
                length,
                width,
                thickness,
                price,
                cost,
                discount: itemDiscount,
                total
            });
        }

        // ===== Generate sequential invoice number =====
        const orderNumber = await getNextInvoiceNumber(session);

        const grandTotal = subtotal - discount + tax;

        const [order] = await Orders.create(
            [
                {
                    order_number: orderNumber,
                    customer,
                    subtotal,
                    discount,
                    tax,
                    grand_total: grandTotal,
                    payment_status: "paid"
                }
            ],
            { session }
        );

        const formattedItems = orderItemsToInsert.map((item) => ({
            ...item,
            order_id: order._id
        }));

        await OrderItems.insertMany(formattedItems, { session });

        await session.commitTransaction();
        session.endSession();

        const itemsWithCube = formattedItems.map(item => ({
            ...item,
            cube: item.cubic_meters
        }));

        return res.status(201).json({
            message: "Order created successfully",
            order,
            items: itemsWithCube
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

        const ordersWithCube = orders.map(order => ({
            ...order,
            items: (order.items || []).map(item => ({
                ...item,
                cube: item.cubic_meters
            }))
        }));

        res.status(200).json({
            message: "Order list retrieved successfully",
            code: 200,
            data: {
                items: ordersWithCube,
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

        const itemsWithCube = items.map(item => {
            const itemObj = item.toObject();
            return {
                ...itemObj,
                cube: item.cubic_meters
            };
        });

        // ✅ Success response
        res.status(200).json({
            message: "Order detail retrieved successfully",
            code: 200,
            data: {
                order,
                items: itemsWithCube
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

        // Filter by order_date (not createdAt)
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);

            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            matchStage.order_date = {
                $gte: start,
                $lte: end
            };
        }

        const orders = await Orders.aggregate([
            { $match: matchStage },
            { $sort: { order_date: -1 } },

            {
                $lookup: {
                    from: "order_items",
                    localField: "_id",
                    foreignField: "order_id",
                    as: "items"
                }
            },

            {
                $addFields: {
                    items_count: {
                        $sum: "$items.quantity"
                    }
                }
            }
        ]);

        if (!orders.length) {
            return res.status(404).json({
                message: "No orders found"
            });
        }

        // Generate PDF
        generateOrderReportPDF(res, orders, {
            startDate,
            endDate
        });

    } catch (error) {

        console.error("Order report PDF error:", error);

        res.status(500).json({
            message: "Failed to generate order report PDF"
        });
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

// ===== Helper: Generate Stock Sync Number =====
const getNextStockSyncNumber = async (session) => {
    const counter = await Counter.findOneAndUpdate(
        { name: "stock_sync" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true, session }
    );

    return `STOCK-${counter.seq.toString().padStart(6, "0")}`;
};

export const syncStock = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { items, note } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: "Stock items are required" });
        }

        // Generate invoice
        const syncInvoice = await getNextStockSyncNumber(session);

        const [sync] = await StockSync.create(
            [{
                sync_invoice: syncInvoice,
                note,
                total_items: items.length
            }],
            { session }
        );

        const syncItems = [];

        for (const item of items) {

            const product = await Products.findById(item.product_id)
                .populate("category_id")
                .session(session);

            if (!product) {
                const err = new Error(`Product not found: ${item.product_id}`);
                err.status = 404;
                throw err;
            }

            const isLongCategory = product.category_id && 
                (product.category_id.name === "Long" || product.category_id.name.toLowerCase() === "long");

            let totalCube = null;
            if (isLongCategory) {
                const totalCubeVal = item.totalCube !== undefined ? item.totalCube : item.total_cube;
                if (totalCubeVal === undefined || totalCubeVal === null) {
                    const err = new Error(`totalCube is required for product in category 'Long' (product_id: ${item.product_id})`);
                    err.status = 400;
                    throw err;
                }
                totalCube = Number(totalCubeVal);
                if (isNaN(totalCube) || totalCube <= 0) {
                    const err = new Error(`totalCube must be a positive number for product in category 'Long' (product_id: ${item.product_id})`);
                    err.status = 400;
                    throw err;
                }
            }

            const beforeQty = product.number_of_wood;
            const afterQty = beforeQty + item.quantity;

            // Build the update — always increment quantity, optionally increment total_cube for Long category
            const productUpdate = { $inc: { number_of_wood: item.quantity } };
            if (isLongCategory && totalCube !== null) {
                productUpdate.$inc.total_cube = totalCube;
            }

            await Products.updateOne(
                { _id: item.product_id },
                productUpdate,
                { session }
            );

            syncItems.push({
                sync_id: sync._id,
                product_id: item.product_id,
                quantity: item.quantity,
                before_qty: beforeQty,
                after_qty: afterQty,
                total_cube: totalCube
            });
        }

        const insertedItems = await StockSyncItem.insertMany(syncItems, { session });

        await session.commitTransaction();
        session.endSession();

        const totalCubeSum = insertedItems.reduce((sum, i) => sum + (i.total_cube || 0), 0);

        return res.status(201).json({
            message: "Stock synced successfully",
            data: {
                ...sync.toObject(),
                totalCube: totalCubeSum || null,
                items: insertedItems.map(i => ({
                    product_id: i.product_id,
                    quantity: i.quantity,
                    before_qty: i.before_qty,
                    after_qty: i.after_qty,
                    total_cube: i.total_cube
                }))
            }
        });

    } catch (error) {

        await session.abortTransaction();
        session.endSession();

        console.error("Sync stock error:", error);

        return res.status(error.status || 500).json({
            message: error.message || "Failed to sync stock"
        });
    }
};