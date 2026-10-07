import Category from "../models/category.model.js";

/**
 * Helper: convert a string into a URL-friendly slug
 */
const slugify = (value) => String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

slugify("Gaus Al Munir ")
// " Gaus Al Munir " = "gaus-al-munir"
/**
 * @desc    Get all active categories
 * @route   GET /api/v1/categories
 * @access  Public
 */
export async function listCategories(req, res) {
	try {
		const categories = await Category.find({ isActive: true }).sort({
			name: 1,
		});

		return res.status(200).json({
			success: true,
			message: "Categories fetched successfully",
			data: categories,
		});
	} catch (error) {
		console.error("Get Categories Error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to fetch categories",
			error: error.message,
		});
	}
}

/**
 * @desc    Create a new category
 * @route   POST /api/v1/categories
 * @access  Private / Admin
 */
export async function createCategory(req, res) {
	try {
		const { name, slug } = req.body;

		if (!name) {
			return res.status(400).json({
				success: false,
				message: "Category name is required",
			});
		}

		const category = await Category.create({
			name,
			slug: slug ? slugify(slug) : slugify(name),
		});

		return res.status(201).json({
			success: true,
			message: "Category created successfully",
			data: category,
		});
	} catch (error) {
		console.error("Create Category Error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to create category",
			error: error.message,
		});
	}
}

/**
 * @desc    Update category by ID
 * @route   PATCH /api/v1/categories/:id
 * @access  Private / Admin
 */
export async function updateCategory(req, res) {
	try {
		const { id } = req.params;
		const updates = {};

		for (const field of ["name", "description", "isActive"]) {
			if (req.body[field] !== undefined) updates[field] = req.body[field];
		}

		// Auto-generate slug from name
		if (req.body.slug !== undefined) updates.slug = slugify(req.body.slug);
		if (updates.name && req.body.slug === undefined)
			updates.slug = slugify(updates.name);

		const category = await Category.findByIdAndUpdate(id, updates, {
			new: true,
			runValidators: true,
		});

		if (!category) {
			return res.status(404).json({
				success: false,
				message: "Category not found",
			});
		}

		return res.status(200).json({
			success: true,
			message: "Category updated successfully",
			data: category,
		});
	} catch (error) {
		console.error("Update Category Error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to update category",
			error: error.message,
		});
	}
}

/**
 * @desc    Delete (soft-disable) category by ID
 * @route   DELETE /api/v1/categories/:id
 * @access  Private / Admin
 */
export async function deleteCategory(req, res) {
	try {
		const { id } = req.params;

		const category = await Category.findByIdAndUpdate(
			id,
			{ isActive: false },
			{ new: true }
		);

		if (!category) {
			return res.status(404).json({
				success: false,
				message: "Category not found",
			});
		}

		return res.status(200).json({
			success: true,
			message: "Category deleted successfully",
			data: category,
		});
	} catch (error) {
		console.error("Delete Category Error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to delete category",
			error: error.message,
		});
	}
}
