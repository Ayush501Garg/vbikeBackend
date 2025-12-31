const BatteryCategory = require("../models/BatteryCategory");

/* CREATE */
exports.createCategory = async (req, res) => {
  try {
    const category = await BatteryCategory.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

/* GET ALL */
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await BatteryCategory.find();
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/* UPDATE */
exports.updateCategory = async (req, res) => {
  try {
    const category = await BatteryCategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!category)
      return res.status(404).json({ message: "Category not found" });

    res.json({ success: true, data: category });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

/* DELETE */
exports.deleteCategory = async (req, res) => {
  try {
    const category = await BatteryCategory.findByIdAndDelete(req.params.id);

    if (!category)
      return res.status(404).json({ message: "Category not found" });

    res.json({ success: true, message: "Category deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
