const mongoose = require("mongoose");

const accessorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },

    price: { type: Number, required: true },
    mrp: { type: Number },

    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccessoryCategory",
      required: true
    },

    available_stock: { type: Number, default: 0 },

    colors: [{ type: String }],
    features: [{ type: String }],

    image_url: { type: String },
    thumbnails: [{ type: String }],

    is_active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Accessory", accessorySchema);
