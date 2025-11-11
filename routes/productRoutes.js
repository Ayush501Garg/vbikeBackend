const express = require('express');
const router = express.Router();
const multer = require('multer');
const productController = require('../controllers/productController');
const fs = require('fs');
const path = require('path');

// Multer storage config
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

    // Sanitize product name: lowercase, replace spaces with dashes, remove invalid chars
    const safeName = productName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');

    // Keep original extension
    const ext = path.extname(file.originalname);

    // Filename = sanitized product name + extension
    const filename = `${safeName}${ext}`;

    cb(null, filename);
  }
});





const upload = multer({ storage });

// Routes
router.post('/', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'thumbnails', maxCount: 5 }]), productController.createProduct);
router.get('/', productController.getProducts);
router.get('/:id', productController.getProduct);
router.put('/:id', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'thumbnails', maxCount: 5 }]), productController.updateProduct);
router.delete('/:id', productController.deleteProduct);



module.exports = router;
