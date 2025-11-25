const Approval = require("../models/VendorProductApproval");

// CREATE
exports.createApproval = async (req, res) => {
  try {
    const { vendor_id, product_id, vendor_message, admin_message, status, quantity } = req.body;

    const approval = await Approval.create({
      vendor_id,
      product_id,
      vendor_message,
      admin_message,
      status,
      quantity,  // 👈 added field
    });

    res.status(201).json({ status: "success", data: approval });
  } catch (e) {
    res.status(500).json({ status: "error", message: e.message });
  }
};

// GET ALL
exports.getAllApprovals = async (req, res) => {
  try {
    const data = await Approval.find();
    res.json({ status: "success", count: data.length, data });
  } catch (e) {
    res.status(500).json({ status: "error", message: e.message });
  }
};

// GET BY ID
exports.getApprovalById = async (req, res) => {
  try {
    const item = await Approval.findById(req.params.id);
    if (!item) return res.status(404).json({ status: "error", message: "Not found" });
    res.json({ status: "success", data: item });
  } catch (e) {
    res.status(500).json({ status: "error", message: e.message });
  }
};

// UPDATE
exports.updateApproval = async (req, res) => {
  try {
    const { vendor_id, product_id, vendor_message, admin_message, status, quantity } = req.body;

    const updated = await Approval.findByIdAndUpdate(
      req.params.id,
      {
        vendor_id,
        product_id,
        vendor_message,
        admin_message,
        status,
        quantity, // 👈 added field
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ status: "error", message: "Not found" });
    res.json({ status: "success", data: updated });
  } catch (e) {
    res.status(500).json({ status: "error", message: e.message });
  }
};

// DELETE
exports.deleteApproval = async (req, res) => {
  try {
    const removed = await Approval.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ status: "error", message: "Not found" });
    res.json({ status: "success", message: "Deleted successfully" });
  } catch (e) {
    res.status(500).json({ status: "error", message: e.message });
  }
};
