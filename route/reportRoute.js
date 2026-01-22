import expresss from "express";
import { summaryReport } from "../controller/reportController.js";

const reportRoute = expresss.Router();

reportRoute.get("/overview", summaryReport);

export default reportRoute;