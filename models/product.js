// models/product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true }, // Current selling price
  base_price: { type: Number, required: true }, // Base price set by Super Admin (MRP)
  mrp: { type: Number }, // Market Retail Price
  category_id: { type: String, required: true },
  stock_quantity: { type: Number, default: 0 }, // Main inventory with Super Admin
  image_url: { type: String },
  thumbnails: [{ type: String }],
  is_active: { type: Boolean, default: true },
  power: [{ type: String }],
  color: [{ type: String }],
  features: [{ type: String }],
  model_details: [{ type: String }],
  // NEW: Battery Specs
  battery_specs: [{
    name: { type: String, required: true }, // ex: "60V 30Ah Lithium"
    price_addon: { type: Number, default: 0 }, // extra price for this battery
    range: String, // ex: "90-110 km"
    charging_time: String, // ex: "4-5 hours"
    warranty: String, // ex: "3 Years"
    is_default: { type: Boolean, default: false } // default battery option
  }]
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);