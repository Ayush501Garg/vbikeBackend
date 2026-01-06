const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    full_name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address_line: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postal_code: { type: String, required: true, trim: true },
    country: { type: String, required: true, default: "India" },
    is_default: { type: Boolean, default: false },
    location: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Address", addressSchema);
