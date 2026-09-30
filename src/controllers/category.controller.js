import Category from "../models/category.model.js";

const slugify = (value) =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export async function listCategories(_req, res) {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 });
  return res.json({ success: true, data: categories });
}

export async function createCategory(req, res) {
  const { name, slug, description } = req.body;
  if (!name)
    return res
      .status(400)
      .json({ success: false, message: "Category name is required" });
  const category = await Category.create({
    name,
    slug: slug ? slugify(slug) : slugify(name),
    description,
  });
  return res
    .status(201)
    .json({ success: true, message: "Category created", data: category });
}

export async function updateCategory(req, res) {
  const updates = {};
  for (const field of ["name", "description", "isActive"]) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }
  if (req.body.slug !== undefined) updates.slug = slugify(req.body.slug);
  if (updates.name && req.body.slug === undefined)
    updates.slug = slugify(updates.name);
  const category = await Category.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!category)
    return res
      .status(404)
      .json({ success: false, message: "Category not found" });
  return res.json({
    success: true,
    message: "Category updated",
    data: category,
  });
}

export async function deleteCategory(req, res) {
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true },
  );
  if (!category)
    return res
      .status(404)
      .json({ success: false, message: "Category not found" });
  return res.json({
    success: true,
    message: "Category disabled",
    data: category,
  });
}
