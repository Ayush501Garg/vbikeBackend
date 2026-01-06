const Accessory = require("../models/accessory");
const AccessoryCategory = require("../models/accessoryCategory");
const path = require("path");
const fs = require("fs");

// Helpers
const getLiveUrl = (req, file) =>
  file ? `${req.protocol}://${req.get("host")}/${file}` : null;

const getLiveUrls = (req, files) =>
  files ? files.map(f => getLiveUrl(req, f)) : [];

const sendError = (res, code, message) =>
  res.status(code).json({ status: "error", code, message });

const parseArray = (val) =>
  val ? (Array.isArray(val) ? val : val.split(",").map(v => v.trim())) : [];

// ------------------------------------------------------
// CREATE ACCESSORY
// ------------------------------------------------------
exports.createAccessory = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      mrp,
      category_id,
      available_stock,
      colors,
      features,
      is_active
    } = req.body;

    if (!name || !price || !category_id) {
      return sendError(res, 400, "Name, price, category_id are required.");
    }

    const image = req.files?.image?.[0]?.filename || null;
    const thumbnails = req.files?.thumbnails?.map(f => f.filename) || [];

    const accessory = new Accessory({
      name,
      description,
      price,
      mrp,
      category_id,
      available_stock: available_stock || 0,
      colors: parseArray(colors),
      features: parseArray(features),
      image_url: image,
      thumbnails,
      is_active: is_active !== undefined ? is_active : true
    });

    await accessory.save();

    const populated = await Accessory.findById(accessory._id).populate("category_id", "name");

    res.status(201).json({
      status: "success",
      message: "Accessory created successfully",
      data: {
        ...populated.toObject(),
        image_url: getLiveUrl(req, populated.image_url),
        thumbnails: getLiveUrls(req, populated.thumbnails)
      }
    });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

// ------------------------------------------------------
// GET ALL ACCESSORIES
// ------------------------------------------------------
exports.getAccessories = async (req, res) => {
  try {
    const list = await Accessory.find()
      .select("-__v")
      .populate("category_id", "name");

    const formatted = list.map(a => ({
      ...a.toObject(),
      image_url: getLiveUrl(req, a.image_url),
      thumbnails: getLiveUrls(req, a.thumbnails)
    }));

    res.json({
      status: "success",
      data: formatted
    });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

// ------------------------------------------------------
// GET ACCESSORIES BY CATEGORY NAME
// ------------------------------------------------------
exports.getAccessoriesByCategoryName = async (req, res) => {
  try {
    const { categoryName } = req.params;

    const category = await AccessoryCategory.findOne({ name: categoryName });
    if (!category) return sendError(res, 404, `Category "${categoryName}" not found`);

    const list = await Accessory.find({ category_id: category._id }).populate("category_id", "name");

    res.json({
      status: "success",
      data: list.map(a => ({
        ...a.toObject(),
        image_url: getLiveUrl(req, a.image_url),
        thumbnails: getLiveUrls(req, a.thumbnails)
      }))
    });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

// ------------------------------------------------------
// GET SINGLE ACCESSORY
// ------------------------------------------------------
exports.getAccessory = async (req, res) => {
  try {
    const accessory = await Accessory.findById(req.params.id)
      .select("-__v")
      .populate("category_id", "name");

    if (!accessory) return sendError(res, 404, "Accessory not found.");

    res.json({
      status: "success",
      data: {
        ...accessory.toObject(),
        image_url: getLiveUrl(req, accessory.image_url),
        thumbnails: getLiveUrls(req, accessory.thumbnails)
      }
    });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

// ------------------------------------------------------
// UPDATE ACCESSORY
// ------------------------------------------------------
exports.updateAccessory = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (updateData.colors)
      updateData.colors = parseArray(updateData.colors);
    if (updateData.features)
      updateData.features = parseArray(updateData.features);

    const accessory = await Accessory.findById(req.params.id);
    if (!accessory) return sendError(res, 404, "Accessory not found.");

    // New main image
    if (req.files?.image) {
      const newImg = req.files.image[0].filename;
      if (accessory.image_url) {
        const old = path.join(__dirname, "..", "uploads", accessory.image_url);
        if (fs.existsSync(old)) fs.unlinkSync(old);
      }
      updateData.image_url = newImg;
    }

    // New thumbnails
    if (req.files?.thumbnails) {
      const newThumbs = req.files.thumbnails.map(f => f.filename);
      if (accessory.thumbnails?.length) {
        accessory.thumbnails.forEach(file => {
          const filePath = path.join(__dirname, "..", "uploads", file);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });
      }
      updateData.thumbnails = newThumbs;
    }

    Object.assign(accessory, updateData);
    await accessory.save();

    const populated = await Accessory.findById(accessory._id).populate("category_id", "name");

    res.json({
      status: "success",
      message: "Accessory updated successfully",
      data: {
        ...populated.toObject(),
        image_url: getLiveUrl(req, populated.image_url),
        thumbnails: getLiveUrls(req, populated.thumbnails)
      }
    });
  } catch (err) {
    sendError(res, 400, err.message);
  }
};

// ------------------------------------------------------
// DELETE ACCESSORY
// ------------------------------------------------------
exports.deleteAccessory = async (req, res) => {
  try {
    const accessory = await Accessory.findByIdAndDelete(req.params.id);
    if (!accessory) return sendError(res, 404, "Accessory not found.");

    if (accessory.image_url) {
      const imgPath = path.join(__dirname, "..", "uploads", accessory.image_url);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    if (accessory.thumbnails?.length) {
      accessory.thumbnails.forEach(file => {
        const filePath = path.join(__dirname, "..", "uploads", file);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    }

    res.json({
      status: "success",
      message: "Accessory deleted successfully"
    });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};
