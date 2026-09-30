import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
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
  { _id: true },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    addresses: { type: [addressSchema], default: [] },
  },
  { timestamps: true, versionKey: false },
);

userSchema.set("toJSON", {
  transform(_document, value) {
    delete value.password;
    return value;
  },
});

export default mongoose.model("User", userSchema);
