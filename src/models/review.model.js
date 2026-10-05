import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		book: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Book",
			required: true,
		},
		rating: {
			type: Number,
			required: [true, "Please provide a rating"],
			min: 1,
			max: 5,
		},
		title: {
			type: String,
			trim: true,
			maxlength: [120, "Review title cannot exceed 120 characters"],
			default: "",
		},
		comment: {
			type: String,
			required: [true, "Review comment is required"],
			trim: true,
			maxlength: [3000, "Review comment cannot exceed 3000 characters"],
		},
		isApproved: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
		versionKey: false,
	}
);

// One review per user per book
reviewSchema.index({ user: 1, book: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);

export default Review;
