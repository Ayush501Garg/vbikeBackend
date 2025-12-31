const AccessoryWishlist = require("../models/AccessoryWishlist");
const Accessory = require("../models/accessory");
const mongoose = require("mongoose");

/* ================= ADD TO WISHLIST ================= */
exports.addToWishlist = async (req, res) => {
  try {
    const { user_id, accessory_id } = req.body;

    const userObjectId = new mongoose.Types.ObjectId(user_id);
    const accessoryObjectId = new mongoose.Types.ObjectId(accessory_id);

    const accessory = await Accessory.findById(accessoryObjectId);
    if (!accessory || !accessory.is_active) {
      return res.status(404).json({
        success: false,
        message: "Accessory not available"
      });
    }

    const alreadyExists = await AccessoryWishlist.findOne({
      user_id: userObjectId,
      accessory_id: accessoryObjectId
    });

    if (alreadyExists) {
      return res.status(200).json({
        success: true,
        message: "Accessory already in wishlist"
      });
    }

    const wishlistItem = await AccessoryWishlist.create({
      user_id: userObjectId,
      accessory_id: accessoryObjectId
    });

    res.status(200).json({
      success: true,
      message: "Accessory added to wishlist",
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

    const wishlist = await AccessoryWishlist.find({ user_id: userId })
      .populate("accessory_id", "name price image_url category");

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
    const item = await AccessoryWishlist.findByIdAndDelete(
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
      message: "Accessory removed from wishlist"
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ================= CLEAR WISHLIST ================= */
exports.clearWishlist = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.userId);

    await AccessoryWishlist.deleteMany({ user_id: userId });

    res.status(200).json({
      success: true,
      message: "Wishlist cleared successfully"
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
