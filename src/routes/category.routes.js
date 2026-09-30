import express from "express";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "../controllers/category.controller.js";
import { authorize, protect } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.get("/", listCategories);
router.post("/", protect, authorize("admin"), createCategory);
router.patch("/:id", protect, authorize("admin"), updateCategory);
router.delete("/:id", protect, authorize("admin"), deleteCategory);
export default router;
