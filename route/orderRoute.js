import express from "express";
import { createOrder, listOrders } from "../controller/orderController.js";

const orderRoute = express.Router();

orderRoute.post("/create", createOrder);
orderRoute.get("/list", listOrders);

export default orderRoute;