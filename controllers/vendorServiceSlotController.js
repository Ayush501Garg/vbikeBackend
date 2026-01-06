const VendorServiceSlot = require("../models/VendorServiceSlot");
const mongoose = require("mongoose");

/* ================= CREATE SLOT ================= */
exports.createSlot = async (req, res) => {
  try {
    const { vendor_id } = req.body;

    if (!mongoose.Types.ObjectId.isValid(vendor_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vendor id"
      });
    }

    const exists = await VendorServiceSlot.findOne({ vendor_id });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Slot already exists for this vendor"
      });
    }

    const slot = await VendorServiceSlot.create(req.body);

    res.status(201).json({
      success: true,
      message: "Vendor slot created successfully",
      data: slot
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ================= UPDATE SLOT ================= */
exports.updateSlot = async (req, res) => {
  try {
    const { vendorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vendor id"
      });
    }

    const slot = await VendorServiceSlot.findOneAndUpdate(
      { vendor_id: vendorId },
      req.body,
      { new: true }
    );

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Vendor slot not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Vendor slot updated successfully",
      data: slot
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ================= GET SLOT ================= */
exports.getVendorSlot = async (req, res) => {
  try {
    const { vendorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vendor id"
      });
    }

    const slot = await VendorServiceSlot.findOne({ vendor_id: vendorId });

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Vendor slot configuration not found"
      });
    }

    res.status(200).json({
      success: true,
      data: slot
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ================= DELETE SLOT ================= */
exports.deleteVendorSlot = async (req, res) => {
  try {
    const { vendorId } = req.params;

    await VendorServiceSlot.findOneAndDelete({ vendor_id: vendorId });

    res.status(200).json({
      success: true,
      message: "Vendor slot deleted successfully"
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
