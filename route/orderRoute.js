import express from "express";
import { createOrder, downloadOrdersReportPDF, listOrders, getOrderDetail, downloadOrdersReportExcel, syncStock, downloadOrderReceipt } from "../controller/orderController.js";

const orderRoute = express.Router();

orderRoute.post("/create", createOrder);
orderRoute.get("/list", listOrders);
orderRoute.get("/detail/:id", getOrderDetail)
orderRoute.get("/pdf", downloadOrdersReportPDF);
orderRoute.get("/excel", downloadOrdersReportExcel);
orderRoute.post("/sync-stock", syncStock);
orderRoute.get("/receipt/:id", downloadOrderReceipt);

export default orderRoute;