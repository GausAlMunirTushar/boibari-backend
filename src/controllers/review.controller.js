import Book from "../models/book.model.js";
import Order from "../models/order.model.js";
import Review from "../models/review.model.js";

export async function listBookReviews(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, Number.parseInt(req.query.limit, 10) || 10),
  );
  const filter = { book: req.params.bookId, isApproved: true };
  const [reviews, total, aggregate] = await Promise.all([
    Review.find(filter)
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Review.countDocuments(filter),
    Review.aggregate([
      { $match: filter },
      {
        $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } },
      },
    ]),
  ]);
  return res.json({
    success: true,
    data: reviews,
    rating: {
      average: aggregate[0]?.average || 0,
      count: aggregate[0]?.count || 0,
    },
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

export async function createReview(req, res) {
  const rating = Number(req.body.rating);
  const comment = String(req.body.comment || "").trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !comment) {
    return res
      .status(400)
      .json({
        success: false,
        message: "A 1-5 rating and review comment are required",
      });
  }
  const book = await Book.findOne({ _id: req.params.bookId, isActive: true });
  if (!book)
    return res.status(404).json({ success: false, message: "Book not found" });
  const purchased = await Order.exists({
    user: req.user._id,
    status: "delivered",
    "items.book": book._id,
  });
  if (!purchased)
    return res
      .status(403)
      .json({
        success: false,
        message: "Only customers with a delivered order can review this book",
      });
  const review = await Review.create({
    user: req.user._id,
    book: book._id,
    rating,
    title: req.body.title,
    comment,
  });
  return res
    .status(201)
    .json({
      success: true,
      message: "Review submitted for moderation",
      data: review,
    });
}

export async function listReviews(req, res) {
  const filter = req.user.role === "admin" ? {} : { user: req.user._id };
  const reviews = await Review.find(filter)
    .populate("user", "name")
    .populate("book", "title slug")
    .sort({ createdAt: -1 })
    .limit(100);
  return res.json({ success: true, data: reviews });
}

export async function moderateReview(req, res) {
  if (typeof req.body.isApproved !== "boolean") {
    return res
      .status(400)
      .json({ success: false, message: "isApproved must be a boolean" });
  }
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { isApproved: req.body.isApproved },
    { new: true },
  );
  if (!review)
    return res
      .status(404)
      .json({ success: false, message: "Review not found" });
  return res.json({
    success: true,
    message: "Review moderation updated",
    data: review,
  });
}
