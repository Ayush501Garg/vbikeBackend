const Battery = require("../models/Battery");

exports.createBattery = async (req, res) => {
  try {
    // FILES
    if (req.files?.image) {
      req.body.image_url = `/uploads/${req.files.image[0].filename}`;
    }

    if (req.files?.thumbnails) {
      req.body.thumbnails = req.files.thumbnails.map(
        f => `/uploads/${f.filename}`
      );
    }

    // TYPE CASTING
    req.body.price = Number(req.body.price);
    req.body.mrp = Number(req.body.mrp);
    req.body.range_km = Number(req.body.range_km);
    req.body.charging_time_hours = Number(req.body.charging_time_hours);
    req.body.available_stock = Number(req.body.available_stock);
    req.body.warranty_months = Number(req.body.warranty_months);
    req.body.weight_kg = Number(req.body.weight_kg);
    req.body.is_active = req.body.is_active === "true";

    const battery = await Battery.create(req.body);
    res.status(201).json({ success: true, data: battery });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.updateBattery = async (req, res) => {
  try {
    if (req.files?.image) {
      req.body.image_url = `/uploads/${req.files.image[0].filename}`;
    }

    if (req.files?.thumbnails) {
      req.body.thumbnails = req.files.thumbnails.map(
        f => `/uploads/${f.filename}`
      );
    }

    const battery = await Battery.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!battery) {
      return res.status(404).json({ success: false, message: "Battery not found" });
    }

    res.json({ success: true, data: battery });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getAllBatteries = async (req, res) => {
  const batteries = await Battery.find()
    .populate("category_id", "name")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: batteries });
};

exports.getBatteryById = async (req, res) => {
  const battery = await Battery.findById(req.params.id)
    .populate("category_id", "name");

  if (!battery) {
    return res.status(404).json({ success: false, message: "Battery not found" });
  }

  res.json({ success: true, data: battery });
};

exports.deleteBattery = async (req, res) => {
  await Battery.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Battery deleted" });
};
