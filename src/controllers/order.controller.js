import mongoose from "mongoose";
import Book from "../models/book.model.js";
import Cart from "../models/cart.model.js";
import Order from "../models/order.model.js";

/**
 * Helper: restore stock for order items
 */
async function restoreInventory(items) {
	for (const item of items) {
		await Book.findByIdAndUpdate(item.book, {
			$inc: { stock: item.quantity },
		});
	}
}

/**
 * Helper: snapshot the shipping address
 */
function snapshotAddress(input) {
	if (!input || !input.recipient || !input.phone || !input.street || !input.city) {
		return null;
	}
	return {
		label: input.label || "Home",
		recipient: input.recipient,
		phone: input.phone,
		street: input.street,
		area: input.area || "",
		city: input.city,
		district: input.district || "",
		postalCode: input.postalCode || "",
		country: input.country || "Bangladesh",
	};
}

/**
 * @desc    Create a new order from user's cart
 * @route   POST /api/v1/orders
 * @access  Private
 */
export async function createOrder(req, res) {
	try {
		const cart = await Cart.findOne({ user: req.user._id });

		if (!cart?.items.length) {
			return res.status(400).json({
				success: false,
				message: "Your cart is empty",
			});
		}

		// Validate shipping address
		const shippingAddress = snapshotAddress(req.body.shippingAddress);
		if (!shippingAddress) {
			return res.status(400).json({
				success: false,
				message: "A complete delivery address is required",
			});
		}

		// Validate payment method
		const paymentMethod = req.body.paymentMethod || "cod";
		if (!["cod", "manual"].includes(paymentMethod)) {
			return res.status(400).json({
				success: false,
				message: "Payment method must be cod or manual",
			});
		}

		// Build deduplicated quantity map from cart
		const quantities = new Map();
		for (const item of cart.items) {
			quantities.set(
				String(item.book),
				(quantities.get(String(item.book)) || 0) + item.quantity
			);
		}

		// Verify stock and calculate totals
		const reservations = [];
		const items = [];
		let subtotal = 0;

		for (const [bookId, quantity] of quantities) {
			const book = await Book.findOneAndUpdate(
				{ _id: bookId, isActive: true, stock: { $gte: quantity } },
				{ $inc: { stock: -quantity } },
				{ new: true }
			);

			if (!book) {
				// Rollback already reserved stock
				await restoreInventory(reservations);
				return res.status(409).json({
					success: false,
					message: "A book is unavailable or has insufficient stock",
				});
			}

			reservations.push({ book: book._id, quantity });
			const unitPrice = book.salePrice > 0 ? book.salePrice : book.price;
			subtotal += unitPrice * quantity;
			items.push({
				book: book._id,
				title: book.title,
				coverImage: book.coverImage,
				unitPrice,
				quantity,
			});
		}

		// Calculate delivery fee and total
		const deliveryFee = Math.max(0, Number(process.env.DELIVERY_FEE) || 60);

		// Generate unique order number
		const orderNumber = `BB-${Date.now().toString(36).toUpperCase()}-${new mongoose.Types.ObjectId().toString().slice(-6).toUpperCase()}`;

		// Create the order
		const order = await Order.create({
			orderNumber,
			user: req.user._id,
			items,
			subtotal,
			deliveryFee,
			totalAmount: subtotal + deliveryFee,
			shippingAddress,
			phone: shippingAddress.phone,
			paymentMethod,
		});

		// Clear the cart after successful order
		cart.items = [];
		await cart.save();

		return res.status(201).json({
			success: true,
			message: "Order placed successfully",
			data: order,
		});
	} catch (error) {
		console.error("Create Order Error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to place order",
			error: error.message,
		});
	}
}

/**
 * @desc    Get logged-in user's orders
 * @route   GET /api/v1/orders/my-orders
 * @access  Private
 */
export async function getMyOrders(req, res) {
	try {
		const orders = await Order.find({ user: req.user._id }).sort({
			createdAt: -1,
		});

		return res.status(200).json({
			success: true,
			message: "My orders fetched successfully",
			data: orders,
		});
	} catch (error) {
		console.error("Get My Orders Error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to fetch orders",
			error: error.message,
		});
	}
}

/**
 * @desc    Get single order details by ID
 * @route   GET /api/v1/orders/:id
 * @access  Private
 */
export async function getOrder(req, res) {
	try {
		const { id } = req.params;

		const order = await Order.findById(id).populate(
			"user",
			"name email phone"
		);

		if (!order) {
			return res.status(404).json({
				success: false,
				message: "Order not found",
			});
		}

		// Allow order owner or admin to access
		if (req.user.role !== "admin" && !order.user._id.equals(req.user._id)) {
			return res.status(403).json({
				success: false,
				message: "Not authorized to view this order",
			});
		}

		return res.status(200).json({
			success: true,
			message: "Order fetched successfully",
			data: order,
		});
	} catch (error) {
		console.error("Get Order Error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to fetch order",
			error: error.message,
		});
	}
}

/**
 * @desc    Cancel an order (by user)
 * @route   PATCH /api/v1/orders/:id/cancel
 * @access  Private
 */
export async function cancelOrder(req, res) {
	try {
		const { id } = req.params;

		const order = await Order.findById(id);

		if (!order) {
			return res.status(404).json({
				success: false,
				message: "Order not found",
			});
		}

		// Check ownership (unless admin)
		if (req.user.role !== "admin" && !order.user.equals(req.user._id)) {
			return res.status(403).json({
				success: false,
				message: "Not authorized to cancel this order",
			});
		}

		// Only pending/confirmed orders can be cancelled
		if (!["pending", "confirmed"].includes(order.status)) {
			return res.status(400).json({
				success: false,
				message: `Cannot cancel order with status '${order.status}'`,
			});
		}

		// Restore product stock
		await restoreInventory(order.items);

		order.status = "cancelled";
		order.stockRestored = true;
		await order.save();

		return res.status(200).json({
			success: true,
			message: "Order cancelled successfully and stock restored",
			data: order,
		});
	} catch (error) {
		console.error("Cancel Order Error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to cancel order",
			error: error.message,
		});
	}
}

/**
 * @desc    Get all orders (Admin) with filtering and pagination
 * @route   GET /api/v1/orders
 * @access  Private / Admin
 */
export async function listOrders(req, res) {
	try {
		const { status, page = 1, limit = 20 } = req.query;
		const filter = status ? { status } : {};

		const pageNum = parseInt(page, 10) || 1;
		const limitNum = Math.min(100, parseInt(limit, 10) || 20);
		const skip = (pageNum - 1) * limitNum;

		const [orders, total] = await Promise.all([
			Order.find(filter)
				.populate("user", "name email phone")
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limitNum),
			Order.countDocuments(filter),
		]);

		return res.status(200).json({
			success: true,
			message: "All orders fetched successfully",
			data: orders,
			pagination: {
				total,
				page: pageNum,
				limit: limitNum,
				totalPages: Math.ceil(total / limitNum),
			},
		});
	} catch (error) {
		console.error("Get All Orders Error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to fetch orders",
			error: error.message,
		});
	}
}

/**
 * @desc    Update order status, tracking, or payment (Admin)
 * @route   PATCH /api/v1/orders/:id
 * @access  Private / Admin
 */
export async function updateOrder(req, res) {
	try {
		const { id } = req.params;

		// If cancelling, delegate to cancelOrder
		if (req.body.status === "cancelled") {
			return cancelOrder(req, res);
		}

		const updates = {};
		const allowedStatuses = [
			"pending",
			"confirmed",
			"processing",
			"shipped",
			"delivered",
			"cancelled",
		];

		// Validate and apply status
		if (req.body.status !== undefined) {
			if (!allowedStatuses.includes(req.body.status)) {
				return res.status(400).json({
					success: false,
					message: "Invalid order status",
				});
			}
			updates.status = req.body.status;
		}

		// Apply tracking reference
		if (req.body.trackingReference !== undefined) {
			updates.trackingReference = String(req.body.trackingReference).trim();
		}

		// Validate and apply payment status
		if (req.body.paymentStatus !== undefined) {
			if (!["unpaid", "paid", "refunded"].includes(req.body.paymentStatus)) {
				return res.status(400).json({
					success: false,
					message: "Invalid payment status",
				});
			}
			updates.paymentStatus = req.body.paymentStatus;
		}

		const order = await Order.findByIdAndUpdate(id, updates, {
			new: true,
			runValidators: true,
		});

		if (!order) {
			return res.status(404).json({
				success: false,
				message: "Order not found",
			});
		}

		return res.status(200).json({
			success: true,
			message: "Order updated successfully",
			data: order,
		});
	} catch (error) {
		console.error("Update Order Error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to update order",
			error: error.message,
		});
	}
}
