import express from "express";
import {
	register,
	login,
	getMe,
	updateMe,
	addAddress,
	deleteAddress,
} from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const authRoute = express.Router();

// Public Routes
authRoute.post("/register", register);
authRoute.post("/login", login);

// Protected Routes
authRoute.get("/me", protect, getMe);
authRoute.put("/me", protect, updateMe);
authRoute.post("/me/addresses", protect, addAddress);
authRoute.delete("/me/addresses/:addressId", protect, deleteAddress);

export default authRoute;
