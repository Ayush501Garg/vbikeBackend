const mongoose = require("mongoose");

const accessoryWishlistSchema = new mongoose.Schema(
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
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AccessoryWishlist", accessoryWishlistSchema);
