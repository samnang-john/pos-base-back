import express from "express";

import { create, list, detail, update, deleteById } from "../controller/typeOfWoodController.js";

const route = express.Router();

route.post("/create", create);
route.get("/list", list);
route.get("/detail/:id", detail);
route.put("/update/:id", update);
route.delete("/delete/:id", deleteById);

export default route;