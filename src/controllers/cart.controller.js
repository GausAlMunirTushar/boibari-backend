import Book from "../models/book.model.js";
import Cart from "../models/cart.model.js";

async function getOrCreateCart(userId) {
  return (
    (await Cart.findOne({ user: userId })) ||
    Cart.create({ user: userId, items: [] })
  );
}

export async function getCart(req, res) {
  const cart = await getOrCreateCart(req.user._id);
  await cart.populate(
    "items.book",
    "title slug coverImage price salePrice stock isActive",
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
  return res.json({
    success: true,
    data: {
      items,
      subtotal: items.reduce((sum, item) => sum + item.lineTotal, 0),
    },
  });
}

export async function addCartItem(req, res) {
  const quantity = Number(req.body.quantity ?? 1);
  if (!Number.isInteger(quantity) || quantity < 1) {
    return res
      .status(400)
      .json({ success: false, message: "Quantity must be a positive integer" });
  }
  const book = await Book.findOne({ _id: req.body.bookId, isActive: true });
  if (!book)
    return res.status(404).json({ success: false, message: "Book not found" });
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.find((entry) => entry.book.equals(book._id));
  const nextQuantity = (item?.quantity || 0) + quantity;
  if (nextQuantity > book.stock) {
    return res
      .status(409)
      .json({
        success: false,
        message: `Only ${book.stock} copies are available`,
      });
  }
  if (item) item.quantity = nextQuantity;
  else cart.items.push({ book: book._id, quantity });
  await cart.save();
  return res
    .status(200)
    .json({ success: true, message: "Cart updated", data: cart });
}

export async function updateCartItem(req, res) {
  const quantity = Number(req.body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1) {
    return res
      .status(400)
      .json({ success: false, message: "Quantity must be a positive integer" });
  }
  const [cart, book] = await Promise.all([
    Cart.findOne({ user: req.user._id }),
    Book.findOne({ _id: req.params.bookId, isActive: true }),
  ]);
  if (!cart || !book)
    return res
      .status(404)
      .json({ success: false, message: "Cart or book not found" });
  if (quantity > book.stock)
    return res
      .status(409)
      .json({
        success: false,
        message: `Only ${book.stock} copies are available`,
      });
  const item = cart.items.find((entry) => entry.book.equals(book._id));
  if (!item)
    return res
      .status(404)
      .json({ success: false, message: "Book is not in the cart" });
  item.quantity = quantity;
  await cart.save();
  return res.json({ success: true, message: "Cart updated", data: cart });
}

export async function removeCartItem(req, res) {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart)
    return res.status(404).json({ success: false, message: "Cart not found" });
  cart.items = cart.items.filter(
    (item) => !item.book.equals(req.params.bookId),
  );
  await cart.save();
  return res.json({ success: true, message: "Cart item removed", data: cart });
}

export async function clearCart(req, res) {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  await cart.save();
  return res.json({ success: true, message: "Cart cleared" });
}
