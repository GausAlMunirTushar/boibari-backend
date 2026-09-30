import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import generateToken from "../utils/generateToken.js";

export async function register(req, res) {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Name, email, phone, and password are required",
      });
  }
  if (typeof password !== "string" || password.length < 8) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Password must be at least 8 characters",
      });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedPhone = String(phone).trim();
  if (
    await User.exists({
      $or: [{ email: normalizedEmail }, { phone: normalizedPhone }],
    })
  ) {
    return res
      .status(409)
      .json({
        success: false,
        message: "Email or phone is already registered",
      });
  }
  const user = await User.create({
    name,
    email: normalizedEmail,
    phone: normalizedPhone,
    password: await bcrypt.hash(password, 12),
  });
  return res
    .status(201)
    .json({
      success: true,
      message: "Account created",
      data: { user, token: generateToken(user._id) },
    });
}

export async function login(req, res) {
  const { email, phone, password } = req.body;
  if ((!email && !phone) || !password) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Email or phone and password are required",
      });
  }
  const identity = email
    ? { email: String(email).trim().toLowerCase() }
    : { phone: String(phone).trim() };
  const user = await User.findOne(identity).select("+password");
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials" });
  }
  return res.json({
    success: true,
    message: "Signed in",
    data: { user, token: generateToken(user._id) },
  });
}

export async function getMe(req, res) {
  return res.json({ success: true, data: req.user });
}

export async function updateMe(req, res) {
  const allowed = ["name", "phone"];
  for (const field of allowed) {
    if (req.body[field] !== undefined) req.user[field] = req.body[field];
  }
  await req.user.save();
  return res.json({
    success: true,
    message: "Profile updated",
    data: req.user,
  });
}

export async function addAddress(req, res) {
  const { recipient, phone, street, city } = req.body;
  if (!recipient || !phone || !street || !city) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Recipient, phone, street, and city are required",
      });
  }
  req.user.addresses.push(req.body);
  await req.user.save();
  return res
    .status(201)
    .json({
      success: true,
      message: "Address saved",
      data: req.user.addresses.at(-1),
    });
}

export async function deleteAddress(req, res) {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address)
    return res
      .status(404)
      .json({ success: false, message: "Address not found" });
  address.deleteOne();
  await req.user.save();
  return res.json({ success: true, message: "Address removed" });
}
