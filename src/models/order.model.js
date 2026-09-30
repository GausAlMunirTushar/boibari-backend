import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        book: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Book",
          required: true,
        },
        title: { type: String, required: true },
        coverImage: { type: String, default: "" },
        unitPrice: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    shippingAddress: { type: mongoose.Schema.Types.Mixed, required: true },
    phone: { type: String, required: true, trim: true },
    paymentMethod: { type: String, enum: ["cod", "manual"], default: "cod" },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
    trackingReference: { type: String, trim: true, default: "" },
    stockRestored: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

export default mongoose.model("Order", orderSchema);
