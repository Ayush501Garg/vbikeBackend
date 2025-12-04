const Enquiry = require("../models/enquiry");

// Helper
const sendError = (res, code, msg) =>
  res.status(code).json({ status: "error", code, message: msg });

// --------------------- CREATE ---------------------
exports.createEnquiry = async (req, res) => {
  try {
    const { name, email, phone, subject, query } = req.body;

    if (!name || !email || !subject || !query) {
      return sendError(res, 400, "Name, email, subject, query are required.");
    }

    const data = await Enquiry.create({ name, email, phone, subject, query });

    res.status(201).json({
      status: "success",
      message: "Enquiry submitted successfully",
      data
    });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

// --------------------- GET ALL ---------------------
exports.getEnquiries = async (req, res) => {
  try {
    const list = await Enquiry.find().sort({ createdAt: -1 });
    res.json({ status: "success", data: list });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

// --------------------- GET SINGLE ---------------------
exports.getEnquiry = async (req, res) => {
  try {
    const data = await Enquiry.findById(req.params.id);
    if (!data) return sendError(res, 404, "Enquiry not found");

    res.json({ status: "success", data });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

// --------------------- UPDATE ---------------------
exports.updateEnquiry = async (req, res) => {
  try {
    const data = await Enquiry.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!data) return sendError(res, 404, "Enquiry not found");

    res.json({
      status: "success",
      message: "Enquiry updated successfully",
      data
    });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

// --------------------- DELETE ---------------------
exports.deleteEnquiry = async (req, res) => {
  try {
    const data = await Enquiry.findByIdAndDelete(req.params.id);
    if (!data) return sendError(res, 404, "Enquiry not found");

    res.json({
      status: "success",
      message: "Enquiry deleted successfully"
    });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};
