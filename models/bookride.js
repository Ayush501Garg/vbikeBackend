const mongoose = require("mongoose");

const BookRideSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  shipping_address_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true },
  status: { type: String, enum: ['pending','confirmed','ready','delayed'], default: 'pending' },
  pickup_date: Date
}, { timestamps: true });

module.exports = mongoose.model("BookRide", BookRideSchema);
