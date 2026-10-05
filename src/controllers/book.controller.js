import mongoose from "mongoose";
import Book from "../models/book.model.js";

/**
 * Helper: escape special regex characters
 */
const escapeRegex = (value) =>
	String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Helper: convert a string into a URL-friendly slug
 */
const slugify = (value) =>
	String(value)
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");

/**
 * @desc    Get all books with filtering, search, sorting and pagination
 * @route   GET /api/v1/books
 * @access  Public
 */
export async function listBooks(req, res) {
	try {
		const {
			keyword,
			category,
			author,
			publisher,
			minPrice,
			maxPrice,
			inStock,
			featured,
			sort,
			page = 1,
			limit = 12,
		} = req.query;

		// Build filter query
		const filter = { isActive: true };

		// Keyword search using text index
		if (keyword?.trim()) {
			filter.$text = { $search: keyword.trim() };
		}

		// Category filter (ObjectId)
		if (category) {
			if (mongoose.isValidObjectId(category)) {
				filter.category = category;
			} else {
				return res.status(400).json({
					success: false,
					message: "Invalid category id",
				});
			}
		}

		// Author filter
		if (author) {
			filter.authors = { $regex: escapeRegex(author), $options: "i" };
		}

		// Publisher filter
		if (publisher) {
			filter.publisher = { $regex: escapeRegex(publisher), $options: "i" };
		}

		// Stock availability filter
		if (inStock === "true") {
			filter.stock = { $gt: 0 };
		}

		// Featured filter
		if (featured === "true") {
			filter.isFeatured = true;
		}

		// Price range filter
		if (minPrice !== undefined || maxPrice !== undefined) {
			filter.price = {};
			if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
			if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
		}

		// Sorting options
		const sortOptions = {
			newest: { createdAt: -1 },
			price_asc: { price: 1 },
			price_desc: { price: -1 },
			title_asc: { title: 1 },
		};

		const pageNum = parseInt(page, 10) || 1;
		const limitNum = Math.min(50, parseInt(limit, 10) || 12);
		const skip = (pageNum - 1) * limitNum;

		const [books, total] = await Promise.all([
			Book.find(filter)
				.populate("category", "name slug")
				.sort(sortOptions[sort] || sortOptions.newest)
				.skip(skip)
				.limit(limitNum),
			Book.countDocuments(filter),
		]);

		return res.status(200).json({
			success: true,
			message: "Books fetched successfully",
			data: books,
			pagination: {
				total,
				page: pageNum,
				limit: limitNum,
				totalPages: Math.ceil(total / limitNum),
			},
		});
	} catch (error) {
		console.error("Get Books Error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to fetch books",
			error: error.message,
		});
	}
}

/**
 * @desc    Get single book by ID or slug
 * @route   GET /api/v1/books/:id
 * @access  Public
 */
export async function getBook(req, res) {
	try {
		const { id } = req.params;

		const byId = mongoose.isValidObjectId(id) ? { _id: id } : { slug: id };
		const book = await Book.findOne({ ...byId, isActive: true }).populate(
			"category",
			"name slug"
		);

		if (!book) {
			return res.status(404).json({
				success: false,
				message: "Book not found",
			});
		}

		return res.status(200).json({
			success: true,
			message: "Book fetched successfully",
			data: book,
		});
	} catch (error) {
		console.error("Get Book Error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to fetch book",
			error: error.message,
		});
	}
}

/**
 * @desc    Create a new book
 * @route   POST /api/v1/books
 * @access  Private / Admin
 */
export async function createBook(req, res) {
	try {
		const { title, category, price, stock } = req.body;

		if (!title || !category || price === undefined || stock === undefined) {
			return res.status(400).json({
				success: false,
				message: "Title, category, price, and stock are required",
			});
		}

		const book = await Book.create({
			...req.body,
			slug: req.body.slug ? slugify(req.body.slug) : slugify(title),
		});

		return res.status(201).json({
			success: true,
			message: "Book created successfully",
			data: book,
		});
	} catch (error) {
		console.error("Create Book Error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to create book",
			error: error.message,
		});
	}
}

/**
 * @desc    Update book by ID
 * @route   PATCH /api/v1/books/:id
 * @access  Private / Admin
 */
export async function updateBook(req, res) {
	try {
		const { id } = req.params;
		const updates = { ...req.body };

		// Prevent overwriting internal fields
		delete updates._id;
		delete updates.createdAt;
		delete updates.updatedAt;

		// Auto-generate slug
		if (updates.slug) updates.slug = slugify(updates.slug);
		else if (updates.title) updates.slug = slugify(updates.title);

		const book = await Book.findByIdAndUpdate(id, updates, {
			new: true,
			runValidators: true,
		});

		if (!book) {
			return res.status(404).json({
				success: false,
				message: "Book not found",
			});
		}

		return res.status(200).json({
			success: true,
			message: "Book updated successfully",
			data: book,
		});
	} catch (error) {
		console.error("Update Book Error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to update book",
			error: error.message,
		});
	}
}

/**
 * @desc    Delete (soft-disable) book by ID
 * @route   DELETE /api/v1/books/:id
 * @access  Private / Admin
 */
export async function deleteBook(req, res) {
	try {
		const { id } = req.params;

		const book = await Book.findByIdAndUpdate(
			id,
			{ isActive: false },
			{ new: true }
		);

		if (!book) {
			return res.status(404).json({
				success: false,
				message: "Book not found",
			});
		}

		return res.status(200).json({
			success: true,
			message: "Book deleted successfully",
		});
	} catch (error) {
		console.error("Delete Book Error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to delete book",
			error: error.message,
		});
	}
}

/**
 * @desc    Get browse data (authors and publishers)
 * @route   GET /api/v1/books/browse-values
 * @access  Public
 */
export async function listBrowseValues(req, res) {
	try {
		const [authors, publishers] = await Promise.all([
			Book.distinct("authors", { isActive: true }),
			Book.distinct("publisher", { isActive: true, publisher: { $ne: "" } }),
		]);

		return res.status(200).json({
			success: true,
			message: "Browse values fetched successfully",
			data: { authors: authors.sort(), publishers: publishers.sort() },
		});
	} catch (error) {
		console.error("Get Browse Values Error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to fetch browse values",
			error: error.message,
		});
	}
}
