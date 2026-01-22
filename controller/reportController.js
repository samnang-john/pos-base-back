import Product from "../model/productModel.js";
import Order from "../model/orderModel.js";
import OrderItem from "../model/orderItemModel.js";

export const summaryReport = async (req, res) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        /* ---------------- PRODUCTS ---------------- */
        const productResult = await Product.aggregate([
            {
                $group: {
                    _id: null,
                    total_products: { $sum: 1 },
                    total_stock_qty: { $sum: "$number_of_wood" }
                }
            }
        ]);

        /* ---------------- ORDERS (INCOME) ---------------- */
        const orderResult = await Order.aggregate([
            { $match: { createdAt: { $gte: todayStart } } },
            {
                $group: {
                    _id: null,
                    orders_today: { $sum: 1 },
                    income_today: { $sum: "$grand_total" }
                }
            }
        ]);

        /* ---------------- EXPENSE (COST OF GOODS) ---------------- */
        const expenseResult = await OrderItem.aggregate([
            { $match: { createdAt: { $gte: todayStart } } },
            {
                $group: {
                    _id: null,
                    expense_today: {
                        $sum: { $multiply: ["$cost", "$quantity"] }
                    }
                }
            }
        ]);

        const products = productResult[0] || {
            total_products: 0,
            total_stock_qty: 0
        };

        const orders = orderResult[0] || {
            orders_today: 0,
            income_today: 0
        };

        const expenses = expenseResult[0] || {
            expense_today: 0
        };

        const total_profit = orders.income_today - expenses.expense_today;

        res.status(200).json({
            message: "Summary report retrieved successfully",
            data: {
                total_products: products.total_products,
                total_stock_qty: products.total_stock_qty,
                orders_today: orders.orders_today,
                income_today: orders.income_today,
                expense_today: expenses.expense_today,
                total_revenue: orders.income_today,
                total_profit
            }
        });

    } catch (error) {
        console.error("Summary report error:", error);
        res.status(500).json({
            message: "Failed to retrieve summary report"
        });
    }
};
