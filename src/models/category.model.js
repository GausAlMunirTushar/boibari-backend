import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, "Category name is required"],
			trim: true,
			unique: true,
		},
		slug: {
			type: String,
			required: [true, "Slug is required"],
			trim: true,
			lowercase: true,
			unique: true,
		},
		description: {
			type: String,
			trim: true,
			default: "",
		},
		isActive: {
			type: Boolean,
			default: true,
		},
	},
	{
		timestamps: true,
		versionKey: false,
	}
);

const Category = mongoose.model("Category", categorySchema);

export default Category;
