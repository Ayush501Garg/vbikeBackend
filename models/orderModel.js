const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    items: [
      {
        product_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product", // ⚠️ use "Product" (your existing model)
          required: true
        },
        quantity: {
          type: Number,
          required: true
        },
        price: {
          type: Number,
          required: true
        }
      }
    ],
    address_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      required: true
    },
    total_price: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending"
    },
    payment_status: {
      type: String,
      enum: ["Unpaid", "Paid", "Refunded"],
      default: "Unpaid"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
