const Wishlist = require("../models/Wishlist");

// 🧠 Helper to build live URLs dynamically (works on LAN/production)
const getLiveUrl = (req, filename) =>
  filename ? `${req.protocol}://${req.get("host")}/${filename.replace(/^\/+/, "")}` : null;

const getLiveUrls = (req, files) =>
  files && files.length > 0 ? files.map((f) => getLiveUrl(req, f)) : [];

// 🔁 Toggle Wishlist
exports.toggleWishlist = async (req, res) => {
  try {
    const { user_id, product_id } = req.body;

    if (!user_id || !product_id) {
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "user_id and product_id are required",
      });
    }

    const existing = await Wishlist.findOne({ user_id, product_id });

    if (existing) {
      await Wishlist.findByIdAndDelete(existing._id);
      return res.status(200).json({
        status: "success",
        code: 200,
        message: "Removed from wishlist",
        action: false,
      });
    }

    const newItem = await Wishlist.create({ user_id, product_id });
    res.status(201).json({
      status: "success",
      code: 201,
      message: "Added to wishlist",
      action: true,
      data: newItem,
    });
  } catch (error) {
    console.error("❌ toggleWishlist Error:", error);
    res.status(500).json({
      status: "error",
      code: 500,
      message: "Server error",
      error: error.message,
    });
  }
};

// 📜 Get Wishlist (with full live image URLs)
exports.getUserWishlist = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "user_id is required",
      });
    }

    const wishlist = await Wishlist.find({ user_id })
      .populate("product_id")
      .sort({ createdAt: -1 });

    const formattedWishlist = wishlist.map((item) => {
      const p = item.product_id ? item.product_id.toObject() : null;
      if (p) {
        // ✅ Fix the image URLs
        p.image_url = getLiveUrl(req, p.image_url);
        p.thumbnails = getLiveUrls(req, p.thumbnails);
      }

      return {
        _id: item._id,
        user_id: item.user_id,
        product: p,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });

    return res.status(200).json({
      status: "success",
      code: 200,
      message: "Wishlist retrieved successfully.",
      data: formattedWishlist,
    });
  } catch (error) {
    console.error("❌ getUserWishlist Error:", error);
    res.status(500).json({
      status: "error",
      code: 500,
      message: "Server error",
      error: error.message,
    });
  }
};
