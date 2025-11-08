const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');

// CRUD routes
router.post('/', vendorController.createVendor);
router.get('/', vendorController.getVendors);
router.get('/:id', vendorController.getVendorById);
router.put('/:id', vendorController.updateVendor);
router.delete('/:id', vendorController.deleteVendor);

// Nearby vendors
router.get('/nearby/search', vendorController.getNearbyVendors);

module.exports = router;
