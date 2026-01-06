const mongoose = require("mongoose");

const friendsFamilySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true
    },
    alternative_phone: {
      type: String
    },
    shipping_address: {
      type: String,
      required: true
    },
    model_name: {
      type: String,
      required: true
    },
    or_image: {
      type: String, // Cloudinary image URL
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("FriendsFamily", friendsFamilySchema);
