const mongoose = require('mongoose');

const superVendorTransactionSchema = new mongoose.Schema({
    super_vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SuperVendor',
        required: true,
        index: true
    },
    transaction_type: {
        type: String,
        enum: ['invoice', 'payment', 'credit_note', 'debit_note', 'adjustment'],
        required: true
    },
    reference_number: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    invoice_number: {
        type: String,
        trim: true
    },
    amount: {
        type: Number,
        required: true
    },
    payment_method: {
        type: String,
        enum: ['cash', 'bank_transfer', 'cheque', 'upi', 'neft_rtgs', 'other'],
        trim: true
    },
    transaction_date: {
        type: Date,
        required: true,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled', 'failed'],
        default: 'completed'
    },
    balance_after: {
        type: Number,
        default: 0
    },
    payment_reference: {
        type: String,
        trim: true
    },
    cheque_number: {
        type: String,
        trim: true
    },
    utr_number: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true
    },
    related_invoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SuperVendorInvoice'
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

superVendorTransactionSchema.index({ super_vendor: 1, transaction_date: -1 });
superVendorTransactionSchema.index({ reference_number: 1 });
superVendorTransactionSchema.index({ status: 1 });

const SuperVendorTransaction = mongoose.model('SuperVendorTransaction', superVendorTransactionSchema);

module.exports = SuperVendorTransaction;
