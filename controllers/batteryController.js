
/* CREATE */
const Battery = require("../models/Battery");

/* CREATE */
exports.createBattery = async (req, res) => {
  try {
    if (req.files?.image) {
      req.body.image_url = `/uploads/${req.files.image[0].originalname}`;
    }

    if (req.files?.thumbnails) {
      req.body.thumbnails = req.files.thumbnails.map(
        file => `/uploads/${file.originalname}`
      );
    }

    const battery = await Battery.create(req.body);

    res.status(201).json({ success: true, data: battery });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

/* UPDATE */
exports.updateBattery = async (req, res) => {
  try {
    if (req.files?.image) {
      req.body.image_url = `/uploads/${req.files.image[0].originalname}`;
    }

    if (req.files?.thumbnails) {
      req.body.thumbnails = req.files.thumbnails.map(
        file => `/uploads/${file.originalname}`
      );
    }

    const battery = await Battery.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!battery)
      return res.status(404).json({ message: "Battery not found" });

    res.json({ success: true, data: battery });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};


/* GET ALL */
exports.getAllBatteries = async (req, res) => {
  try {
    const batteries = await Battery.find()
      .populate("category_id", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: batteries.length, data: batteries });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/* GET SINGLE */
exports.getBatteryById = async (req, res) => {
  try {
    const battery = await Battery.findById(req.params.id)
      .populate("category_id", "name");

    if (!battery)
      return res.status(404).json({ message: "Battery not found" });

    res.json({ success: true, data: battery });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};



/* DELETE */
exports.deleteBattery = async (req, res) => {
  try {
    const battery = await Battery.findByIdAndDelete(req.params.id);

    if (!battery)
      return res.status(404).json({ message: "Battery not found" });

    res.json({ success: true, message: "Battery deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
