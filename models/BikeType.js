const mongoose = require("mongoose");

const bikeTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, enum: ["active", "inactive"], default: "active" }
}, { timestamps: true });

module.exports = mongoose.model("BikeType", bikeTypeSchema);
