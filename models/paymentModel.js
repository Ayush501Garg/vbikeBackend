const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    method: { type: String, default: "Razorpay" },
    status: {
      type: String,
      enum: ["Created", "Paid", "Failed"],
      default: "Created"
    },
    razorpay_order_id: String,
    razorpay_payment_id: String,
    razorpay_signature: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
