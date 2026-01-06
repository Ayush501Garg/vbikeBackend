const mongoose = require("mongoose");

const accessoryCartSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    accessory_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Accessory",
      required: true
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    },
    price: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AccessoryCart", accessoryCartSchema);
