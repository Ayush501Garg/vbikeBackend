const mongoose = require('mongoose');

const superVendorInvoiceSchema = new mongoose.Schema({
    invoice_number: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    super_vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SuperVendor',
        required: true,
        index: true
    },
    invoice_date: {
        type: Date,
        required: true,
        default: Date.now
    },
    due_date: {
        type: Date,
        required: true
    },
    
    // Invoice Items
    items: [{
        bike_model: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'BikeModel'
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        description: String,
        quantity: {
            type: Number,
            required: true
        },
        unit_price: {
            type: Number,
            required: true
        },
        discount: {
            type: Number,
            default: 0
        },
        tax_rate: {
            type: Number,
            default: 18  // GST 18%
        },
        tax_amount: {
            type: Number,
            default: 0
        },
        total_amount: {
            type: Number,
            required: true
        }
    }],

    // Amounts
    subtotal: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    tax_amount: {
        type: Number,
        default: 0
    },
    total_amount: {
        type: Number,
        required: true
    },
    paid_amount: {
        type: Number,
        default: 0
    },
    balance_due: {
        type: Number,
        required: true
    },

    // Payment Details
    payments: [{
        payment_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SuperVendorTransaction'
        },
        amount: Number,
        payment_date: Date,
        payment_method: String,
        reference: String
    }],

    // Status
    status: {
        type: String,
        enum: ['draft', 'pending', 'partially_paid', 'paid', 'overdue', 'cancelled'],
        default: 'pending'
    },
    payment_status: {
        type: String,
        enum: ['unpaid', 'partially_paid', 'paid'],
        default: 'unpaid'
    },

    // Additional Fields
    terms_and_conditions: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true
    },
    invoice_pdf_url: {
        type: String,
        trim: true
    },

    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
superVendorInvoiceSchema.index({ super_vendor: 1, invoice_date: -1 });
superVendorInvoiceSchema.index({ invoice_number: 1 });
superVendorInvoiceSchema.index({ status: 1 });
superVendorInvoiceSchema.index({ payment_status: 1 });

// Calculate balance before saving
superVendorInvoiceSchema.pre('save', function(next) {
    this.balance_due = this.total_amount - this.paid_amount;
    
    // Update payment status
    if (this.paid_amount === 0) {
        this.payment_status = 'unpaid';
        this.status = 'pending';
    } else if (this.paid_amount >= this.total_amount) {
        this.payment_status = 'paid';
        this.status = 'paid';
    } else {
        this.payment_status = 'partially_paid';
        this.status = 'partially_paid';
    }
    
    // Check if overdue
    if (this.balance_due > 0 && new Date() > this.due_date) {
        this.status = 'overdue';
    }
    
    next();
});

// Static method to generate invoice number
superVendorInvoiceSchema.statics.generateInvoiceNumber = async function() {
    const year = new Date().getFullYear();
    const lastInvoice = await this.findOne({
        invoice_number: new RegExp(`^INV-SV-${year}`)
    }).sort({ created_at: -1 });
    
    let number = 1;
    if (lastInvoice) {
        const lastNumber = parseInt(lastInvoice.invoice_number.split('-').pop());
        number = lastNumber + 1;
    }
    
    return `INV-SV-${year}-${String(number).padStart(4, '0')}`;
};

const SuperVendorInvoice = mongoose.model('SuperVendorInvoice', superVendorInvoiceSchema);

module.exports = SuperVendorInvoice;
