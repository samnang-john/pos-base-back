import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import BlacklistedToken from "../model/blacklistModel.js";
dotenv.config();

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  const isBlacklisted = await BlacklistedToken.findOne({ token });
  if (isBlacklisted) {
    return res.status(401).json({ message: "Logged out token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
