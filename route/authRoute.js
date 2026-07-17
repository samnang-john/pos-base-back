import express from "express";
import { login, logout, me, refresh } from "../controller/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const authRoute = express.Router();

authRoute.post("/login", login);
authRoute.post("/refresh", refresh);
authRoute.post("/logout", logout);
authRoute.get("/me", authenticate, me);

export default authRoute;