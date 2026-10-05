import express from "express";
import {
	listReviews,
	moderateReview,
} from "../controllers/review.controller.js";
import { authorize, protect } from "../middlewares/auth.middleware.js";

const reviewRoute = express.Router();

// Protected Routes
reviewRoute.get("/", protect, listReviews);

// Admin Routes
reviewRoute.put("/:id/moderation", protect, authorize("admin"), moderateReview);

export default reviewRoute;

// GET: /api/v1/reviews
// PUT: /api/v1/reviews/:id/moderation (admin)
