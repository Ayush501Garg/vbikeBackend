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

  // Super Vendor Reference (if this vendor is under a super vendor)
  super_vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SuperVendor',
    default: null
  },
  vendor_type: {
    type: String,
    enum: ['direct', 'sub_vendor'],
    default: 'direct'
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

  // Business Metrics for Sub-Vendors
  total_business: { type: Number, default: 0 },
  total_bikes_sold: { type: Number, default: 0 },
  pending_amount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },

}, { timestamps: true });

module.exports = mongoose.model('Vendor', vendorSchema);
