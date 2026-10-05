import express from "express";
import {
	createCategory,
	deleteCategory,
	listCategories,
	updateCategory,
} from "../controllers/category.controller.js";
import { authorize, protect } from "../middlewares/auth.middleware.js";

const categoryRoute = express.Router();

// Public Routes
categoryRoute.get("/", listCategories);

// Admin Routes
categoryRoute.post("/", protect, authorize("admin"), createCategory);
categoryRoute.put("/:id", protect, authorize("admin"), updateCategory);
categoryRoute.delete("/:id", protect, authorize("admin"), deleteCategory);

export default categoryRoute;

// GET: /api/v1/categories
// POST: /api/v1/categories
// PUT: /api/v1/categories/:id
// DELETE: /api/v1/categories/:id
