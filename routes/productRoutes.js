const express = require('express');
const router = express.Router();
const multer = require('multer');
const productController = require('../controllers/productController');
const fs = require('fs');
const path = require('path');

// ============================
// Multer Storage Configuration
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
    const productName = req.body.name || 'product';
    const timestamp = Date.now();

    // Sanitize name
    const safeName = productName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '');

    const ext = path.extname(file.originalname);

    // ✅ Add timestamp to avoid overwriting files with same name
    cb(null, `${safeName}-${timestamp}${ext}`);
  }
});

// ============================
// Multer File Filter (for validation)
// ============================
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Only JPEG, JPG, PNG, or WEBP image files are allowed.'));
  }
  cb(null, true);
};

// ============================
// Multer Upload Setup
// ============================
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB limit
});

// ============================
// Error Handling Middleware (for multer)
// ============================
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    return res.status(400).json({
      status: 'error',
      code: 400,
      message: `File upload error: ${err.message}`
    });
  } else if (err) {
    // Other upload errors
    return res.status(400).json({
      status: 'error',
      code: 400,
      message: err.message
    });
  }
  next();
};

// ============================
// Routes
// ============================

// Create Product
router.post(
  '/',
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'thumbnails', maxCount: 5 }
  ]),
  handleUploadErrors,
  productController.createProduct
);

// Get All Products
router.get('/', productController.getProducts);

// Get Single Product
router.get('/:id', productController.getProduct);

// Update Product
router.put(
  '/:id',
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'thumbnails', maxCount: 5 }
  ]),
  handleUploadErrors,
  productController.updateProduct
);

// Delete Product
router.delete('/:id', productController.deleteProduct);

module.exports = router;
