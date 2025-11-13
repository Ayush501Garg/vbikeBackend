const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  mrp: { type: Number },
  category_id: { type: String, required: true }, // category name
  stock_quantity: { type: Number, default: 0 },
  image_url: { type: String }, // main image
  thumbnails: [{ type: String }], // additional images
  is_active: { type: Boolean, default: true },
  power: [{ type: String }], // array of power options
  color: [{ type: String }], // array of color options
  features: [{ type: String }], // array of features options
  model_details: [{ type: String }], // array of features options
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);