import express from "express";
import { listStockSyncs, getStockSyncDetail, downloadStockSyncPDF } from "../controller/listStockSyncController.js";

const syncStockRoute = express.Router();

syncStockRoute.get("/stock-syncs", listStockSyncs);
syncStockRoute.get("/stock-sync/:id", getStockSyncDetail);
syncStockRoute.get("/stock-sync/:id/pdf", downloadStockSyncPDF);

export default syncStockRoute;