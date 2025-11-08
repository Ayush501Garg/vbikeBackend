const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address_line: String,
  city: String,
  state: String,
  postal_code: String,
  country: String,
  location: {  // object with lat/lng
    lat: Number,
    lng: Number
  },
  available_products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  phone: String,
  email: String,
  opening_hours: Object,
  rating: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Vendor', vendorSchema);
