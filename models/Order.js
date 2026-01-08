// models/Order.js
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  order_number: {
    type: String,
    unique: true
  },

  items: [
    {
      product_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      product_type: {
        type: String,
        enum: ["battery", "accessory"],
        required: true
      },
      product_name: String,

      quantity: {
        type: Number,
        default: 1
      },

      unit_price: {
        type: Number,
        required: true
      },

      total_price: {
        type: Number,
        required: true
      }
    }
  ],

  total_amount: {
    type: Number,
    required: true
  },

  payment: {
    method: {
      type: String,
      default: "DUMMY"
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending"
    },
    transaction_id: String
  },

  order_status: {
    type: String,
    enum: ["created", "confirmed", "cancelled"],
    default: "created"
  }

}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
