const mongoose = require("mongoose");

const bikeModelSchema = new mongoose.Schema({
  brand: { type: String, required: true },
  modelName: { type: String, required: true },
  fuelType: { type: String, enum: ["Petrol", "Electric"], required: true },
  batteryCapacity: { type: String },
  rangePerCharge: { type: String },
  chargingTime: { type: String },
  topSpeed: { type: String },
  status: { type: String, enum: ["active", "inactive"], default: "active" }
}, { timestamps: true });

module.exports = mongoose.model("BikeModel", bikeModelSchema);

