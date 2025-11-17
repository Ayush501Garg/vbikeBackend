const mongoose = require("mongoose");

const VendorProductApprovalSchema = new mongoose.Schema({
  vendor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
    required: false,
  },
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: false,
  },
  vendor_message: {
    type: String,
    default: "",
  },
  admin_message: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["approved", "not_approved"],
    default: "not_approved",
  },
}, { timestamps: true });

module.exports = mongoose.model("VendorProductApproval", VendorProductApprovalSchema);
