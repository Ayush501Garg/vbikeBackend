const multer = require("multer");
const fs = require("fs");
const path = require("path");

// ============================
// Multer Storage Configuration
// ============================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },

  // 🔥 Save file with EXACT original name
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

// ============================
// File Filter
// ============================
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only JPG, JPEG, PNG, or WEBP files allowed"));
  }

  cb(null, true);
};

// ============================
// Upload instance
// ============================
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

// ============================
// Error Handler
// ============================
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      status: "error",
      message: `Upload error: ${err.message}`
    });
  }

  if (err) {
    return res.status(400).json({
      status: "error",
      message: err.message
    });
  }

  next();
};

module.exports = { upload, handleUploadErrors };
