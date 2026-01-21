const express = require('express');
const router = express.Router();

const {
    createSuperVendor,
    getAllSuperVendors,
    getSuperVendorById,
    updateSuperVendor,
    deleteSuperVendor,
    assignSubVendors,
    removeSubVendor,
    getSuperVendorByState,
    findNearbySuperVendors,
    getSuperVendorDashboard,
    assignInventoryToSuperVendor,
    getSuperVendorInventory,
    transferInventoryToSubVendor,
    getSubVendorInventory,
    createSubVendor,
    setProductPricing,
    sellProductBySuperVendor,
    updatePricingRules
} = require('../controllers/superVendorController');

const {
    recordPayment,
    getLedger,
    exportLedger,
    createInvoice,
    getInvoices,
    getInvoiceById,
    updateInvoiceStatus,
    deleteTransaction,
    getPaymentStatistics
} = require('../controllers/superVendorPaymentController');

const { protect, authorize } = require('../middlewares/authMiddleware');

// Apply authentication middleware to all routes
// router.use(protect);
// router.use(authorize('admin', 'super_admin'));

// ===== SUPER VENDOR CRUD ROUTES =====

// GET all super vendors & CREATE new super vendor
router.route('/')
    .get(getAllSuperVendors)
    .post(createSuperVendor);

// GET super vendors nearby (geo-location based)
router.get('/nearby', findNearbySuperVendors);

// GET super vendor by state
router.get('/state/:state', getSuperVendorByState);

// GET, UPDATE, DELETE specific super vendor
router.route('/:id')
    .get(getSuperVendorById)
    .put(updateSuperVendor)
    .delete(deleteSuperVendor);

// GET dashboard stats for super vendor
router.get('/:id/dashboard', getSuperVendorDashboard);

// ===== SUB-VENDOR MANAGEMENT ROUTES =====

// Create sub vendor under super vendor
router.post('/:id/create-sub-vendor', createSubVendor);

// Assign sub-vendors to super vendor
router.post('/:id/assign-vendors', assignSubVendors);

// Remove sub-vendor from super vendor
router.post('/:id/remove-vendor', removeSubVendor);

// ===== PRICING ROUTES =====

// Set pricing for a product in super vendor inventory
router.put('/:id/inventory/:productId/pricing', setProductPricing);

// Update default pricing rules for sub vendors
router.put('/:id/pricing-rules', updatePricingRules);

// ===== SALES ROUTES =====

// Super vendor sells product directly
router.post('/:id/sell', sellProductBySuperVendor);

// ===== INVENTORY ROUTES =====

// Assign inventory to super vendor from company warehouse
router.post('/:id/inventory/assign', assignInventoryToSuperVendor);

// Get super vendor inventory
router.get('/:id/inventory', getSuperVendorInventory);

// Transfer inventory to sub vendor
router.post('/:id/sub-vendors/:vendorId/inventory', transferInventoryToSubVendor);

// Get sub vendor inventory under a super vendor
router.get('/:id/sub-vendors/:vendorId/inventory', getSubVendorInventory);

// ===== PAYMENT & TRANSACTION ROUTES =====

// Record payment for super vendor
router.post('/:id/payments', recordPayment);

// Get ledger for super vendor
router.get('/:id/ledger', getLedger);

// Export ledger to CSV
router.get('/:id/ledger/export', exportLedger);

// Get payment statistics
router.get('/:id/payment-stats', getPaymentStatistics);

// Delete transaction
router.delete('/transactions/:transaction_id', deleteTransaction);

// ===== INVOICE ROUTES =====

// Create invoice & Get all invoices for super vendor
router.route('/:id/invoices')
    .post(createInvoice)
    .get(getInvoices);

// Get single invoice
router.get('/invoices/:invoice_id', getInvoiceById);

// Update invoice status
router.put('/invoices/:invoice_id/status', updateInvoiceStatus);

module.exports = router;
