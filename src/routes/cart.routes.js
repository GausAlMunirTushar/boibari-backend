import express from "express";
import {
  addCartItem,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from "../controllers/cart.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(protect);
router.get("/", getCart);
router.post("/items", addCartItem);
router.patch("/items/:bookId", updateCartItem);
router.delete("/items/:bookId", removeCartItem);
router.delete("/", clearCart);
export default router;
