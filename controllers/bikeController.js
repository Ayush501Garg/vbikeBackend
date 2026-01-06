const Bike = require("../models/Bike");
const BikeModel = require('../models/BikeModel');
const BikeType = require('../models/BikeType');

exports.createBike = async (req, res) => {
  try {
    const { modelId, typeId, registrationNumber, color, year, price, mrp, status } = req.body;

    console.log("req.body", req.body);

    // ✅ Check model existence
    const model = await BikeModel.findById(modelId);
    if (!model) {
      return res.status(404).json({ status: "error", message: "Bike model not found" });
    }

    // ✅ Check type existence
    const type = await BikeType.findById(typeId);
    if (!type) {
      return res.status(404).json({ status: "error", message: "Bike type not found" });
    }

    // ✅ Create bike
    const bike = await Bike.create({
      modelId,
      typeId,
      registrationNumber,
      color,
      year,
      price,
      mrp,
      status,
    });

    res.status(201).json({ status: "success", data: bike });
  } catch (err) {
    console.error("CreateBike Error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.getBikes = async (req, res) => {
  try {
    const bikes = await Bike.find()
      .populate("modelId")
      .populate("typeId");

    // Transform response
    const formattedBikes = bikes.map((bike) => ({
      id: bike._id,
      registrationNumber: bike.registrationNumber,
      color: bike.color,
      year: bike.year,
      price: bike.price,
      mrp: bike.mrp,
      status: bike.status,
      model: bike.modelId ? {
        id: bike.modelId._id,
        name: bike.modelId.modelName,
        brand: bike.modelId.brand,
        fuelType:bike.modelId.fuelType,
        batteryCapacity: bike.modelId.batteryCapacity,
        rangePerCharge: bike.modelId.rangePerCharge,
        chargingTime: bike.modelId.chargingTime,
        topSpeed: bike.modelId.topSpeed,
        status: bike.modelId.status
      } : null,
      type: bike.typeId ? {
        id: bike.typeId._id,
        name: bike.typeId.name,
        status: bike.typeId.status 
      } : null,
      createdAt: bike.createdAt,
      updatedAt: bike.updatedAt,
    }));

    res.json({ status: "success", data: formattedBikes });
  } catch (err) {
    console.error("GetBikes Error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.getSingleBike = async (req, res) => {
  try {
    const bike = await Bike.findById(req.params.id)
      .populate("modelId")
      .populate("typeId");

    if (!bike) {
      return res.status(404).json({ status: "error", message: "Bike not found" });
    }

    // Format response
    const formattedBike = {
      id: bike._id,
      registrationNumber: bike.registrationNumber,
      color: bike.color,
      year: bike.year,
      price: bike.price,
      mrp: bike.mrp,
      status: bike.status,
      model: bike.modelId ? {
        id: bike.modelId._id,
        name: bike.modelId.modelName,
        brand: bike.modelId.brand,
        batteryCapacity: bike.modelId.batteryCapacity,
        range: bike.modelId.range,
        status: bike.modelId.status
      } : null,
      type: bike.typeId ? {
        id: bike.typeId._id,
        name: bike.typeId.name,
        status: bike.typeId.status
      } : null,
      createdAt: bike.createdAt,
      updatedAt: bike.updatedAt,
    };

    res.json({ status: "success", data: formattedBike });
  } catch (err) {
    console.error("GetSingleBike Error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.updateBike = async (req, res) => {
  const bike = await Bike.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ status: "success", data: bike });
};

exports.deleteBike = async (req, res) => {
  await Bike.findByIdAndDelete(req.params.id);
  res.json({ status: "success", message: "Deleted" });
};
