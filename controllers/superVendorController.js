const SuperVendor = require('../models/SuperVendor');
const Vendor = require('../models/vendor');
const SuperVendorTransaction = require('../models/SuperVendorTransaction');
const SuperVendorInvoice = require('../models/SuperVendorInvoice');

// @desc    Create new Super Vendor
// @route   POST /api/super-vendors
// @access  Admin
exports.createSuperVendor = async (req, res) => {
    try {
    const {
        super_vendor_id,
        company_name,
        owner_name,
        phone,
        email,
        address,
        city,
        state,
        pincode,
        gst_number,
        pan_number,
        bank_account,
        ifsc_code,
        bank_name,
        coverage_area,
        status,
        notes,
        sub_vendors,
        longitude,
        latitude
    } = req.body;

    // Check if super vendor already exists for this state
    const existingStateVendor = await SuperVendor.findOne({ 
        state: state, 
        status: 'active',
        _id: { $ne: req.params.id } // Exclude current super vendor if updating
    });

    if (existingStateVendor) {
        return res.status(400).json({
            success: false,
            message: `Super Vendor already exists for ${state} state: ${existingStateVendor.company_name}`
        });
    }

    // Check if email already exists
    const existingEmail = await SuperVendor.findOne({ email });
    if (existingEmail) {
        return res.status(400).json({
            success: false,
            message: 'Email already exists'
        });
    }

    // Create super vendor
    const superVendor = await SuperVendor.create({
        super_vendor_id,
        company_name,
        owner_name,
        phone,
        email,
        address,
        city,
        state,
        pincode,
        gst_number,
        pan_number,
        bank_account,
        ifsc_code,
        bank_name,
        coverage_area,
        status: status || 'active',
        notes,
        sub_vendors: sub_vendors || [],
        location: {
            type: 'Point',
            coordinates: [parseFloat(longitude) || 0, parseFloat(latitude) || 0]
        },
        created_by: req.user?._id
    });

    // If sub-vendors are assigned, update them
    if (sub_vendors && sub_vendors.length > 0) {
        await Vendor.updateMany(
            { _id: { $in: sub_vendors } },
            { 
                super_vendor: superVendor._id,
                vendor_type: 'sub_vendor',
                state: state  // Ensure sub-vendors are in same state
            }
        );
    }

    res.status(201).json({
        success: true,
        message: 'Super Vendor created successfully',
        data: superVendor
    });
    } catch (error) {
        console.error('Error creating super vendor:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error creating super vendor'
        });
    }
};

// @desc    Get all Super Vendors
// @route   GET /api/super-vendors
// @access  Admin
exports.getAllSuperVendors = async (req, res) => {
    try {
    const { state, status, search } = req.query;

    let query = {};

    if (state) {
        query.state = state;
    }

    if (status) {
        query.status = status;
    }

    if (search) {
        query.$or = [
            { company_name: { $regex: search, $options: 'i' } },
            { owner_name: { $regex: search, $options: 'i' } },
            { super_vendor_id: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }

    const superVendors = await SuperVendor.find(query)
        .populate('sub_vendors', 'name email phone city state total_business total_bikes_sold pending_amount status')
        .sort({ created_at: -1 });

    // Calculate summary metrics
    const summary = {
        total_super_vendors: superVendors.length,
        total_sub_vendors: superVendors.reduce((sum, sv) => sum + sv.total_sub_vendors, 0),
        total_business: superVendors.reduce((sum, sv) => sum + sv.total_business, 0),
        total_collected: superVendors.reduce((sum, sv) => sum + sv.total_collected, 0),
        total_pending: superVendors.reduce((sum, sv) => sum + sv.total_pending, 0),
        avg_recovery: superVendors.length > 0 
            ? (superVendors.reduce((sum, sv) => sum + parseFloat(sv.recovery_percentage), 0) / superVendors.length).toFixed(2)
            : 0
    };

    res.status(200).json({
        success: true,
        count: superVendors.length,
        summary,
        data: superVendors
    });
    } catch (error) {
        console.error('Error getting super vendors:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error getting super vendors'
        });
    }
};

// @desc    Get Super Vendor by ID
// @route   GET /api/super-vendors/:id
// @access  Admin
exports.getSuperVendorById = async (req, res) => {
    try {
    const superVendor = await SuperVendor.findById(req.params.id)
        .populate({
            path: 'sub_vendors',
            select: 'name email phone address_line city state postal_code total_business total_bikes_sold pending_amount status rating',
            populate: {
                path: 'inventory.product',
                select: 'name model price'
            }
        })
        .populate('created_by', 'name email')
        .populate('updated_by', 'name email');

    if (!superVendor) {
        return res.status(404).json({
            success: false,
            message: 'Super Vendor not found'
        });
    }

    res.status(200).json({
        success: true,
        data: superVendor
    });
    } catch (error) {
        console.error('Error getting super vendor:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error getting super vendor'
        });
    }
};

// @desc    Update Super Vendor
// @route   PUT /api/super-vendors/:id
// @access  Admin
exports.updateSuperVendor = async (req, res) => {
    try {
    let superVendor = await SuperVendor.findById(req.params.id);

    if (!superVendor) {
        return res.status(404).json({
            success: false,
            message: 'Super Vendor not found'
        });
    }

    // Check if state is being changed and if another super vendor exists for new state
    if (req.body.state && req.body.state !== superVendor.state) {
        const existingStateVendor = await SuperVendor.findOne({ 
            state: req.body.state, 
            status: 'active',
            _id: { $ne: req.params.id }
        });

        if (existingStateVendor) {
            return res.status(400).json({
                success: false,
                message: `Super Vendor already exists for ${req.body.state} state`
            });
        }
    }

    // Update location if longitude and latitude are provided
    if (req.body.longitude && req.body.latitude) {
        req.body.location = {
            type: 'Point',
            coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
        };
    }

    req.body.updated_by = req.user?._id;

    superVendor = await SuperVendor.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true
        }
    ).populate('sub_vendors');

    res.status(200).json({
        success: true,
        message: 'Super Vendor updated successfully',
        data: superVendor
    });
    } catch (error) {
        console.error('Error updating super vendor:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error updating super vendor'
        });
    }
};

// @desc    Delete Super Vendor
// @route   DELETE /api/super-vendors/:id
// @access  Admin
exports.deleteSuperVendor = async (req, res) => {
    try {
    const superVendor = await SuperVendor.findById(req.params.id);

    if (!superVendor) {
        return res.status(404).json({
            success: false,
            message: 'Super Vendor not found'
        });
    }

    // Update all sub-vendors to direct vendors
    await Vendor.updateMany(
        { super_vendor: superVendor._id },
        { 
            $unset: { super_vendor: "" },
            vendor_type: 'direct'
        }
    );

    await superVendor.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Super Vendor deleted successfully and all sub-vendors converted to direct vendors'
    });
    } catch (error) {
        console.error('Error deleting super vendor:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error deleting super vendor'
        });
    }
};

// @desc    Assign Sub-Vendors to Super Vendor
// @route   POST /api/super-vendors/:id/assign-vendors
// @access  Admin
exports.assignSubVendors = async (req, res) => {
    try {
    const { vendor_ids } = req.body;

    const superVendor = await SuperVendor.findById(req.params.id);

    if (!superVendor) {
        return res.status(404).json({
            success: false,
            message: 'Super Vendor not found'
        });
    }

    // Get vendors and check if they are in same state
    const vendors = await Vendor.find({ _id: { $in: vendor_ids } });
    
    const invalidVendors = vendors.filter(v => v.state !== superVendor.state);
    if (invalidVendors.length > 0) {
        return res.status(400).json({
            success: false,
            message: `Vendors must be in same state (${superVendor.state})`,
            invalid_vendors: invalidVendors.map(v => ({ id: v._id, name: v.name, state: v.state }))
        });
    }

    // Update vendors
    await Vendor.updateMany(
        { _id: { $in: vendor_ids } },
        { 
            super_vendor: superVendor._id,
            vendor_type: 'sub_vendor'
        }
    );

    // Add to super vendor's sub_vendors array (avoid duplicates)
    superVendor.sub_vendors = [...new Set([...superVendor.sub_vendors, ...vendor_ids])];
    await superVendor.save();

    // Recalculate metrics
    await superVendor.calculateMetrics();

    res.status(200).json({
        success: true,
        message: `${vendor_ids.length} vendors assigned successfully`,
        data: superVendor
    });
    } catch (error) {
        console.error('Error assigning sub vendors:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error assigning sub vendors'
        });
    }
};

// @desc    Remove Sub-Vendor from Super Vendor
// @route   POST /api/super-vendors/:id/remove-vendor
// @access  Admin
exports.removeSubVendor = async (req, res) => {
    try {
    const { vendor_id } = req.body;

    const superVendor = await SuperVendor.findById(req.params.id);

    if (!superVendor) {
        return res.status(404).json({
            success: false,
            message: 'Super Vendor not found'
        });
    }

    // Update vendor to direct
    await Vendor.findByIdAndUpdate(vendor_id, {
        $unset: { super_vendor: "" },
        vendor_type: 'direct'
    });

    // Remove from super vendor's array
    superVendor.sub_vendors = superVendor.sub_vendors.filter(
        v => v.toString() !== vendor_id
    );
    await superVendor.save();

    // Recalculate metrics
    await superVendor.calculateMetrics();

    res.status(200).json({
        success: true,
        message: 'Vendor removed successfully',
        data: superVendor
    });
    } catch (error) {
        console.error('Error removing sub vendor:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error removing sub vendor'
        });
    }
};

// @desc    Get Super Vendor by State
// @route   GET /api/super-vendors/state/:state
// @access  Admin
exports.getSuperVendorByState = async (req, res) => {
    try {
    const superVendor = await SuperVendor.findByState(req.params.state);

    if (!superVendor) {
        return res.status(404).json({
            success: false,
            message: `No Super Vendor found for ${req.params.state} state`
        });
    }

    await superVendor.populate('sub_vendors');

    res.status(200).json({
        success: true,
        data: superVendor
    });
    } catch (error) {
        console.error('Error getting super vendor by state:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error getting super vendor by state'
        });
    }
};

// @desc    Find Nearby Super Vendors (Geo-location based)
// @route   GET /api/super-vendors/nearby
// @access  Admin
exports.findNearbySuperVendors = async (req, res) => {
    try {
    const { longitude, latitude, maxDistance } = req.query;

    if (!longitude || !latitude) {
        return res.status(400).json({
            success: false,
            message: 'Please provide longitude and latitude'
        });
    }

    const superVendors = await SuperVendor.findNearby(
        parseFloat(longitude),
        parseFloat(latitude),
        parseInt(maxDistance) || 50000  // Default 50km
    ).populate('sub_vendors');

    res.status(200).json({
        success: true,
        count: superVendors.length,
        data: superVendors
    });
    } catch (error) {
        console.error('Error finding nearby super vendors:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error finding nearby super vendors'
        });
    }
};

// @desc    Get Super Vendor Dashboard Stats
// @route   GET /api/super-vendors/:id/dashboard
// @access  Admin
exports.getSuperVendorDashboard = async (req, res) => {
    try {
    const superVendor = await SuperVendor.findById(req.params.id)
        .populate('sub_vendors', 'name total_business pending_amount status');

    if (!superVendor) {
        return res.status(404).json({
            success: false,
            message: 'Super Vendor not found'
        });
    }

    // Get recent transactions
    const recentTransactions = await SuperVendorTransaction.find({ 
        super_vendor: superVendor._id 
    })
        .sort({ transaction_date: -1 })
        .limit(10);

    // Get pending invoices
    const pendingInvoices = await SuperVendorInvoice.find({
        super_vendor: superVendor._id,
        status: { $in: ['pending', 'partially_paid', 'overdue'] }
    }).sort({ invoice_date: -1 });

    const dashboard = {
        super_vendor: superVendor,
        metrics: {
            total_sub_vendors: superVendor.total_sub_vendors,
            direct_business: superVendor.direct_business,
            sub_vendor_business: superVendor.sub_vendor_business,
            total_business: superVendor.total_business,
            total_collected: superVendor.total_collected,
            total_pending: superVendor.total_pending,
            recovery_percentage: superVendor.recovery_percentage
        },
        recent_transactions: recentTransactions,
        pending_invoices: pendingInvoices,
        sub_vendors_summary: superVendor.sub_vendors
    };

    res.status(200).json({
        success: true,
        data: dashboard
    });
    } catch (error) {
        console.error('Error getting super vendor dashboard:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error getting super vendor dashboard'
        });
    }
};

module.exports = exports;
