const mongoose = require("mongoose");

const FeaturedOfferSchema = new mongoose.Schema({
  image: { type: String, required: false },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  tagline: { type: String, default: "" },
  fromdate: { type: Date, required: true },
  tilldate: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model("FeaturedOffer", FeaturedOfferSchema);
