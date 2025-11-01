const BikeType = require("../models/BikeType");

exports.createType = async (req, res) => {
  try {
    const type = await BikeType.create(req.body);
    res.status(201).json({ status: "success", data: type });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.getTypes = async (req, res) => {
  const types = await BikeType.find();
  res.json({ status: "success", data: types });
};

exports.updateType = async (req, res) => {
  const type = await BikeType.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ status: "success", data: type });
};

exports.deleteType = async (req, res) => {
  await BikeType.findByIdAndDelete(req.params.id);
  res.json({ status: "success", message: "Deleted" });
};
