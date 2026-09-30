import mongoose from "mongoose";
import Book from "../models/book.model.js";
const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const slugify = (value) =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export async function listBooks(req, res) {
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
  } = req.query;
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, Number.parseInt(req.query.limit, 10) || 12),
  );
  const filter = { isActive: true };
  if (keyword?.trim()) filter.$text = { $search: keyword.trim() };
  if (category) {
    if (mongoose.isValidObjectId(category)) filter.category = category;
    else
      return res
        .status(400)
        .json({ success: false, message: "Invalid category id" });
  }
  if (author) filter.authors = { $regex: escapeRegex(author), $options: "i" };
  if (publisher)
    filter.publisher = { $regex: escapeRegex(publisher), $options: "i" };
  if (inStock === "true") filter.stock = { $gt: 0 };
  if (featured === "true") filter.isFeatured = true;
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    if (Object.values(filter.price).some(Number.isNaN)) {
      return res
        .status(400)
        .json({ success: false, message: "Price filters must be numbers" });
    }
  }
  const sorts = {
    newest: { createdAt: -1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    title_asc: { title: 1 },
  };
  const [books, total] = await Promise.all([
    Book.find(filter)
      .populate("category", "name slug")
      .sort(sorts[sort] || sorts.newest)
      .skip((page - 1) * limit)
      .limit(limit),
    Book.countDocuments(filter),
  ]);
  return res.json({
    success: true,
    data: books,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

export async function getBook(req, res) {
  const byId = mongoose.isValidObjectId(req.params.id)
    ? { _id: req.params.id }
    : { slug: req.params.id };
  const book = await Book.findOne({ ...byId, isActive: true }).populate(
    "category",
    "name slug",
  );
  if (!book)
    return res.status(404).json({ success: false, message: "Book not found" });
  return res.json({ success: true, data: book });
}

export async function createBook(req, res) {
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
  return res
    .status(201)
    .json({ success: true, message: "Book created", data: book });
}

export async function updateBook(req, res) {
  const updates = { ...req.body };
  delete updates._id;
  delete updates.createdAt;
  delete updates.updatedAt;
  if (updates.slug) updates.slug = slugify(updates.slug);
  else if (updates.title) updates.slug = slugify(updates.title);
  const book = await Book.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!book)
    return res.status(404).json({ success: false, message: "Book not found" });
  return res.json({ success: true, message: "Book updated", data: book });
}

export async function deleteBook(req, res) {
  const book = await Book.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true },
  );
  if (!book)
    return res.status(404).json({ success: false, message: "Book not found" });
  return res.json({ success: true, message: "Book disabled", data: book });
}

export async function listBrowseValues(_req, res) {
  const [authors, publishers] = await Promise.all([
    Book.distinct("authors", { isActive: true }),
    Book.distinct("publisher", { isActive: true, publisher: { $ne: "" } }),
  ]);
  return res.json({
    success: true,
    data: { authors: authors.sort(), publishers: publishers.sort() },
  });
}
