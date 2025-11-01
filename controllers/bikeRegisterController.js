const axios = require("axios");
const BikeRegister = require("../models/bikeRegisterModel");




exports.createBikeRegister = async (req, res) => {
  try {
    const { bikeId, bikeName, user_id } = req.body;

    console.log("Body",req.body);
// change
    // Step 1: Register the bike in DB

    let apiResponse = null;

    // Step 2: Call external API
    try {
      apiResponse = await axios.post(
        "http://192.168.1.124:8080/api/v1/device/register",
        {
          bikeId,
          bikeName,
          user_id
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    console.log("apiResponse", apiResponse.data);
    const bike = await BikeRegister.create({ bikeId,user_id,bikeName});
    console.log(" bike Registered", bike);
   return res.status(201).json({
      status: "success",
      message: apiResponse.message,
      data: {
        bike,
        apiResponse: apiResponse ? apiResponse.data : null,
      },
    });
    } catch (apiError) {
        console.log(
        "Error in API calling:",
        apiError.response.data,
      );
      return res.status(400).json({
      status: "error",
      message:  apiError.response.data.message,
    });
    
  }
  } catch (error) {
  return  res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};



// Get all bike registers
exports.getBikeRegisters = async (req, res) => {
  try {
    const bikes = await BikeRegister.find();

    res.status(200).json({
      status: "success",
      message: "Bike registers retrieved successfully",
      data: bikes,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get a single bike register by bikeId
exports.getBikeRegisterById = async (req, res) => {
  try {
    const bike = await BikeRegister.findOne({ bikeId: req.params.bikeId });

    if (!bike) {
      return res.status(404).json({
        status: "error",
        message: "Bike not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Bike register retrieved successfully",
      data: bike,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Update a bike register
exports.updateBikeRegister = async (req, res) => {
  try {
    const bike = await BikeRegister.findOneAndUpdate(
      { bikeId: req.params.bikeId },
      req.body,
      { new: true }
    );

    if (!bike) {
      return res.status(404).json({
        status: "error",
        message: "Bike not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Bike register updated successfully",
      data: bike,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Delete a bike register
exports.deleteBikeRegister = async (req, res) => {
  try {
    const bike = await BikeRegister.findOneAndDelete({ bikeId: req.params.bikeId });

    if (!bike) {
      return res.status(404).json({
        status: "error",
        message: "Bike not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Bike deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};
