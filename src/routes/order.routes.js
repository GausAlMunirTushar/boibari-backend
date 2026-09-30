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

const router = express.Router();
router.use(protect);
router.post("/", createOrder);
router.get("/my-orders", getMyOrders);
router.get("/", authorize("admin"), listOrders);
router.get("/:id", getOrder);
router.patch("/:id/cancel", cancelOrder);
router.patch("/:id", authorize("admin"), updateOrder);
export default router;
