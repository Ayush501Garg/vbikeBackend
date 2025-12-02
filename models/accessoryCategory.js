const mongoose = require("mongoose");

const accessoryCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    is_active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AccessoryCategory", accessoryCategorySchema);
