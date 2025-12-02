const AccessoryCategory = require("../models/accessoryCategory");

const sendError = (res, code, message) =>
  res.status(code).json({ status: "error", code, message });

// CREATE CATEGORY
exports.createCategory = async (req, res) => {
  try {
    const { name, is_active } = req.body;

    if (!name) return sendError(res, 400, "Category name is required.");

    const exists = await AccessoryCategory.findOne({ name });
    if (exists) return sendError(res, 400, "Category already exists.");

    const category = new AccessoryCategory({ name, is_active });
    await category.save();

    res.json({
      status: "success",
      message: "Category created successfully",
      data: category
    });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

// GET ALL
exports.getCategories = async (req, res) => {
  try {
    const list = await AccessoryCategory.find().select("-__v");

    res.json({ status: "success", data: list });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

// DELETE CATEGORY
exports.deleteCategory = async (req, res) => {
  try {
    const category = await AccessoryCategory.findByIdAndDelete(req.params.id);
    if (!category) return sendError(res, 404, "Category not found.");

    res.json({
      status: "success",
      message: "Category deleted successfully"
    });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};
