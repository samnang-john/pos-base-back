import express from "express";
import { createOrder } from "../controller/orderController.js";

const orderRoute = express.Router();

orderRoute.post("/create", createOrder);

export default orderRoute;