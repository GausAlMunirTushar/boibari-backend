import cors from "cors";
import express from "express";
import authRoutes from "./routes/auth.routes.js";
import bookRoutes from "./routes/book.routes.js";
import bookReviewRoutes from "./routes/book-review.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import orderRoutes from "./routes/order.routes.js";
import reviewRoutes from "./routes/review.routes.js";

const app = express();
const allowedOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
app.use(cors({ origin: allowedOrigin === "*" ? true : allowedOrigin }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.get("/health", (_req, res) =>
  res.json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
  }),
);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", authRoutes);
app.use("/api/v1/books/:bookId/reviews", bookReviewRoutes);
app.use("/api/v1/books", bookRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/reviews", reviewRoutes);

app.use((req, res) =>
  res
    .status(404)
    .json({ success: false, message: `Route not found: ${req.originalUrl}` }),
);
app.use((error, _req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.name === "ValidationError") {
    return res.status(400).json({ success: false, message: error.message });
  }
  if (error.name === "CastError") {
    return res
      .status(400)
      .json({ success: false, message: "Invalid resource id" });
  }
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A record with this value already exists",
    });
  }
  console.error(error);
  return res.status(error.status || 500).json({
    success: false,
    message:
      error.status && error.status < 500
        ? error.message
        : "Internal server error",
  });
});

export default app;
