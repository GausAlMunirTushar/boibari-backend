import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";

export const protect = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;
  if (!token)
    return res
      .status(401)
      .json({ success: false, message: "Authentication required" });
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is required");
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
  const user = await User.findById(decoded.id);
  if (!user)
    return res
      .status(401)
      .json({ success: false, message: "Account no longer exists" });
  req.user = user;
  next();
});

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to access this resource",
      });
    }
    next();
  };
}
