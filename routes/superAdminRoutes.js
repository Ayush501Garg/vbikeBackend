const express = require('express');
const router = express.Router();

const {
    getMainInventory,
    addStockToMainInventory,
    allocateToSuperVendor,
    allocateToSubVendor,
    sellProduct,
    getAllVendorsReport,
    getInventoryReport,
    updateProductBasePrice
} = require('../controllers/superAdminController');

const { protect, authorize } = require('../middlewares/authMiddleware');

// Apply authentication middleware to all routes
// router.use(protect);
// router.use(authorize('super_admin'));

// ===== INVENTORY MANAGEMENT =====

// Get main inventory
router.get('/inventory', getMainInventory);

// Add stock to main inventory
router.post('/inventory/add-stock', addStockToMainInventory);

// ===== ALLOCATION ROUTES =====

// Allocate inventory to Super Vendor
router.post('/allocate/super-vendor', allocateToSuperVendor);

// Allocate inventory directly to Sub Vendor
router.post('/allocate/sub-vendor', allocateToSubVendor);

// ===== SALES =====

// Super Admin sells product directly
router.post('/sell', sellProduct);

// ===== REPORTS =====

// Get all vendors report
router.get('/vendors/all', getAllVendorsReport);

// Get inventory report across all levels
router.get('/reports/inventory', getInventoryReport);

// ===== PRODUCT MANAGEMENT =====

// Update product base price
router.put('/products/:id/base-price', updateProductBasePrice);

module.exports = router;
