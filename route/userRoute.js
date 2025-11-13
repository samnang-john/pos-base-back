import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import { create, list, detail, update, deleteById } from "../controller/userController.js";

const userRoute = express.Router();

userRoute.post("/create", upload.single("image"), create);
userRoute.get("/list", list);
userRoute.get("/detail/:id", detail);
userRoute.put("/update/:id", upload.single("image"), update);
userRoute.delete("/delete/:id", deleteById);

export default userRoute;