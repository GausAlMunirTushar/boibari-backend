import express from "express";
import {
  listReviews,
  moderateReview,
} from "../controllers/review.controller.js";
import { authorize, protect } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.get("/", protect, listReviews);
router.patch("/:id/moderation", protect, authorize("admin"), moderateReview);
export default router;
