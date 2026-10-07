import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: [true, "Book title is required"],
			trim: true,
			maxlength: [350, "Title cannot exceed 350 characters"],
		},
		slug: {
			type: String,
			required: [true, "Slug is required"],
			trim: true,
			lowercase: true,
			unique: true,
		},
		isbn: {
			type: String,
			trim: true,
			default: "",
		},
		description: {
			type: String,
			trim: true,
			default: "",
		},
		authors: {
			type: [String],
			default: [],
		},
		publisher: {
			type: String,
			trim: true,
			default: "",
		},
		category: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Category",
			required: [true, "Category is required"],
		},
		language: {
			type: String,
			trim: true,
			default: "English",
		},
		edition: {
			type: String,
			trim: true,
			default: "",
		},
		publicationDate: {
			type: Date,
			default: null,
		},
		coverImage: {
			type: String,
			trim: true,
			default: "",
		},
		price: {
			type: Number,
			required: [true, "Book price is required"],
			min: [0, "Price cannot be negative"], 
		},
		salePrice: {
			type: Number,
			default: 0,
			min: [0, "Sale price cannot be negative"],
		},
		stock: {
			type: Number,
			required: [true, "Stock quantity is required"],
			min: [0, "Stock cannot be negative"],
			default: 0,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		isFeatured: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
		versionKey: false,
	}
);

// Text index for keyword search
bookSchema.index({
	title: "text",
	authors: "text",
	publisher: "text",
	description: "text",
});

// Virtual property for effective price
bookSchema.virtual("effectivePrice").get(function () {
	return this.salePrice > 0 ? this.salePrice : this.price;
});

bookSchema.set("toJSON", { virtuals: true });

const Book = mongoose.model("Book", bookSchema);

export default Book;
