const mongoose = require("mongoose");

const tempUserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  password: String,
  otp: String,
  role: { type: String, enum: ["user", "vendor", "admin"], default: "user" }, // ✅
  otpExpires: Date,
}, { timestamps: true });

module.exports = mongoose.model("TempUser", tempUserSchema);
