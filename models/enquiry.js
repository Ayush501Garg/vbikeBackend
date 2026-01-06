const mongoose = require("mongoose");

const enquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    subject: { type: String, required: true },
    query: { type: String, required: true },
    is_resolved: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Enquiry", enquirySchema);
