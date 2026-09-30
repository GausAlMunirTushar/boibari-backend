import express from "express";
import {
  addAddress,
  deleteAddress,
  getMe,
  login,
  register,
  updateMe,
} from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.patch("/me", protect, updateMe);
router.post("/me/addresses", protect, addAddress);
router.delete("/me/addresses/:addressId", protect, deleteAddress);
export default router;
