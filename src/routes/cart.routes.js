import express from "express";
import {
	addCartItem,
	clearCart,
	getCart,
	removeCartItem,
	updateCartItem,
} from "../controllers/cart.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const cartRoute = express.Router();

// All cart routes are protected
cartRoute.use(protect);

// Cart Routes
cartRoute.get("/", getCart);
cartRoute.post("/items", addCartItem);
cartRoute.put("/items/:bookId", updateCartItem);
cartRoute.delete("/items/:bookId", removeCartItem);
cartRoute.delete("/", clearCart);

export default cartRoute;

// GET: /api/v1/cart
// POST: /api/v1/cart/items
// PUT: /api/v1/cart/items/:bookId
// DELETE: /api/v1/cart/items/:bookId
// DELETE: /api/v1/cart
