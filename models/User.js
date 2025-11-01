const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  password: String,

  isVerified: { type: Boolean, default: false },
  token: { type: String },   // ✅ Store token here
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
