const mongoose = require("mongoose");

const VendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address_line: { type: String, required: true },
  city: { type: String, required: true },
  state: String,
  postal_code: String,
  country: String,
  location: { type: { type: String, default: 'Point' }, coordinates: [Number] },
  available_products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  phone: String,
  email: String,
  website: String,
  rating: { type: Number, default: 0 },
  opening_hours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String },
  },
  services: [{ type: String }],
  images: [{ type: String }],
  status: { type: String, enum: ['active','inactive'], default: 'active' }
}, { timestamps: true });

VendorSchema.index({ location: '2dsphere' });

module.exports = mongoose.model("Vendor", VendorSchema);
