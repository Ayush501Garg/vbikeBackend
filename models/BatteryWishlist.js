const mongoose = require("mongoose");

const batteryWishlistSchema = new mongoose.Schema(
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
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("BatteryWishlist", batteryWishlistSchema);
