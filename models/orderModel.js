const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    address_id: { type: mongoose.Schema.Types.ObjectId, ref: "Address", required: true },
    items: [
      {
        product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    total_price: { type: Number, required: true },
    payment_method: { type: String, enum: ["COD", "Razorpay"], required: true },
    payment_status: { type: String, enum: ["Unpaid", "Paid"], default: "Unpaid" },
    order_status: { type: String, enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"], default: "Pending" },
    razorpay_order_id: String,
    razorpay_payment_id: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
