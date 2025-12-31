const mongoose = require("mongoose");

const batterySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },

    capacity: { type: String, required: true }, // 48V 30Ah
    range_km: { type: Number },
    charging_time_hours: { type: Number },

    price: { type: Number, required: true },
    mrp: { type: Number },

    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BatteryCategory",
      required: true
    },

    available_stock: { type: Number, default: 0 },

    warranty_months: { type: Number },
    weight_kg: { type: Number },

    features: [{ type: String }],

    image_url: { type: String },
    thumbnails: [{ type: String }],

    is_active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Battery", batterySchema);
