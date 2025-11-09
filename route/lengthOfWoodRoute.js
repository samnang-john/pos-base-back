import express from "express";
import { create, list, detail, update, deleteById } from "../controller/lengthOfWoodController.js";

const lengthOfWoodRoute = express.Router();

lengthOfWoodRoute.post("/create", create);
lengthOfWoodRoute.get("/list", list);
lengthOfWoodRoute.get("/detail/:id", detail);
lengthOfWoodRoute.put("/update/:id", update);
lengthOfWoodRoute.delete("/delete/:id", deleteById);

export default lengthOfWoodRoute;