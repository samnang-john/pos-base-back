import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import { create, list, detail, update, deleteById } from "../controller/productController.js";

const productRoute = express.Router();

productRoute.post("/create", upload.single("image"), create);
productRoute.get("/list", list);
productRoute.get("/detail/:id", detail);
productRoute.put("/update/:id", upload.single("image"), update);
productRoute.delete("/delete/:id", deleteById);

export default productRoute;