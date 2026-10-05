import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: [true, "User ID is required"],
			unique: true,
		},
		items: [
			{
				book: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Book",
					required: true,
				},
				quantity: {
					type: Number,
					required: true,
					min: [1, "Quantity must be at least 1"],
					default: 1,
				},
			},
		],
	},
	{
		timestamps: true,
		versionKey: false,
	}
);

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
