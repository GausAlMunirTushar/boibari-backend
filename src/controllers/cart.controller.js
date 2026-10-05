import Book from "../models/book.model.js";
import Cart from "../models/cart.model.js";

/**
 * Helper: find existing cart or create a new empty one
 */
async function getOrCreateCart(userId) {
	return (
		(await Cart.findOne({ user: userId })) ||
		Cart.create({ user: userId, items: [] })
	);
}

/**
 * @desc    Get current user's cart with calculated totals
 * @route   GET /api/v1/cart
 * @access  Private
 */
export async function getCart(req, res) {
	try {
		const cart = await getOrCreateCart(req.user._id);
		await cart.populate(
			"items.book",
			"title slug coverImage price salePrice stock isActive"
		);

		const items = cart.items
			.filter((item) => item.book?.isActive)
			.map((item) => {
				const unitPrice =
					item.book.salePrice > 0 ? item.book.salePrice : item.book.price;
				return {
					book: item.book,
					quantity: item.quantity,
					unitPrice,
					lineTotal: unitPrice * item.quantity,
				};
			});

		return res.status(200).json({
			success: true,
			message: "Cart fetched successfully",
			data: {
				items,
				subtotal: items.reduce((sum, item) => sum + item.lineTotal, 0),
			},
		});
	} catch (error) {
		console.error("Get Cart Error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to fetch cart",
			error: error.message,
		});
	}
}

/**
 * @desc    Add a book to the cart
 * @route   POST /api/v1/cart/items
 * @access  Private
 */
export async function addCartItem(req, res) {
	try {
		const quantity = Number(req.body.quantity ?? 1);

		if (!Number.isInteger(quantity) || quantity < 1) {
			return res.status(400).json({
				success: false,
				message: "Quantity must be a positive integer",
			});
		}

		const book = await Book.findOne({ _id: req.body.bookId, isActive: true });
		if (!book) {
			return res.status(404).json({
				success: false,
				message: "Book not found",
			});
		}

		const cart = await getOrCreateCart(req.user._id);
		const item = cart.items.find((entry) => entry.book.equals(book._id));
		const nextQuantity = (item?.quantity || 0) + quantity;

		if (nextQuantity > book.stock) {
			return res.status(409).json({
				success: false,
				message: `Only ${book.stock} copies are available`,
			});
		}

		if (item) item.quantity = nextQuantity;
		else cart.items.push({ book: book._id, quantity });

		await cart.save();

		return res.status(200).json({
			success: true,
			message: "Cart updated successfully",
			data: cart,
		});
	} catch (error) {
		console.error("Add Cart Item Error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to add item to cart",
			error: error.message,
		});
	}
}

/**
 * @desc    Update quantity of a cart item
 * @route   PATCH /api/v1/cart/items/:bookId
 * @access  Private
 */
export async function updateCartItem(req, res) {
	try {
		const quantity = Number(req.body.quantity);

		if (!Number.isInteger(quantity) || quantity < 1) {
			return res.status(400).json({
				success: false,
				message: "Quantity must be a positive integer",
			});
		}

		const [cart, book] = await Promise.all([
			Cart.findOne({ user: req.user._id }),
			Book.findOne({ _id: req.params.bookId, isActive: true }),
		]);

		if (!cart || !book) {
			return res.status(404).json({
				success: false,
				message: "Cart or book not found",
			});
		}

		if (quantity > book.stock) {
			return res.status(409).json({
				success: false,
				message: `Only ${book.stock} copies are available`,
			});
		}

		const item = cart.items.find((entry) => entry.book.equals(book._id));
		if (!item) {
			return res.status(404).json({
				success: false,
				message: "Book is not in the cart",
			});
		}

		item.quantity = quantity;
		await cart.save();

		return res.status(200).json({
			success: true,
			message: "Cart updated successfully",
			data: cart,
		});
	} catch (error) {
		console.error("Update Cart Item Error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to update cart item",
			error: error.message,
		});
	}
}

/**
 * @desc    Remove a book from the cart
 * @route   DELETE /api/v1/cart/items/:bookId
 * @access  Private
 */
export async function removeCartItem(req, res) {
	try {
		const cart = await Cart.findOne({ user: req.user._id });

		if (!cart) {
			return res.status(404).json({
				success: false,
				message: "Cart not found",
			});
		}

		cart.items = cart.items.filter(
			(item) => !item.book.equals(req.params.bookId)
		);
		await cart.save();

		return res.status(200).json({
			success: true,
			message: "Cart item removed successfully",
			data: cart,
		});
	} catch (error) {
		console.error("Remove Cart Item Error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to remove cart item",
			error: error.message,
		});
	}
}

/**
 * @desc    Clear all items from the cart
 * @route   DELETE /api/v1/cart
 * @access  Private
 */
export async function clearCart(req, res) {
	try {
		const cart = await getOrCreateCart(req.user._id);
		cart.items = [];
		await cart.save();

		return res.status(200).json({
			success: true,
			message: "Cart cleared successfully",
		});
	} catch (error) {
		console.error("Clear Cart Error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to clear cart",
			error: error.message,
		});
	}
}
