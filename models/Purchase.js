// models/Purchase.js
const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema({
  purchase_code: {
    type: String,
    unique: true
  },

  // 🔑 USER REFERENCE
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  products: [
    {
      reference_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },

      reference_type: {
        type: String,
        enum: ["battery", "accessory"],
        required: true
      },

      title: String,

      qty: {
        type: Number,
        default: 1
      },

      price_per_unit: {
        type: Number,
        required: true
      },

      line_total: {
        type: Number,
        required: true
      }
    }
  ],

  grand_total: {
    type: Number,
    required: true
  },

  payment_info: {
    provider: {
      type: String,
      default: "DUMMY"
    },
    state: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending"
    },
    reference_no: String
  },

  purchase_status: {
    type: String,
    enum: ["initiated", "completed", "cancelled"],
    default: "initiated"
  }

}, { timestamps: true });

module.exports = mongoose.model("Purchase", purchaseSchema);
