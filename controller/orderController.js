import Orders from "../model/orderModel.js";
import OrderItems from "../model/orderItemModel.js";
import Products from "../model/productModel.js";
import mongoose from "mongoose";
import { generateOrderReportPDF } from "../util/orderPdf.js";

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

        // 1️⃣ LOOP THROUGH ITEMS
        for (const item of items) {
            if (!item.product_id || !item.quantity) {
                throw new Error("Invalid item structure");
            }

            // 2️⃣ ATOMIC STOCK UPDATE (Best Practice)
            const product = await Products.findOneAndUpdate(
                {
                    _id: item.product_id,
                    number_of_wood: { $gte: item.quantity } // ensure enough stock
                },
                {
                    $inc: { number_of_wood: -item.quantity } // deduct stock atomically
                },
                { new: true, session }
            );

            if (!product) {
                throw new Error(`Not enough stock or product not found: ${item.product_id}`);
            }

            const price = product.price_of_each;
            const total = price * item.quantity;

            subtotal += total;

            orderItemsToInsert.push({
                product_id: product._id,
                quantity: item.quantity,
                price,
                total
            });
        }

        // 3️⃣ Calculate grand total
        const grandTotal = subtotal - discount + tax;

        // 4️⃣ Generate invoice number
        const orderNumber = "INV-" + Date.now();

        // 5️⃣ Create main order
        const [order] = await Orders.create([{
            order_number: orderNumber,
            customer,
            subtotal,
            discount,
            tax,
            grand_total: grandTotal,
            payment_status: "paid"
        }], { session });

        // 6️⃣ Attach order ID to each item
        const formattedItems = orderItemsToInsert.map(item => ({
            ...item,
            order_id: order._id
        }));

        // 7️⃣ Insert order items
        await OrderItems.insertMany(formattedItems, { session });

        // 8️⃣ Commit transaction
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

        console.error("Order creation error:", error);
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
