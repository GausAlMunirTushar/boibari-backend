import mongoose from "mongoose";

async function connectDatabase() {
	try {
		const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/boibari";
		const conn = await mongoose.connect(uri);
		console.log(`MongoDB Connected: ${conn.connection.host}`);
	} catch (error) {
		console.error("MongoDB Connection Failed:", error.message);
	}
}

export default connectDatabase;
