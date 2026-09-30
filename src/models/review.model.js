import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 120, default: "" },
    comment: { type: String, required: true, trim: true, maxlength: 3000 },
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);
reviewSchema.index({ user: 1, book: 1 }, { unique: true });

export default mongoose.model("Review", reviewSchema);
