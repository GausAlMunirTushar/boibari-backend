import jwt from "jsonwebtoken";

export function generateToken(userId, role = "customer") {

	const secret = process.env.JWT_SECRET 
	if(!secret) {
		console.log('JWT_SECRET is not defined')
	}
	
	const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

	return jwt.sign(
		{ id: userId, role }, 	// User data
		secret,  				// Secret key
		{
			expiresIn,  			// Token expiry time
		}
	);
}

export default generateToken;
