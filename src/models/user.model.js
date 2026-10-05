import mongoose from "mongoose";

// User Schema
const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, "Name is required"],
			maxlength: [80, "Name cannot exceed 80 characters"],
			trim: true,
		},
		email: {
			type: String,
			required: [true, "Email is required"],
			unique: true,
			lowercase: true,
			trim: true,
		},
		phone: {
			type: String,
			required: [true, "Phone number is required"],
			unique: true,
			trim: true,
		},
		password: {
			type: String,
			required: [true, "Password is required"],
			minlength: [8, "Password must be at least 8 characters long"],
			match:[/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one lowercase letter, one uppercase letter, and one number"]
		},
		role: {
			type: String,
			enum: ["customer", "admin"],
			default: "customer",
		},
		addresses: [
			{
				label: { type: String, trim: true, default: "Home" },
				recipient: { type: String, trim: true, required: true },
				phone: { type: String, trim: true, required: true },
				street: { type: String, trim: true, required: true },
				area: { type: String, trim: true, default: "" },
				city: { type: String, trim: true, required: true },
				district: { type: String, trim: true, default: "" },
				postalCode: { type: String, trim: true, default: "" },
				country: { type: String, trim: true, default: "Bangladesh" },
			},
		],
	},
	{
		timestamps: true,
		versionKey: false,
	}
);

// Method to remove sensitive password field when serializing
userSchema.methods.toJSON = function () {
	const userObject = this.toObject();
	delete userObject.password;
	return userObject;
};

const User = mongoose.model("User", userSchema);

export default User;
