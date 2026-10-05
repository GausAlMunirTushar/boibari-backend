import jwt from "jsonwebtoken";

/**
 * Generates a signed JWT token for a user
 * @param {string} userId
 * @param {string} role
 * @returns {string}
 */
export function generateToken(userId, role = "customer") {
	const secret = process.env.JWT_SECRET || "default_jwt_secret_key";
	const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

	return jwt.sign({ id: userId, role }, secret, {
		expiresIn,
	});
}

export default generateToken;
