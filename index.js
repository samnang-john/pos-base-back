import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import route from "./route/typeOfWoodRoute.js";
import endGrainOfWoodRoute from "./route/endGrainOfWoodRoute.js";
import lengthOfWoodRoute from "./route/lengthOfWoodRoute.js";
import productRoute from "./route/productRoute.js";

const app = express();

dotenv.config();
app.use(bodyParser.json());
app.use('/uploads', express.static('public/upload'));

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use("/api/type-of-wood", route);
app.use("/api/end-grain-of-wood", endGrainOfWoodRoute);
app.use("/api/length-of-wood", lengthOfWoodRoute);
app.use("/api/product", productRoute);

const PORT = process.env.PORT || 5000;
const MONGOURL = process.env.MONGO_URL;

mongoose
  .connect(MONGOURL)
  .then(() => {
    console.log("Database connected successfully.");
    app.listen(PORT, () => {
      console.log(`Server is running on port : ${PORT}`);
    });
  })
  .catch((error) => console.log(error));