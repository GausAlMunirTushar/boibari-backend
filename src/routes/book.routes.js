import express from "express";
import {
  createBook,
  deleteBook,
  getBook,
  listBooks,
  listBrowseValues,
  updateBook,
} from "../controllers/book.controller.js";
import { authorize, protect } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.get("/browse-values", listBrowseValues);
router.get("/", listBooks);
router.get("/:id", getBook);
router.post("/", protect, authorize("admin"), createBook);
router.patch("/:id", protect, authorize("admin"), updateBook);
router.delete("/:id", protect, authorize("admin"), deleteBook);
export default router;
