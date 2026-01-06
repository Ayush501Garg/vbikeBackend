const mongoose = require("mongoose");

const batteryCartSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    battery_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Battery",
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

module.exports = mongoose.model("BatteryCart", batteryCartSchema);
