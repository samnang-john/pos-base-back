import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";

import route from "./route/typeOfWoodRoute.js";
import endGrainOfWoodRoute from "./route/endGrainOfWoodRoute.js";
import lengthOfWoodRoute from "./route/lengthOfWoodRoute.js";
import productRoute from "./route/productRoute.js";
import userRoute from "./route/userRoute.js";
import authRoute from "./route/authRoute.js";
import orderRoute from "./route/orderRoute.js";
import syncStockRoute from "./route/syncStockRoute.js";
import { authenticate } from "./middleware/authMiddleware.js";

const app = express();
dotenv.config();

/* =======================
   CORS CONFIG (FIXED)
======================= */
const allowedOrigins = [
  "http://localhost:5173",
  "https://wood-pos.vercel.app"
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (Postman, mobile apps)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  credentials: true
}));

/* =======================
   MIDDLEWARE
======================= */
app.use(bodyParser.json());
app.use("/uploads", express.static("public/upload"));

/* =======================
   ROUTES
======================= */
app.use("/api/auth", authRoute); // 🔓 auth first (no token required)

app.use("/api/type-of-wood", authenticate, route);
app.use("/api/end-grain-of-wood", authenticate, endGrainOfWoodRoute);
app.use("/api/length-of-wood", authenticate, lengthOfWoodRoute);
app.use("/api/product", authenticate, productRoute);
app.use("/api/user", authenticate, userRoute);
app.use("/api/order", authenticate, orderRoute);
app.use("/api/stock", authenticate, syncStockRoute);

/* =======================
   SERVER + DB
======================= */
const PORT = process.env.PORT || 5000;
const MONGOURL = process.env.MONGO_URL;

mongoose
  .connect(MONGOURL)
  .then(() => {
    console.log("✅ Database connected successfully");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error);
  });
