const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const featuredCtrl = require('../controllers/featuredOfferController');

// ============================
// Multer Storage
// ============================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const title = req.body.title || 'offer';
    const timestamp = Date.now();

    const safeName = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
    const ext = path.extname(file.originalname);

    cb(null, `${safeName}-${timestamp}${ext}`);
  }
});

// ============================
// File Filter
// ============================
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Only JPEG, JPG, PNG, or WEBP images allowed.'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ============================
// Error Handler
// ============================
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ status: "error", message: err.message });
  }
  if (err) {
    return res.status(400).json({ status: "error", message: err.message });
  }
  next();
};

// ============================
// CRUD Routes
// ============================

// CREATE
router.post(
  '/',
  upload.fields([{ name: 'image', maxCount: 1 }]),
  handleUploadErrors,
  featuredCtrl.createOffer
);

// GET ALL
router.get('/', featuredCtrl.getOffers);

// GET SINGLE
router.get('/:id', featuredCtrl.getOffer);

// UPDATE
router.put(
  '/:id',
  upload.fields([{ name: 'image', maxCount: 1 }]),
  handleUploadErrors,
  featuredCtrl.updateOffer
);

// DELETE
router.delete('/:id', featuredCtrl.deleteOffer);

module.exports = router;
