import mongoose from "mongoose";
import Book from "../models/book.model.js";
import Cart from "../models/cart.model.js";
import Order from "../models/order.model.js";

const eligibleToCancel = new Set(["pending", "confirmed"]);

function snapshotAddress(input) {
  if (
    !input ||
    !input.recipient ||
    !input.phone ||
    !input.street ||
    !input.city
  )
    return null;
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

async function restoreInventory(items) {
  await Promise.all(
    items.map((item) =>
      Book.updateOne({ _id: item.book }, { $inc: { stock: item.quantity } }),
    ),
  );
}

export async function createOrder(req, res) {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart?.items.length)
    return res
      .status(400)
      .json({ success: false, message: "Your cart is empty" });
  const shippingAddress = snapshotAddress(req.body.shippingAddress);
  if (!shippingAddress)
    return res.status(400).json({
      success: false,
      message: "A complete delivery address is required",
    });
  const paymentMethod = req.body.paymentMethod || "cod";
  if (!["cod", "manual"].includes(paymentMethod)) {
    return res.status(400).json({
      success: false,
      message: "Payment method must be cod or manual",
    });
  }
  const quantities = new Map();
  for (const item of cart.items)
    quantities.set(
      String(item.book),
      (quantities.get(String(item.book)) || 0) + item.quantity,
    );
  const reservations = [];
  const items = [];
  let subtotal = 0;
  let order;
  try {
    for (const [bookId, quantity] of quantities) {
      if (!mongoose.isValidObjectId(bookId))
        throw Object.assign(new Error("Cart contains an invalid book"), {
          status: 400,
        });
      const book = await Book.findOneAndUpdate(
        { _id: bookId, isActive: true, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true },
      );
      if (!book)
        throw Object.assign(
          new Error("A book is unavailable or has insufficient stock"),
          { status: 409 },
        );
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
    const deliveryFee = Math.max(0, Number(process.env.DELIVERY_FEE) || 60);
    order = await Order.create({
      orderNumber: `BB-${Date.now().toString(36).toUpperCase()}-${new mongoose.Types.ObjectId().toString().slice(-6).toUpperCase()}`,
      user: req.user._id,
      items,
      subtotal,
      deliveryFee,
      totalAmount: subtotal + deliveryFee,
      shippingAddress,
      phone: shippingAddress.phone,
      paymentMethod,
    });
    cart.items = [];
    await cart.save();
    return res
      .status(201)
      .json({ success: true, message: "Order placed", data: order });
  } catch (error) {
    if (order) await Order.deleteOne({ _id: order._id });
    await restoreInventory(reservations);
    throw error;
  }
}

export async function getMyOrders(req, res) {
  const orders = await Order.find({ user: req.user._id }).sort({
    createdAt: -1,
  });
  return res.json({ success: true, data: orders });
}

export async function getOrder(req, res) {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email phone",
  );
  if (!order)
    return res.status(404).json({ success: false, message: "Order not found" });
  if (req.user.role !== "admin" && !order.user._id.equals(req.user._id)) {
    return res
      .status(403)
      .json({ success: false, message: "You cannot access this order" });
  }
  return res.json({ success: true, data: order });
}

export async function cancelOrder(req, res) {
  const filter = { _id: req.params.id, status: { $in: [...eligibleToCancel] } };
  if (req.user.role !== "admin") filter.user = req.user._id;
  const order = await Order.findOneAndUpdate(
    filter,
    { status: "cancelled", stockRestored: true },
    { new: true },
  );
  if (!order)
    return res.status(404).json({
      success: false,
      message: "Order not found or can no longer be cancelled",
    });
  await restoreInventory(order.items);
  return res.json({ success: true, message: "Order cancelled", data: order });
}

export async function listOrders(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(req.query.limit, 10) || 20),
  );
  const filter = req.query.status ? { status: req.query.status } : {};
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("user", "name email phone")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(filter),
  ]);
  return res.json({
    success: true,
    data: orders,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

export async function updateOrder(req, res) {
  const allowedStatuses = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];
  if (req.body.status === "cancelled") return cancelOrder(req, res);
  const updates = {};
  if (req.body.status !== undefined) {
    if (!allowedStatuses.includes(req.body.status))
      return res
        .status(400)
        .json({ success: false, message: "Invalid order status" });
    updates.status = req.body.status;
  }
  if (req.body.trackingReference !== undefined)
    updates.trackingReference = String(req.body.trackingReference).trim();
  if (req.body.paymentStatus !== undefined) {
    if (!["unpaid", "paid", "refunded"].includes(req.body.paymentStatus))
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment status" });
    updates.paymentStatus = req.body.paymentStatus;
  }
  const order = await Order.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!order)
    return res.status(404).json({ success: false, message: "Order not found" });
  return res.json({ success: true, message: "Order updated", data: order });
}
