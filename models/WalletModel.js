const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    earned_points: { type: Number, default: 0 },
    default_points: { type: Number, default: 50 },
    spent_points: { type: Number, default: 0 },

    available_points: { type: Number, default: 50 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Wallet", walletSchema);
