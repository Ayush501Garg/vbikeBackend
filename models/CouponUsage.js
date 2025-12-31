const mongoose = require("mongoose");

const couponUsageSchema = new mongoose.Schema({
  couponId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Coupon"
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  usedCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model("CouponUsage", couponUsageSchema);
