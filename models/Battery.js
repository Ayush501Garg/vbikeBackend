const mongoose = require("mongoose");

const batterySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,

    capacity: { type: String, required: true },
    range_km: Number,
    charging_time_hours: Number,

    price: { type: Number, required: true },
    mrp: Number,

    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BatteryCategory",
      required: true
    },

    available_stock: { type: Number, default: 0 },
    warranty_months: Number,
    weight_kg: Number,

    features: [{ type: String }],

    image_url: String,
    thumbnails: [{ type: String }],

    is_active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Battery", batterySchema);
