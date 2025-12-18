const FriendsFamily = require("../models/friendsFamily");
const cloudinary = require("../config/cloudinary");

exports.createFriendsFamily = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      alternative_phone,
      shipping_address,
      model_name
    } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image is required"
      });
    }

    // Upload image to cloudinary
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "friends_family"
    });

    const data = await FriendsFamily.create({
      name,
      email,
      phone,
      alternative_phone,
      shipping_address,
      model_name,
      or_image: uploadResult.secure_url
    });

    res.status(201).json({
      success: true,
      message: "Friends & Family data saved successfully",
      data
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
