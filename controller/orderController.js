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

        // 1️⃣ Calculate subtotal from item list
        let subtotal = 0;
        const orderItemsToInsert = [];

        for (const item of items) {
            const product = await Products.findById(item.product_id);

            if (!product) {
                throw new Error(`Product not found: ${item.product_id}`);
            }

            const price = product.price_of_each;
            const total = price * item.quantity;

            subtotal += total;

            orderItemsToInsert.push({
                product_id: product._id,
                quantity: item.quantity,
                price: price,
                total: total
            });
        }

        // 2️⃣ Calculate grand total
        const grandTotal = subtotal - discount + tax;

        // 3️⃣ Create order number
        const orderNumber = "INV-" + Date.now(); // simple unique number

        // 4️⃣ Insert main order
        const order = await Orders.create([{
            order_number: orderNumber,
            customer,
            subtotal,
            discount,
            tax,
            grand_total: grandTotal,
            payment_status: "paid"
        }], { session });

        const orderId = order[0]._id;

        // 5️⃣ Insert order items
        const formattedItems = orderItemsToInsert.map(x => ({ ...x, order_id: orderId }));

        await OrderItems.insertMany(formattedItems, { session });

        // 6️⃣ Commit transaction
        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
            message: "Order created successfully",
            order: order[0],
            items: formattedItems
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        console.error("Order creation error:", error);
        return res.status(500).json({ message: error.message || "Something went wrong" });
    }
};
