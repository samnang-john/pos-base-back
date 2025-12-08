import Orders from "../model/orderModel.js";
import OrderItems from "../model/orderItemModel.js";
import Products from "../model/productModel.js";
import mongoose from "mongoose";

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
