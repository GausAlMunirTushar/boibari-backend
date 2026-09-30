import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 240 },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    isbn: { type: String, trim: true, default: "", index: true },
    description: { type: String, trim: true, default: "" },
    authors: { type: [String], default: [] },
    publisher: { type: String, trim: true, default: "" },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    language: { type: String, trim: true, default: "Bangla" },
    edition: { type: String, trim: true, default: "" },
    publicationDate: { type: Date, default: null },
    coverImage: { type: String, trim: true, default: "" },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, default: 0, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

bookSchema.index({
  title: "text",
  authors: "text",
  publisher: "text",
  description: "text",
});
bookSchema.virtual("effectivePrice").get(function () {
  return this.salePrice > 0 ? this.salePrice : this.price;
});
bookSchema.set("toJSON", { virtuals: true });

export default mongoose.model("Book", bookSchema);
