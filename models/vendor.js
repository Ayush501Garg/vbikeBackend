const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address_line: String,
  city: String,
  state: String,
  postal_code: String,
  country: String,

  location: {
    lat: Number,
    lng: Number
  },

  // ⭐ FINAL INVENTORY STRUCTURE HERE ⭐
  inventory: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      assigned_stock: { type: Number, default: 0 },
      sold_stock: { type: Number, default: 0 },
      available_stock: { type: Number, default: 0 }
    }
  ],

  phone: String,
  email: String,
  opening_hours: Object,
  rating: { type: Number, default: 0 },

}, { timestamps: true });

module.exports = mongoose.model('Vendor', vendorSchema);
