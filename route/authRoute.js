import express from "express";
import { login, logout, me } from "../controller/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const authRoute = express.Router();

authRoute.post("/login", login);
authRoute.post("/logout", logout);
authRoute.get("/me", authenticate, me);

export default authRoute;