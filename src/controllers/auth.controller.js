import bcrypt, { decodeBase64 } from "bcryptjs";
import User from "../models/user.model.js";
import generateToken from "../utils/generateToken.js";

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
/**
 * register
 * login
 * forgot-password
 * reset-password
 * update-password
 * otp-verify
 * mai-verify
 */

export async function register(req, res) {
	try {
		const { name, email, phone, password } = req.body;

		// Validation
		if (!name || !email || !phone || !password) {
			return res.status(400).json({
				success: false,
				message: "Name, email, phone, and password are required",
			});
		}
		if (password.length < 8) {
			return res.status(400).json({
				success: false,
				message: "Password must be at least 8 characters",
			});
		}

		// Check if user already exists with email or phone
		const existingUser = await User.findOne({
			$or: [{ email: email.toLowerCase() }, { phone }],
		});

		if (existingUser) {
			const duplicateField =
				existingUser.phone === phone ? "Phone number" : "Email";
			return res.status(409).json({
				success: false,
				message: `${duplicateField} is already registered`,
			});
		}

		// Hash password
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		// Create user
		const user = await User.create({
			name,
			email: email.toLowerCase(),
			phone,
			password: hashedPassword,
		});
		
		// Generate JWT token
		const token = generateToken(user._id);

		return res.status(201).json({
			success: true,
			message: "User registered successfully",
			data: {
				user,
				token,
			},
		});
	} catch (error) {
		console.error("Register Error:", error);
		return res.status(500).json({
			success: false,
			message: "Server error during registration",
			error: error.message,
		});
	}
}

/**
 * @desc    Login user (via email or phone)
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export async function login(req, res) {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({
				success: false,
				message: "Please provide email and password",
			});

		}
		
		// Find user by email
		const user = await User.findOne({
			email: email.toLowerCase(),
		});
		
		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found with provided credentials",
			});
		}

		// Verify password
		const isMatch = await bcrypt.compare(password, user.password);

		if (!isMatch) {
			return res.status(401).json({
				success: false,
				message: "Invalid credentials",
			});
		}

		// Generate token
		const token = generateToken(user._id);

		return res.status(200).json({
			success: true,
			message: "Logged in successfully",
			data: {
				user,
				token,
			},
		});
	} catch (error) {
		console.error("Login Error:", error);
		return res.status(500).json({
			success: false,
			message: "Server error during login",
			error: error.message,
		});
	}
}

/**
 * @desc    Get current logged in user profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export async function getMe(req, res) {
	try {
		const user = await User.findById(req.user._id);
		return res.status(200).json({
			success: true,
			message: "User profile retrieved successfully",
			data: user,
		});
	} catch (error) {
		console.error("Get Profile Error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to fetch profile",
			error: error.message,
		});
	}
}

/**
 * @desc    Update current user profile
 * @route   PUT /api/v1/auth/me
 * @access  Private
 */
export async function updateMe(req, res) {
	try {
		const { name, phone } = req.body;
		const user = await User.findById(req.user._id);

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		if (name) user.name = name;
		if (phone) user.phone = phone;

		await user.save();

		return res.status(200).json({
			success: true,
			message: "Profile updated successfully",
			data: user,
		});
	} catch (error) {
		console.error("Update Profile Error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to update profile",
			error: error.message,
		});
	}
}

/**
 * @desc    Add a delivery address
 * @route   POST /api/v1/users/me/addresses
 * @access  Private
 */
export async function addAddress(req, res) {
	try {
		const { recipient, phone, street, city } = req.body;

		if (!recipient || !phone || !street || !city) {
			return res.status(400).json({
				success: false,
				message: "Recipient, phone, street, and city are required",
			});
		}

		const user = await User.findById(req.user._id);
		user.addresses.push(req.body);
		await user.save();

		return res.status(201).json({
			success: true,
			message: "Address saved successfully",
			data: user.addresses.at(-1),
		});
	} catch (error) {
		console.error("Add Address Error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to save address",
			error: error.message,
		});
	}
}

/**
 * @desc    Delete a delivery address
 * @route   DELETE /api/v1/users/me/addresses/:addressId
 * @access  Private
 */
export async function deleteAddress(req, res) {
	try {
		const user = await User.findById(req.user._id);
		const address = user.addresses.id(req.params.addressId);

		if (!address) {
			return res.status(404).json({
				success: false,
				message: "Address not found",
			});
		}

		address.deleteOne();
		await user.save();

		return res.status(200).json({
			success: true,
			message: "Address removed successfully",
		});
	} catch (error) {
		console.error("Delete Address Error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to remove address",
			error: error.message,
		});
	}
}
