import express from "express";
import {
	createReview,
	listBookReviews,
} from "../controllers/review.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const bookReviewRoute = express.Router({ mergeParams: true });

// Public Routes
bookReviewRoute.get("/", listBookReviews);

// Protected Routes
bookReviewRoute.post("/", protect, createReview);

export default bookReviewRoute;

// GET: /api/v1/books/:bookId/reviews
// POST: /api/v1/books/:bookId/reviews
