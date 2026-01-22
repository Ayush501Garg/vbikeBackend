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
    updateProductBasePrice,
    getAllSubVendors,
    getSubVendorDetails,
    updateSubVendorStatus,
    getSubVendorLedger,
    getSubVendorPayments,
    recordSubVendorPayment,
    getSubVendorTransactions,
    getSubVendorInvoices,
    getSubVendorsByState,
    getSubVendorReport
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

// ===== SUB VENDOR MANAGEMENT =====

// Get all sub vendors
router.get('/sub-vendors', getAllSubVendors);

// Get sub vendors by state
router.get('/sub-vendors/state/:state', getSubVendorsByState);

// Get detailed sub vendor info
router.get('/sub-vendors/:id', getSubVendorDetails);

// Update sub vendor status
router.put('/sub-vendors/:id/status', updateSubVendorStatus);

// Get sub vendor account ledger
router.get('/sub-vendors/:id/ledger', getSubVendorLedger);

// Get sub vendor payment history
router.get('/sub-vendors/:id/payments', getSubVendorPayments);

// Record payment from sub vendor
router.post('/sub-vendors/:id/record-payment', recordSubVendorPayment);

// Get sub vendor transaction history
router.get('/sub-vendors/:id/transactions', getSubVendorTransactions);

// Get sub vendor invoice history
router.get('/sub-vendors/:id/invoices', getSubVendorInvoices);

// Get sub vendor performance report
router.get('/sub-vendors/:id/report', getSubVendorReport);

module.exports = router;
