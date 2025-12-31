const mongoose = require("mongoose");

const serviceBookingSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    service_type: {
      type: String,
      enum: [
        "full_service",
        "washing",
        "battery_change",
        "breakdown"
      ],
      required: true
    },

    booking_date: {
      type: Date,
      required: true
    },

    booking_time: {
      type: String,
      required: true
    },

    address: {
      type: String,
      required: true
    },

    price: {
      type: Number,
      required: true
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ServiceBooking", serviceBookingSchema);
