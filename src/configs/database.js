import mongoose from "mongoose";

async function connectDatabase() {
	try {
		const uri = process.env.MONGODB_URI;
		if (!uri) {
			throw new Error("MONGODB_URI is not defined");
		}
		const conn = await mongoose.connect(uri);
		console.log(`MongoDB Connected`);
	} catch (error) {
		console.error("MongoDB Connection Failed:", error.message);
	}
}

export default connectDatabase;
