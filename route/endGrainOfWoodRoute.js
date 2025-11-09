import express from "express";
import { create, list, detail, update, deleteById } from "../controller/endGrainOfWoodController.js";

const endGrainOfWoodRoute = express.Router();

endGrainOfWoodRoute.post("/create", create);
endGrainOfWoodRoute.get("/list", list);
endGrainOfWoodRoute.get("/detail/:id", detail);
endGrainOfWoodRoute.put("/update/:id", update);
endGrainOfWoodRoute.delete("/delete/:id", deleteById)

export default endGrainOfWoodRoute;