import Book from "../models/book.model.js";
import Order from "../models/order.model.js";
import Review from "../models/review.model.js";

/**
 * @desc    Get approved reviews for a specific book
 * @route   GET /api/v1/books/:bookId/reviews
 * @access  Public
 */
export async function listBookReviews(req, res) {
	try {
		const { bookId } = req.params;
		const { page = 1, limit = 10 } = req.query;

		const pageNum = parseInt(page, 10) || 1;
		const limitNum = Math.min(50, parseInt(limit, 10) || 10);
		const skip = (pageNum - 1) * limitNum;

		const filter = { book: bookId, isApproved: true };

		const [reviews, total, aggregate] = await Promise.all([
			Review.find(filter)
				.populate("user", "name")
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limitNum),
			Review.countDocuments(filter),
			Review.aggregate([
				{ $match: filter },
				{
					$group: {
						_id: null,
						average: { $avg: "$rating" },
						count: { $sum: 1 },
					},
				},
			]),
		]);

		return res.status(200).json({
			success: true,
			message: "Reviews fetched successfully",
			data: reviews,
			rating: {
				average: aggregate[0]?.average || 0,
				count: aggregate[0]?.count || 0,
			},
			pagination: {
				total,
				page: pageNum,
				limit: limitNum,
				totalPages: Math.ceil(total / limitNum),
			},
		});
	} catch (error) {
		console.error("Get Book Reviews Error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to fetch reviews",
			error: error.message,
		});
	}
}

/**
 * @desc    Submit a review for a book (must have purchased)
 * @route   POST /api/v1/books/:bookId/reviews
 * @access  Private
 */
export async function createReview(req, res) {
	try {
		const { bookId } = req.params;
		const rating = Number(req.body.rating);
		const comment = String(req.body.comment || "").trim();

		if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !comment) {
			return res.status(400).json({
				success: false,
				message: "A 1-5 rating and review comment are required",
			});
		}

		// Check if book exists
		const book = await Book.findOne({ _id: bookId, isActive: true });
		if (!book) {
			return res.status(404).json({
				success: false,
				message: "Book not found",
			});
		}

		// Check if user has purchased and received the book
		const purchased = await Order.exists({
			user: req.user._id,
			status: "delivered",
			"items.book": book._id,
		});

		if (!purchased) {
			return res.status(403).json({
				success: false,
				message: "Only customers with a delivered order can review this book",
			});
		}

		// Create the review
		const review = await Review.create({
			user: req.user._id,
			book: book._id,
			rating,
			title: req.body.title,
			comment,
		});

		return res.status(201).json({
			success: true,
			message: "Review submitted for moderation",
			data: review,
		});
	} catch (error) {
		console.error("Create Review Error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to submit review",
			error: error.message,
		});
	}
}

/**
 * @desc    Get all reviews (admin sees all, user sees own)
 * @route   GET /api/v1/reviews
 * @access  Private
 */
export async function listReviews(req, res) {
	try {
		const filter = req.user.role === "admin" ? {} : { user: req.user._id };

		const reviews = await Review.find(filter)
			.populate("user", "name")
			.populate("book", "title slug")
			.sort({ createdAt: -1 })
			.limit(100);

		return res.status(200).json({
			success: true,
			message: "Reviews fetched successfully",
			data: reviews,
		});
	} catch (error) {
		console.error("Get Reviews Error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to fetch reviews",
			error: error.message,
		});
	}
}

/**
 * @desc    Approve or hide a review (Admin moderation)
 * @route   PATCH /api/v1/reviews/:id/moderation
 * @access  Private / Admin
 */
export async function moderateReview(req, res) {
	try {
		if (typeof req.body.isApproved !== "boolean") {
			return res.status(400).json({
				success: false,
				message: "isApproved must be a boolean",
			});
		}

		const review = await Review.findByIdAndUpdate(
			req.params.id,
			{ isApproved: req.body.isApproved },
			{ new: true }
		);

		if (!review) {
			return res.status(404).json({
				success: false,
				message: "Review not found",
			});
		}

		return res.status(200).json({
			success: true,
			message: "Review moderation updated successfully",
			data: review,
		});
	} catch (error) {
		console.error("Moderate Review Error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to moderate review",
			error: error.message,
		});
	}
}
