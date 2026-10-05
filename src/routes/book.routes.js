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

const bookRoute = express.Router();

// Public Book Routes
bookRoute.get("/browse-values", listBrowseValues);
bookRoute.get("/", listBooks);
bookRoute.get("/:id", getBook);

// Admin Book Routes
bookRoute.post("/", protect, authorize("admin"), createBook);
bookRoute.put("/:id", protect, authorize("admin"), updateBook);
bookRoute.delete("/:id", protect, authorize("admin"), deleteBook);

export default bookRoute;

// GET: /api/v1/books/browse-values
// GET: /api/v1/books
// GET: /api/v1/books/:id
// POST: /api/v1/books
// PUT: /api/v1/books/:id
// DELETE: /api/v1/books/:id
