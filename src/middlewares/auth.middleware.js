import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

/**
 * Middleware to protect routes and authenticate JWT
 * Authentication
 */
export async function protect(req, res, next) {
	try {
		let token;

		if (
			req.headers.authorization &&
			req.headers.authorization.startsWith("Bearer")
		) {
			token = req.headers.authorization.split(" ")[1];
		}

		if (!token) {
			return res.status(401).json({
				success: false,
				message: "Not authorized to access this route, token missing",
			});
		}

		const secret = process.env.JWT_SECRET 
		const decoded = jwt.verify(token, secret);

		const user = await User.findById(decoded.id).select("-password");
		if (!user) {
			return res.status(401).json({
				success: false,
				message: "The user belonging to this token no longer exists",
			});
		}

		req.user = user;
		next();
	} catch (error) {
		return res.status(401).json({
			success: false,
			message: "Not authorized, invalid or expired token",
			error: error.message,
		});
	}
}

/**
 * Middleware to restrict access to specific roles (e.g. admin)
 * Authrization
 */
export function authorize(...roles) {
	return (req, res, next) => {
		if (!req.user || !roles.includes(req.user.role)) {
			return res.status(403).json({
				success: false,
				message: `User role '${req.user?.role || "guest"}' is not authorized to access this resource`,
			});
		}
		next();
	};
}
