const SuperVendor = require('../models/SuperVendor');
const Vendor = require('../models/vendor');
const SuperVendorTransaction = require('../models/SuperVendorTransaction');
const SuperVendorInvoice = require('../models/SuperVendorInvoice');
const Product = require('../models/product');

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

// @desc    Assign inventory from company warehouse to Super Vendor
// @route   POST /api/super-vendors/:id/inventory/assign
// @access  Admin / Super Admin
exports.assignInventoryToSuperVendor = async (req, res) => {
    try {
        const { productId, quantity, discount_percentage } = req.body;
        const qty = Number(quantity);
        const discount = Math.max(0, Math.min(100, Number(discount_percentage) || 0)); // 0-100%

        if (!productId || !qty || qty <= 0) {
            return res.status(400).json({
                success: false,
                message: 'productId and positive quantity are required'
            });
        }

        const superVendor = await SuperVendor.findById(req.params.id);
        if (!superVendor) {
            return res.status(404).json({ success: false, message: 'Super Vendor not found' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (qty > product.stock_quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${product.stock_quantity} units available in warehouse`
            });
        }

        // Decrement warehouse stock without triggering full product validation
        await Product.updateOne(
            { _id: productId },
            { $inc: { stock_quantity: -qty } },
            { runValidators: false }
        );

        // Calculate pricing with discount
        const basePrice = product.base_price || product.price || 0;
        const finalPrice = basePrice * (1 - discount / 100);

        const existing = superVendor.inventory.find(item => item.product?.toString() === productId);
        if (existing) {
            existing.assigned_stock += qty;
            existing.available_stock += qty;
            existing.discount_percentage = discount;
            existing.custom_price = finalPrice;
        } else {
            superVendor.inventory.push({
                product: productId,
                assigned_stock: qty,
                sold_stock: 0,
                available_stock: qty,
                discount_percentage: discount,
                custom_price: finalPrice
            });
        }

        await superVendor.save();

        await superVendor.populate({
            path: 'inventory.product',
            select: 'name model price base_price stock_quantity'
        });

        res.status(200).json({
            success: true,
            message: 'Stock assigned to super vendor successfully',
            pricing_summary: {
                base_price: basePrice,
                discount_percentage: discount,
                final_price: finalPrice,
                quantity: qty,
                total_value: finalPrice * qty
            },
            data: superVendor.inventory
        });
    } catch (error) {
        console.error('Error assigning inventory to super vendor:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error assigning inventory'
        });
    }
};

// @desc    Get Super Vendor inventory
// @route   GET /api/super-vendors/:id/inventory
// @access  Admin / Super Admin
exports.getSuperVendorInventory = async (req, res) => {
    try {
        const superVendor = await SuperVendor.findById(req.params.id)
            .populate({ path: 'inventory.product', select: 'name model price stock_quantity' });

        if (!superVendor) {
            return res.status(404).json({ success: false, message: 'Super Vendor not found' });
        }

        res.status(200).json({
            success: true,
            count: superVendor.inventory.length,
            data: superVendor.inventory
        });
    } catch (error) {
        console.error('Error fetching super vendor inventory:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error fetching inventory'
        });
    }
};

// @desc    Transfer inventory from Super Vendor to a Sub Vendor
// @route   POST /api/super-vendors/:id/sub-vendors/:vendorId/inventory
// @access  Super Vendor / Admin
exports.transferInventoryToSubVendor = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const qty = Number(quantity);

        if (!productId || !qty || qty <= 0) {
            return res.status(400).json({
                success: false,
                message: 'productId and positive quantity are required'
            });
        }

        const superVendor = await SuperVendor.findById(req.params.id);
        if (!superVendor) {
            return res.status(404).json({ success: false, message: 'Super Vendor not found' });
        }

        const subVendor = await Vendor.findById(req.params.vendorId);
        if (!subVendor) {
            return res.status(404).json({ success: false, message: 'Sub Vendor not found' });
        }

        // Ensure vendor is under this super vendor
        if (!subVendor.super_vendor || subVendor.super_vendor.toString() !== superVendor._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Vendor is not assigned to this Super Vendor'
            });
        }

        const inventoryItem = superVendor.inventory.find(item => item.product?.toString() === productId);
        if (!inventoryItem) {
            return res.status(404).json({ success: false, message: 'Product not found in super vendor inventory' });
        }

        if (inventoryItem.available_stock < qty) {
            return res.status(400).json({
                success: false,
                message: `Only ${inventoryItem.available_stock} units available with super vendor`
            });
        }

        // Deduct from super vendor inventory
        inventoryItem.available_stock -= qty;
        inventoryItem.sold_stock += qty; // treat as transferred

        // Add to sub vendor inventory
        const vendorItem = subVendor.inventory.find(i => i.product?.toString() === productId);
        if (vendorItem) {
            vendorItem.assigned_stock += qty;
            vendorItem.available_stock += qty;
        } else {
            subVendor.inventory.push({
                product: productId,
                assigned_stock: qty,
                sold_stock: 0,
                available_stock: qty
            });
        }

        subVendor.vendor_type = 'sub_vendor';
        subVendor.super_vendor = superVendor._id;

        await superVendor.save();
        await subVendor.save();

        await superVendor.populate({ path: 'inventory.product', select: 'name model price' });
        await subVendor.populate({ path: 'inventory.product', select: 'name model price' });

        res.status(200).json({
            success: true,
            message: 'Inventory transferred to sub vendor successfully',
            super_vendor_inventory: superVendor.inventory,
            sub_vendor_inventory: subVendor.inventory
        });
    } catch (error) {
        console.error('Error transferring inventory to sub vendor:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error transferring inventory'
        });
    }
};

// @desc    Get inventory for a specific sub vendor under a super vendor
// @route   GET /api/super-vendors/:id/sub-vendors/:vendorId/inventory
// @access  Super Vendor / Admin
exports.getSubVendorInventory = async (req, res) => {
    try {
        const superVendor = await SuperVendor.findById(req.params.id);
        if (!superVendor) {
            return res.status(404).json({ success: false, message: 'Super Vendor not found' });
        }

        const subVendor = await Vendor.findById(req.params.vendorId)
            .populate({ path: 'inventory.product', select: 'name model price' });

        if (!subVendor) {
            return res.status(404).json({ success: false, message: 'Sub Vendor not found' });
        }

        if (!subVendor.super_vendor || subVendor.super_vendor.toString() !== superVendor._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Vendor is not assigned to this Super Vendor'
            });
        }

        res.status(200).json({
            success: true,
            count: subVendor.inventory.length,
            data: subVendor.inventory
        });
    } catch (error) {
        console.error('Error getting sub vendor inventory:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error getting sub vendor inventory'
        });
    }
};
// @desc    Super Vendor creates a new Sub Vendor under them
// @route   POST /api/super-vendors/:id/create-sub-vendor
// @access  Super Vendor / Admin
exports.createSubVendor = async (req, res) => {
    try {
        const { name, email, phone, address_line, city, state, postal_code, lat, lng } = req.body;

        const superVendor = await SuperVendor.findById(req.params.id);
        if (!superVendor) {
            return res.status(404).json({ success: false, message: 'Super Vendor not found' });
        }

        // Create new sub vendor
        const subVendor = await Vendor.create({
            name,
            email,
            phone,
            address_line,
            city,
            state,
            postal_code,
            location: { lat, lng },
            super_vendor: superVendor._id,
            vendor_type: 'sub_vendor',
            status: 'active',
            // Inherit default pricing rules from super vendor
            pricing_rules: {
                discount_percentage: superVendor.default_pricing_rules?.discount_percentage || 0,
                markup_percentage: superVendor.default_pricing_rules?.markup_percentage || 0,
                can_set_custom_price: superVendor.default_pricing_rules?.can_set_custom_price || false
            }
        });

        // Add to super vendor's sub_vendors array
        superVendor.sub_vendors.push(subVendor._id);
        superVendor.total_sub_vendors = superVendor.sub_vendors.length;
        await superVendor.save();

        res.status(201).json({
            success: true,
            message: 'Sub Vendor created successfully',
            data: subVendor
        });
    } catch (error) {
        console.error('Error creating sub vendor:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error creating sub vendor'
        });
    }
};

// @desc    Super Vendor sets pricing for a product
// @route   PUT /api/super-vendors/:id/inventory/:productId/pricing
// @access  Super Vendor / Admin
exports.setProductPricing = async (req, res) => {
    try {
        const { discount_percentage, markup_percentage, custom_price } = req.body;

        const superVendor = await SuperVendor.findById(req.params.id);
        if (!superVendor) {
            return res.status(404).json({ success: false, message: 'Super Vendor not found' });
        }

        const inventoryItem = superVendor.inventory.find(
            item => item.product?.toString() === req.params.productId
        );

        if (!inventoryItem) {
            return res.status(404).json({
                success: false,
                message: 'Product not found in super vendor inventory'
            });
        }

        // Update pricing
        if (discount_percentage !== undefined) {
            inventoryItem.discount_percentage = discount_percentage;
        }
        if (markup_percentage !== undefined) {
            inventoryItem.markup_percentage = markup_percentage;
        }
        if (custom_price !== undefined) {
            inventoryItem.custom_price = custom_price;
        }

        await superVendor.save();
        await superVendor.populate({ path: 'inventory.product', select: 'name model base_price' });

        res.status(200).json({
            success: true,
            message: 'Pricing updated successfully',
            data: inventoryItem
        });
    } catch (error) {
        console.error('Error setting product pricing:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error setting pricing'
        });
    }
};

// @desc    Super Vendor sells product directly
// @route   POST /api/super-vendors/:id/sell
// @access  Super Vendor / Admin
exports.sellProductBySuperVendor = async (req, res) => {
    try {
        const { productId, quantity, selling_price, customer_details } = req.body;
        const qty = Number(quantity);

        if (!productId || !qty || qty <= 0) {
            return res.status(400).json({
                success: false,
                message: 'productId and positive quantity are required'
            });
        }

        const superVendor = await SuperVendor.findById(req.params.id);
        if (!superVendor) {
            return res.status(404).json({ success: false, message: 'Super Vendor not found' });
        }

        const inventoryItem = superVendor.inventory.find(
            item => item.product?.toString() === productId
        );

        if (!inventoryItem) {
            return res.status(404).json({
                success: false,
                message: 'Product not found in inventory'
            });
        }

        if (inventoryItem.available_stock < qty) {
            return res.status(400).json({
                success: false,
                message: `Only ${inventoryItem.available_stock} units available`
            });
        }

        // Deduct from super vendor inventory
        inventoryItem.available_stock -= qty;
        inventoryItem.sold_stock += qty;

        // Update business metrics
        const product = await Product.findById(productId);
        const saleAmount = (selling_price || product.price) * qty;
        
        superVendor.direct_business += saleAmount;
        superVendor.direct_bikes_sold += qty;
        superVendor.total_business = superVendor.direct_business + superVendor.sub_vendor_business;

        await superVendor.save();

        res.status(200).json({
            success: true,
            message: 'Sale completed successfully',
            sale_details: {
                product: product.name,
                quantity: qty,
                price_per_unit: selling_price || product.price,
                total_amount: saleAmount,
                remaining_stock: inventoryItem.available_stock,
                customer: customer_details
            }
        });
    } catch (error) {
        console.error('Error selling product:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error processing sale'
        });
    }
};

// @desc    Update default pricing rules for sub vendors
// @route   PUT /api/super-vendors/:id/pricing-rules
// @access  Super Vendor / Admin
exports.updatePricingRules = async (req, res) => {
    try {
        const {
            discount_percentage,
            markup_percentage,
            can_set_custom_price,
            min_margin_percentage,
            max_discount_percentage
        } = req.body;

        const superVendor = await SuperVendor.findById(req.params.id);
        if (!superVendor) {
            return res.status(404).json({ success: false, message: 'Super Vendor not found' });
        }

        // Update default pricing rules
        if (discount_percentage !== undefined) {
            superVendor.default_pricing_rules.discount_percentage = discount_percentage;
        }
        if (markup_percentage !== undefined) {
            superVendor.default_pricing_rules.markup_percentage = markup_percentage;
        }
        if (can_set_custom_price !== undefined) {
            superVendor.default_pricing_rules.can_set_custom_price = can_set_custom_price;
        }
        if (min_margin_percentage !== undefined) {
            superVendor.default_pricing_rules.min_margin_percentage = min_margin_percentage;
        }
        if (max_discount_percentage !== undefined) {
            superVendor.default_pricing_rules.max_discount_percentage = max_discount_percentage;
        }

        await superVendor.save();

        res.status(200).json({
            success: true,
            message: 'Pricing rules updated successfully',
            data: superVendor.default_pricing_rules
        });
    } catch (error) {
        console.error('Error updating pricing rules:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error updating pricing rules'
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
