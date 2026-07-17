import jwt from "jsonwebtoken";
import crypto from "crypto";
import RefreshToken from "../model/refreshTokenModel.js";

export const generateTokens = async (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
  );

  const refreshToken = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7d

  await RefreshToken.create({ token: refreshToken, userId, expiresAt });

  return { accessToken, refreshToken };
};