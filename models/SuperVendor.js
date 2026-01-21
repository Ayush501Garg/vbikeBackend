const mongoose = require('mongoose');

const superVendorSchema = new mongoose.Schema({
    // Basic Information
    super_vendor_id: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    company_name: {
        type: String,
        required: true,
        trim: true
    },
    owner_name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },

    // Location Details with Geo-location
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        trim: true,
        index: true  // Index for state-based queries
    },
    pincode: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],  // [longitude, latitude]
            default: [0, 0]
        }
    },
    coverage_area: {
        type: String,
        trim: true
    },

    // Business Details
    gst_number: {
        type: String,
        trim: true,
        uppercase: true
    },
    pan_number: {
        type: String,
        trim: true,
        uppercase: true
    },
    bank_account: {
        type: String,
        trim: true
    },
    ifsc_code: {
        type: String,
        trim: true,
        uppercase: true
    },
    bank_name: {
        type: String,
        trim: true
    },

    // Sub-Vendors Management
    sub_vendors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor'
    }],
    total_sub_vendors: {
        type: Number,
        default: 0
    },

    // Business Metrics
    direct_business: {
        type: Number,
        default: 0
    },
    direct_bikes_sold: {
        type: Number,
        default: 0
    },
    sub_vendor_business: {
        type: Number,
        default: 0
    },
    sub_vendor_bikes_sold: {
        type: Number,
        default: 0
    },
    total_business: {
        type: Number,
        default: 0
    },
    total_collected: {
        type: Number,
        default: 0
    },
    total_pending: {
        type: Number,
        default: 0
    },
    recovery_percentage: {
        type: Number,
        default: 0
    },

    // Status and Settings
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    is_super_vendor: {
        type: Boolean,
        default: true
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },

    // Additional Information
    notes: {
        type: String,
        trim: true
    },
    documents: [{
        document_type: String,
        document_url: String,
        uploaded_at: {
            type: Date,
            default: Date.now
        }
    }],

    // Timestamps
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Create geospatial index for location-based queries
superVendorSchema.index({ location: '2dsphere' });
superVendorSchema.index({ state: 1, status: 1 });
superVendorSchema.index({ super_vendor_id: 1 });

// Virtual for total network business
superVendorSchema.virtual('total_network_business').get(function() {
    return this.direct_business + this.sub_vendor_business;
});

// Calculate recovery percentage before saving
superVendorSchema.pre('save', function(next) {
    if (this.total_business > 0) {
        this.recovery_percentage = ((this.total_collected / this.total_business) * 100).toFixed(2);
    }
    this.total_business = this.direct_business + this.sub_vendor_business;
    this.total_sub_vendors = this.sub_vendors.length;
    next();
});

// Method to calculate metrics
superVendorSchema.methods.calculateMetrics = async function() {
    const Vendor = mongoose.model('Vendor');
    const subVendors = await Vendor.find({ 
        _id: { $in: this.sub_vendors },
        status: 'active' 
    });
    
    let subVendorBusiness = 0;
    let subVendorBikes = 0;
    
    subVendors.forEach(vendor => {
        subVendorBusiness += vendor.total_business || 0;
        subVendorBikes += vendor.total_bikes_sold || 0;
    });
    
    this.sub_vendor_business = subVendorBusiness;
    this.sub_vendor_bikes_sold = subVendorBikes;
    this.total_business = this.direct_business + this.sub_vendor_business;
    this.total_pending = this.total_business - this.total_collected;
    
    if (this.total_business > 0) {
        this.recovery_percentage = ((this.total_collected / this.total_business) * 100).toFixed(2);
    }
    
    await this.save();
};

// Static method to find super vendor by state
superVendorSchema.statics.findByState = function(state) {
    return this.findOne({ state: state, status: 'active' });
};

// Static method to find nearby super vendors (geo-location based)
superVendorSchema.statics.findNearby = function(longitude, latitude, maxDistance = 50000) {
    return this.find({
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                },
                $maxDistance: maxDistance  // in meters
            }
        },
        status: 'active'
    });
};

const SuperVendor = mongoose.model('SuperVendor', superVendorSchema);

module.exports = SuperVendor;
