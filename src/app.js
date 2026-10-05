import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDatabase from "./configs/database.js";
import authRoute from "./routes/auth.routes.js";
import bookRoute from "./routes/book.routes.js";
import bookReviewRoute from "./routes/book-review.routes.js";
import categoryRoute from "./routes/category.routes.js";
import cartRoute from "./routes/cart.routes.js";
import orderRoute from "./routes/order.routes.js";
import reviewRoute from "./routes/review.routes.js";

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Database Connection
connectDatabase();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get("/health", (req, res) => {
	res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/users", authRoute);
app.use("/api/v1/books/:bookId/reviews", bookReviewRoute);
app.use("/api/v1/books", bookRoute);
app.use("/api/v1/categories", categoryRoute);
app.use("/api/v1/cart", cartRoute);
app.use("/api/v1/orders", orderRoute);
app.use("/api/v1/reviews", reviewRoute);

// 404 Handler
app.use((req, res) => {
	res.status(404).json({
		success: false,
		message: `Route not found: ${req.originalUrl}`,
	});
});

// Global Error Handler
app.use((err, req, res, next) => {
	console.error("Unhandled Error:", err);
	res.status(err.status || 500).json({
		success: false,
		message: err.message || "Internal Server Error",
	});
});

export default app;
