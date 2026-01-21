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
    getSuperVendorDashboard
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

// Assign sub-vendors to super vendor
router.post('/:id/assign-vendors', assignSubVendors);

// Remove sub-vendor from super vendor
router.post('/:id/remove-vendor', removeSubVendor);

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
