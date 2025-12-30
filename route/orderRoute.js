import express from "express";
import { createOrder, downloadOrdersReportPDF, listOrders, downloadOrdersReportExcel, syncStock } from "../controller/orderController.js";

const orderRoute = express.Router();

orderRoute.post("/create", createOrder);
orderRoute.get("/list", listOrders);
orderRoute.get("/pdf", downloadOrdersReportPDF);
orderRoute.get("/excel", downloadOrdersReportExcel);
orderRoute.post("/sync-stock", syncStock);

export default orderRoute;