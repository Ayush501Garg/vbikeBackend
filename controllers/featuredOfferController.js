const FeaturedOffer = require("../models/FeaturedOffer");
const path = require("path");
const fs = require("fs");

// Generate dynamic full image URL
const buildImageUrl = (req, filename) => {
  if (!filename) return null;
  return `${req.protocol}://${req.get("host")}/${filename}`;
};

// CREATE
exports.createOffer = async (req, res) => {
  try {
    const image = req.files?.image ? req.files.image[0].filename : null;

    const offer = await FeaturedOffer.create({
      image,
      title: req.body.title,
      description: req.body.description,
      tagline: req.body.tagline,
      fromdate: req.body.fromdate,
      tilldate: req.body.tilldate,
    });

    // Replace "image" with full URL — NO new field
    offer._doc.image = buildImageUrl(req, offer.image);

    res.status(201).json({ status: "success", data: offer });
  } catch (e) {
    res.status(500).json({ status: "error", message: e.message });
  }
};

// GET ALL
exports.getOffers = async (req, res) => {
  try {
    const data = await FeaturedOffer.find().sort({ createdAt: -1 });

    const finalData = data.map(item => {
      item = item.toObject();
      item.image = buildImageUrl(req, item.image); // Replace image
      return item;
    });

    res.json({ status: "success", count: finalData.length, data: finalData });
  } catch (e) {
    res.status(500).json({ status: "error", message: e.message });
  }
};

// GET BY ID
exports.getOffer = async (req, res) => {
  try {
    const item = await FeaturedOffer.findById(req.params.id);
    if (!item) return res.status(404).json({ status: "error", message: "Not found" });

    const obj = item.toObject();
    obj.image = buildImageUrl(req, obj.image); // Replace image

    res.json({ status: "success", data: obj });
  } catch (e) {
    res.status(500).json({ status: "error", message: e.message });
  }
};

// UPDATE
exports.updateOffer = async (req, res) => {
  try {
    let updateData = {
      title: req.body.title,
      description: req.body.description,
      tagline: req.body.tagline,
      fromdate: req.body.fromdate,
      tilldate: req.body.tilldate,
    };

    // Handle new image
    if (req.files?.image) {
      updateData.image = req.files.image[0].filename;

      const existing = await FeaturedOffer.findById(req.params.id);
      if (existing && existing.image) {
        const oldPath = path.join(__dirname, "../uploads", existing.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }

    const updated = await FeaturedOffer.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ status: "error", message: "Not found" });

    const obj = updated.toObject();
    obj.image = buildImageUrl(req, obj.image); // Replace image

    res.json({ status: "success", data: obj });
  } catch (e) {
    res.status(500).json({ status: "error", message: e.message });
  }
};

// DELETE
exports.deleteOffer = async (req, res) => {
  try {
    const removed = await FeaturedOffer.findByIdAndDelete(req.params.id);
    if (!removed)
      return res.status(404).json({ status: "error", message: "Not found" });

    if (removed.image) {
      const imgPath = path.join(__dirname, "../uploads", removed.image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    res.json({ status: "success", message: "Deleted successfully" });
  } catch (e) {
    res.status(500).json({ status: "error", message: e.message });
  }
};
