const SuperVendor = require('../models/SuperVendor');
const SuperVendorTransaction = require('../models/SuperVendorTransaction');
const SuperVendorInvoice = require('../models/SuperVendorInvoice');

// @desc    Record Payment for Super Vendor
// @route   POST /api/super-vendors/:id/payments
// @access  Admin
exports.recordPayment = async (req, res) => {
    try {
    const {
        amount,
        payment_date,
        payment_method,
        payment_reference,
        cheque_number,
        utr_number,
        notes,
        invoice_id
    } = req.body;

    const superVendor = await SuperVendor.findById(req.params.id);

    if (!superVendor) {
        return res.status(404).json({
            success: false,
            message: 'Super Vendor not found'
        });
    }

    if (!amount || amount <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid payment amount'
        });
    }

    // Generate reference number
    const timestamp = Date.now();
    const reference_number = `PAY-SV-${timestamp}`;

    // Calculate balance after payment
    const balance_after = superVendor.total_pending - parseFloat(amount);

    // Create transaction
    const transaction = await SuperVendorTransaction.create({
        super_vendor: superVendor._id,
        transaction_type: 'payment',
        reference_number,
        amount: parseFloat(amount),
        payment_method,
        transaction_date: payment_date || new Date(),
        payment_reference: payment_reference || cheque_number || utr_number,
        cheque_number,
        utr_number,
        notes,
        balance_after,
        status: 'completed',
        related_invoice: invoice_id || null,
        created_by: req.user?._id
    });

    // Update super vendor's collected and pending amounts
    superVendor.total_collected += parseFloat(amount);
    superVendor.total_pending = superVendor.total_business - superVendor.total_collected;
    
    if (superVendor.total_business > 0) {
        superVendor.recovery_percentage = ((superVendor.total_collected / superVendor.total_business) * 100).toFixed(2);
    }
    
    await superVendor.save();

    // If invoice_id is provided, update invoice
    if (invoice_id) {
        const invoice = await SuperVendorInvoice.findById(invoice_id);
        if (invoice) {
            invoice.paid_amount += parseFloat(amount);
            invoice.payments.push({
                payment_id: transaction._id,
                amount: parseFloat(amount),
                payment_date: payment_date || new Date(),
                payment_method,
                reference: payment_reference || cheque_number || utr_number
            });
            await invoice.save();
        }
    }

    res.status(201).json({
        success: true,
        message: 'Payment recorded successfully',
        data: {
            transaction,
            updated_balance: superVendor.total_pending
        }
    });
    } catch (error) {
        console.error('Error recording payment:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error recording payment'
        });
    }
};

// @desc    Get Ledger for Super Vendor
// @route   GET /api/super-vendors/:id/ledger
// @access  Admin
exports.getLedger = async (req, res) => {
    try {
    const { startDate, endDate, transaction_type } = req.query;

    const superVendor = await SuperVendor.findById(req.params.id);

    if (!superVendor) {
        return res.status(404).json({
            success: false,
            message: 'Super Vendor not found'
        });
    }

    let query = { super_vendor: superVendor._id };

    if (transaction_type) {
        query.transaction_type = transaction_type;
    }

    if (startDate && endDate) {
        query.transaction_date = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }

    const transactions = await SuperVendorTransaction.find(query)
        .populate('related_invoice', 'invoice_number total_amount')
        .populate('created_by', 'name email')
        .sort({ transaction_date: -1, created_at: -1 });

    // Calculate summary
    const summary = {
        total_invoices: transactions.filter(t => t.transaction_type === 'invoice').length,
        total_payments: transactions.filter(t => t.transaction_type === 'payment').length,
        total_invoice_amount: transactions
            .filter(t => t.transaction_type === 'invoice')
            .reduce((sum, t) => sum + t.amount, 0),
        total_payment_amount: transactions
            .filter(t => t.transaction_type === 'payment')
            .reduce((sum, t) => sum + t.amount, 0),
        current_balance: superVendor.total_pending
    };

    res.status(200).json({
        success: true,
        count: transactions.length,
        summary,
        data: transactions
    });
    } catch (error) {
        console.error('Error getting ledger:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error getting ledger'
        });
    }
};

// @desc    Export Ledger to CSV
// @route   GET /api/super-vendors/:id/ledger/export
// @access  Admin
exports.exportLedger = async (req, res) => {
    try {
    const superVendor = await SuperVendor.findById(req.params.id);

    if (!superVendor) {
        return res.status(404).json({
            success: false,
            message: 'Super Vendor not found'
        });
    }

    const transactions = await SuperVendorTransaction.find({ 
        super_vendor: superVendor._id 
    })
        .populate('related_invoice', 'invoice_number')
        .sort({ transaction_date: -1 });

    // Convert to CSV format
    const csvData = [
        ['Date', 'Transaction Type', 'Reference', 'Payment Method', 'Amount', 'Balance', 'Status']
    ];

    transactions.forEach(t => {
        csvData.push([
            new Date(t.transaction_date).toLocaleDateString('en-IN'),
            t.transaction_type,
            t.reference_number,
            t.payment_method || '-',
            `₹${t.amount.toLocaleString('en-IN')}`,
            `₹${t.balance_after.toLocaleString('en-IN')}`,
            t.status
        ]);
    });

    res.status(200).json({
        success: true,
        message: 'Ledger data ready for export',
        data: csvData,
        super_vendor: {
            company_name: superVendor.company_name,
            super_vendor_id: superVendor.super_vendor_id
        }
    });
    } catch (error) {
        console.error('Error exporting ledger:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error exporting ledger'
        });
    }
};

// @desc    Create Invoice for Super Vendor
// @route   POST /api/super-vendors/:id/invoices
// @access  Admin
exports.createInvoice = async (req, res) => {
    try {
    const {
        items,
        due_date,
        discount,
        terms_and_conditions,
        notes
    } = req.body;

    const superVendor = await SuperVendor.findById(req.params.id);

    if (!superVendor) {
        return res.status(404).json({
            success: false,
            message: 'Super Vendor not found'
        });
    }

    if (!items || items.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Invoice must have at least one item'
        });
    }

    // Generate invoice number
    const invoice_number = await SuperVendorInvoice.generateInvoiceNumber();

    // Calculate amounts
    let subtotal = 0;
    const processedItems = items.map(item => {
        const item_subtotal = item.quantity * item.unit_price;
        const item_discount = item.discount || 0;
        const taxable_amount = item_subtotal - item_discount;
        const tax_amount = (taxable_amount * (item.tax_rate || 18)) / 100;
        const total_amount = taxable_amount + tax_amount;
        
        subtotal += item_subtotal;
        
        return {
            ...item,
            tax_amount,
            total_amount
        };
    });

    const invoice_discount = discount || 0;
    const subtotal_after_discount = subtotal - invoice_discount;
    const total_tax = processedItems.reduce((sum, item) => sum + item.tax_amount, 0);
    const total_amount = processedItems.reduce((sum, item) => sum + item.total_amount, 0);

    // Create invoice
    const invoice = await SuperVendorInvoice.create({
        invoice_number,
        super_vendor: superVendor._id,
        invoice_date: new Date(),
        due_date: due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
        items: processedItems,
        subtotal,
        discount: invoice_discount,
        tax_amount: total_tax,
        total_amount,
        paid_amount: 0,
        balance_due: total_amount,
        status: 'pending',
        payment_status: 'unpaid',
        terms_and_conditions,
        notes,
        created_by: req.user?._id
    });

    // Create transaction entry
    await SuperVendorTransaction.create({
        super_vendor: superVendor._id,
        transaction_type: 'invoice',
        reference_number: invoice_number,
        invoice_number,
        amount: total_amount,
        transaction_date: new Date(),
        status: 'pending',
        balance_after: superVendor.total_pending + total_amount,
        related_invoice: invoice._id,
        notes: `Invoice raised: ${invoice_number}`,
        created_by: req.user?._id
    });

    // Update super vendor's business metrics
    superVendor.direct_business += total_amount;
    superVendor.total_business = superVendor.direct_business + superVendor.sub_vendor_business;
    superVendor.total_pending = superVendor.total_business - superVendor.total_collected;
    superVendor.direct_bikes_sold += processedItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    
    if (superVendor.total_business > 0) {
        superVendor.recovery_percentage = ((superVendor.total_collected / superVendor.total_business) * 100).toFixed(2);
    }
    
    await superVendor.save();

    res.status(201).json({
        success: true,
        message: 'Invoice created successfully',
        data: invoice
    });
    } catch (error) {
        console.error('Error creating invoice:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error creating invoice'
        });
    }
};

// @desc    Get all Invoices for Super Vendor
// @route   GET /api/super-vendors/:id/invoices
// @access  Admin
exports.getInvoices = async (req, res) => {
    try {
    const { status, payment_status } = req.query;

    const superVendor = await SuperVendor.findById(req.params.id);

    if (!superVendor) {
        return res.status(404).json({
            success: false,
            message: 'Super Vendor not found'
        });
    }

    let query = { super_vendor: superVendor._id };

    if (status) {
        query.status = status;
    }

    if (payment_status) {
        query.payment_status = payment_status;
    }

    const invoices = await SuperVendorInvoice.find(query)
        .populate('created_by', 'name email')
        .sort({ invoice_date: -1 });

    const summary = {
        total_invoices: invoices.length,
        total_amount: invoices.reduce((sum, inv) => sum + inv.total_amount, 0),
        total_paid: invoices.reduce((sum, inv) => sum + inv.paid_amount, 0),
        total_pending: invoices.reduce((sum, inv) => sum + inv.balance_due, 0),
        paid_invoices: invoices.filter(inv => inv.payment_status === 'paid').length,
        pending_invoices: invoices.filter(inv => inv.payment_status === 'unpaid').length,
        partially_paid_invoices: invoices.filter(inv => inv.payment_status === 'partially_paid').length,
        overdue_invoices: invoices.filter(inv => inv.status === 'overdue').length
    };

    res.status(200).json({
        success: true,
        count: invoices.length,
        summary,
        data: invoices
    });
    } catch (error) {
        console.error('Error getting invoices:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error getting invoices'
        });
    }
};

// @desc    Get Single Invoice
// @route   GET /api/super-vendors/invoices/:invoice_id
// @access  Admin
exports.getInvoiceById = async (req, res) => {
    try {
    const invoice = await SuperVendorInvoice.findById(req.params.invoice_id)
        .populate('super_vendor')
        .populate('items.bike_model', 'name model price')
        .populate('items.product', 'name price')
        .populate('created_by', 'name email');

    if (!invoice) {
        return res.status(404).json({
            success: false,
            message: 'Invoice not found'
        });
    }

    res.status(200).json({
        success: true,
        data: invoice
    });
    } catch (error) {
        console.error('Error getting invoice:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error getting invoice'
        });
    }
};

// @desc    Update Invoice Status
// @route   PUT /api/super-vendors/invoices/:invoice_id/status
// @access  Admin
exports.updateInvoiceStatus = async (req, res) => {
    try {
    const { status } = req.body;

    const invoice = await SuperVendorInvoice.findById(req.params.invoice_id);

    if (!invoice) {
        return res.status(404).json({
            success: false,
            message: 'Invoice not found'
        });
    }

    invoice.status = status;
    await invoice.save();

    res.status(200).json({
        success: true,
        message: 'Invoice status updated successfully',
        data: invoice
    });
    } catch (error) {
        console.error('Error updating invoice status:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error updating invoice status'
        });
    }
};

// @desc    Delete Transaction
// @route   DELETE /api/super-vendors/transactions/:transaction_id
// @access  Admin
exports.deleteTransaction = async (req, res) => {
    try {
    const transaction = await SuperVendorTransaction.findById(req.params.transaction_id);

    if (!transaction) {
        return res.status(404).json({
            success: false,
            message: 'Transaction not found'
        });
    }

    // If it's a payment, update super vendor amounts
    if (transaction.transaction_type === 'payment') {
        const superVendor = await SuperVendor.findById(transaction.super_vendor);
        if (superVendor) {
            superVendor.total_collected -= transaction.amount;
            superVendor.total_pending = superVendor.total_business - superVendor.total_collected;
            
            if (superVendor.total_business > 0) {
                superVendor.recovery_percentage = ((superVendor.total_collected / superVendor.total_business) * 100).toFixed(2);
            }
            
            await superVendor.save();
        }

        // If related to invoice, update invoice
        if (transaction.related_invoice) {
            const invoice = await SuperVendorInvoice.findById(transaction.related_invoice);
            if (invoice) {
                invoice.paid_amount -= transaction.amount;
                invoice.payments = invoice.payments.filter(
                    p => p.payment_id.toString() !== transaction._id.toString()
                );
                await invoice.save();
            }
        }
    }

    await transaction.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Transaction deleted successfully'
    });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error deleting transaction'
        });
    }
};

// @desc    Get Payment Statistics
// @route   GET /api/super-vendors/:id/payment-stats
// @access  Admin
exports.getPaymentStatistics = async (req, res) => {
    try {
    const superVendor = await SuperVendor.findById(req.params.id);

    if (!superVendor) {
        return res.status(404).json({
            success: false,
            message: 'Super Vendor not found'
        });
    }

    // Get all payments
    const payments = await SuperVendorTransaction.find({
        super_vendor: superVendor._id,
        transaction_type: 'payment'
    });

    // Group by payment method
    const paymentsByMethod = payments.reduce((acc, payment) => {
        const method = payment.payment_method || 'other';
        if (!acc[method]) {
            acc[method] = {
                count: 0,
                total_amount: 0
            };
        }
        acc[method].count++;
        acc[method].total_amount += payment.amount;
        return acc;
    }, {});

    // Get monthly payments (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyPayments = await SuperVendorTransaction.aggregate([
        {
            $match: {
                super_vendor: superVendor._id,
                transaction_type: 'payment',
                transaction_date: { $gte: twelveMonthsAgo }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$transaction_date' },
                    month: { $month: '$transaction_date' }
                },
                total_amount: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { '_id.year': 1, '_id.month': 1 }
        }
    ]);

    res.status(200).json({
        success: true,
        data: {
            total_payments: payments.length,
            total_amount: payments.reduce((sum, p) => sum + p.amount, 0),
            by_payment_method: paymentsByMethod,
            monthly_trends: monthlyPayments,
            super_vendor_summary: {
                company_name: superVendor.company_name,
                total_business: superVendor.total_business,
                total_collected: superVendor.total_collected,
                total_pending: superVendor.total_pending,
                recovery_percentage: superVendor.recovery_percentage
            }
        }
    });
    } catch (error) {
        console.error('Error getting payment statistics:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error getting payment statistics'
        });
    }
};

module.exports = exports;
