import express from "express";

import {create, deletedById, detail, list, update } from "../controller/categoryController.js";

const categoryRoute = express.Router();

categoryRoute.post("/create", create);
categoryRoute.get("/list", list);
categoryRoute.get("/detail/:id", detail);
categoryRoute.put("/update/:id", update);
categoryRoute.delete("/delete/:id", deletedById)

export default categoryRoute;