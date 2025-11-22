const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');

// CRUD routes
router.post('/', vendorController.createVendor);
router.get('/', vendorController.getVendors);
router.get('/:id', vendorController.getVendorById);
router.put('/:id', vendorController.updateVendor);
router.delete('/:id', vendorController.deleteVendor);

// Inventory Management
router.post("/inventory/add", vendorController.addProductToInventory);
router.put("/inventory/update", vendorController.updateInventory);
router.delete("/inventory/remove", vendorController.removeProductFromInventory);
router.get("/product/total/:productId", vendorController.getTotalAssignedStock);
router.get("/products/total", vendorController.getAllProductsTotalStock);

// Nearby vendors
router.get('/nearby/search', vendorController.getNearbyVendors);

module.exports = router;
