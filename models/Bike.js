const mongoose = require("mongoose");



const bikeSchema = new mongoose.Schema({
  modelId: { type: mongoose.Schema.Types.ObjectId, ref: "BikeModel", required: true },
  typeId: { type: mongoose.Schema.Types.ObjectId, ref: "BikeType", required: true },
  registrationNumber: { type: String, unique: true },
  color: { type: String },
  year: { type: Number },
  price: { type: Number, required: true },
  mrp: { type: Number, required: true },
  status: { type: String, enum: ["available", "rented", "buy", "other"], default: "available" }
}, { timestamps: true });


module.exports = mongoose.model("Bike", bikeSchema);
