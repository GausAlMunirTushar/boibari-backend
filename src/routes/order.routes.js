import express from "express";
import {
	cancelOrder,
	createOrder,
	getMyOrders,
	getOrder,
	listOrders,
	updateOrder,
} from "../controllers/order.controller.js";
import { authorize, protect } from "../middlewares/auth.middleware.js";

const orderRoute = express.Router();

// All order routes are protected
orderRoute.use(protect);

// User Order Routes
orderRoute.post("/", createOrder);
orderRoute.get("/my-orders", getMyOrders);
orderRoute.get("/:id", getOrder);
orderRoute.put("/:id/cancel", cancelOrder);

// Admin Order Routes
orderRoute.get("/", authorize("admin"), listOrders);
orderRoute.put("/:id", authorize("admin"), updateOrder);

export default orderRoute;

// POST: /api/v1/orders
// GET: /api/v1/orders/my-orders
// GET: /api/v1/orders/:id
// PUT: /api/v1/orders/:id/cancel
// GET: /api/v1/orders (admin)
// PUT: /api/v1/orders/:id (admin)
