const FriendsFamily = require("../models/friendsFamily");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier"); // ensure installed

exports.createFriendsFamily = async (req, res) => {
  try {
    const { name, email, phone, alternative_phone, shipping_address, model_name } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "or_image file is required" });
    }

    // Cloudinary upload
    const uploadedImageUrl = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: "friends_family" }, (err, result) => {
        if (err) reject(err);
        resolve(result.secure_url);
      });
      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });

    const newData = await FriendsFamily.create({
      name,
      email,
      phone,
      alternative_phone,
      shipping_address,
      model_name,
      or_image: uploadedImageUrl,
    });

    res.json({ success: true, message: "Friends & Family data saved successfully", data: newData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
