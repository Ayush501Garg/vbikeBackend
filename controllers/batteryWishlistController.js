const BatteryWishlist = require("../models/BatteryWishlist");
const Battery = require("../models/Battery");
const mongoose = require("mongoose");

/* ================= ADD TO WISHLIST ================= */
exports.addToWishlist = async (req, res) => {
  try {
    const { user_id, battery_id } = req.body;

    const userObjectId = new mongoose.Types.ObjectId(user_id);
    const batteryObjectId = new mongoose.Types.ObjectId(battery_id);

    const battery = await Battery.findById(batteryObjectId);
    if (!battery || !battery.is_active) {
      return res.status(404).json({
        success: false,
        message: "Battery not available"
      });
    }

    const alreadyExists = await BatteryWishlist.findOne({
      user_id: userObjectId,
      battery_id: batteryObjectId
    });

    if (alreadyExists) {
      return res.status(200).json({
        success: true,
        message: "Battery already in wishlist"
      });
    }

    const wishlistItem = await BatteryWishlist.create({
      user_id: userObjectId,
      battery_id: batteryObjectId
    });

    res.status(200).json({
      success: true,
      message: "Battery added to wishlist",
      data: wishlistItem
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ================= GET USER WISHLIST ================= */
exports.getUserWishlist = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.userId);

    const wishlist = await BatteryWishlist.find({ user_id: userId })
      .populate("battery_id", "name price image_url capacity brand");

    res.status(200).json({
      success: true,
      count: wishlist.length,
      data: wishlist
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ================= REMOVE FROM WISHLIST ================= */
exports.removeFromWishlist = async (req, res) => {
  try {
    const item = await BatteryWishlist.findByIdAndDelete(
      req.params.wishlistId
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Wishlist item not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Battery removed from wishlist"
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ================= CLEAR WISHLIST ================= */
exports.clearWishlist = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.userId);

    await BatteryWishlist.deleteMany({ user_id: userId });

    res.status(200).json({
      success: true,
      message: "Battery wishlist cleared successfully"
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
