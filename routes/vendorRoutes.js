const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');

router.post('/', vendorController.createVendor);
router.get('/', vendorController.getVendors);
router.get('/nearby', vendorController.getNearbyVendors);

module.exports = router;
