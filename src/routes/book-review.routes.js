import express from "express";
import {
  createReview,
  listBookReviews,
} from "../controllers/review.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router({ mergeParams: true });
router.get("/", listBookReviews);
router.post("/", protect, createReview);
export default router;
