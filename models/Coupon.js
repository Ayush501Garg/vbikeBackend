const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  discountType: {
    type: String,
    enum: ["percentage", "flat"],
    required: true
  },
  discountValue: {
    type: Number,
    required: true
  },
  maxUses: {
    type: Number,
    required: true
  },
  usedCount: {
    type: Number,
    default: 0
  },
  perUserLimit: {
    type: Number,
    default: 1
  },
  minRideAmount: {
    type: Number,
    default: 0
  },
  expiryDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Coupon", couponSchema);
