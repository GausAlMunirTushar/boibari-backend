import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
	{
		orderNumber: {
			type: String,
			required: [true, "Order number is required"],
			unique: true,
		},
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: [true, "User ID is required"],
		},
		items: [
			{
				book: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Book",
					required: true,
				},
				title: {
					type: String,
					required: true,
				},
				coverImage: {
					type: String,
					default: "",
				},
				unitPrice: {
					type: Number,
					required: true,
					min: [0, "Unit price cannot be negative"],
				},
				quantity: {
					type: Number,
					required: true,
					min: [1, "Quantity must be at least 1"],
				},
			},
		],
		subtotal: {
			type: Number,
			required: [true, "Subtotal is required"],
			min: [0, "Subtotal cannot be negative"],
		},
		deliveryFee: {
			type: Number,
			required: [true, "Delivery fee is required"],
			min: [0, "Delivery fee cannot be negative"],
		},
		totalAmount: {
			type: Number,
			required: [true, "Total amount is required"],
			min: [0, "Total amount cannot be negative"],
		},
		shippingAddress: {
			type: mongoose.Schema.Types.Mixed,
			required: [true, "Shipping address is required"],
		},
		phone: {
			type: String,
			required: [true, "Contact phone number is required"],
			trim: true,
		},
		paymentMethod: {
			type: String,
			enum: ["cod", "manual"],
			default: "cod",
		},
		paymentStatus: {
			type: String,
			enum: ["unpaid", "paid", "refunded"],
			default: "unpaid",
		},
		status: {
			type: String,
			enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
			default: "pending",
		},
		trackingReference: {
			type: String,
			trim: true,
			default: "",
		},
		stockRestored: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
		versionKey: false,
	}
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
