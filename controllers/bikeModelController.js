const BikeModel = require("../models/BikeModel");

exports.createModel = async (req, res) => {
  try {
    const model = await BikeModel.create(req.body);
    res.status(201).json({ status: "success", data: model });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.getModels = async (req, res) => {
  const models = await BikeModel.find();
  res.json({ status: "success", data: models });
};

exports.getSingleModel = async (req, res) => {
  const model = await BikeModel.findById(req.params.id);
  res.json({ status: "success", data: model });
};

exports.updateModel = async (req, res) => {
  const model = await BikeModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ status: "success", data: model });
};

exports.deleteModel = async (req, res) => {
  await BikeModel.findByIdAndDelete(req.params.id);
  res.json({ status: "success", message: "Deleted" });
};
