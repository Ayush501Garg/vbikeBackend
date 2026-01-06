const mongoose = require("mongoose");

const vendorServiceSlotSchema = new mongoose.Schema(
  {
    vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true
    },

    service_types: {
      type: [String],
      enum: ["full_service", "washing", "battery_change", "breakdown"],
      required: true
    },

    number_of_service_person: {
      type: Number,
      required: true
    },

    max_service_per_slot: {
      type: Number,
      required: true
    },

    slot_duration: {
      type: Number, // minutes
      required: true
    },

    working_hours_from: {
      type: String, // "09:00"
      required: true
    },

    working_hours_to: {
      type: String, // "18:00"
      required: true
    },

    break_from: {
      type: String
    },

    break_to: {
      type: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("VendorServiceSlot", vendorServiceSlotSchema);
