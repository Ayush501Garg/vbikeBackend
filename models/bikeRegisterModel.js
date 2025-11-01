const mongoose = require("mongoose");

const bikeRegisterSchema = new mongoose.Schema(
  {
    bikeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    user_id: {
      type: String,
      required: true,
      trim: true,
    },
    bikeName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BikeRegister", bikeRegisterSchema);
