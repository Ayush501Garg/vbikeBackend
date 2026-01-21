const Product = require('../models/product');
const Vendor = require('../models/vendor');
const SuperVendor = require('../models/SuperVendor');

// ========================================
// PRODUCT MANAGEMENT (Super Admin Only)
// ========================================

// @desc    Get main inventory (Super Admin's stock)
// @route   GET /api/super-admin/inventory
// @access  Super Admin
exports.getMainInventory = async (req, res) => {
    try {
        const products = await Product.find({ is_active: true })
            .select('name model base_price price stock_quantity category_id')
            .sort('-createdAt');

        const totalStock = products.reduce((sum, p) => sum + p.stock_quantity, 0);
        const totalValue = products.reduce((sum, p) => sum + (p.base_price * p.stock_quantity), 0);

        res.status(200).json({
            success: true,
            count: products.length,
            total_stock: totalStock,
            total_value: totalValue,
            data: products
        });
    } catch (error) {
        console.error('Error fetching main inventory:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error fetching inventory'
        });
    }
};

// @desc    Add stock to main inventory (Super Admin receives stock from warehouse)
// @route   POST /api/super-admin/inventory/add-stock
// @access  Super Admin
exports.addStockToMainInventory = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const qty = Number(quantity);

        if (!productId || !qty || qty <= 0) {
            return res.status(400).json({
                success: false,
                message: 'productId and positive quantity are required'
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        product.stock_quantity += qty;
        await product.save();

        res.status(200).json({
            success: true,
            message: `Added ${qty} units to main inventory`,
            data: {
                product: product.name,
                new_stock: product.stock_quantity
            }
        });
    } catch (error) {
        console.error('Error adding stock:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error adding stock'
        });
    }
};

// @desc    Allocate inventory from Super Admin to Super Vendor
// @route   POST /api/super-admin/allocate/super-vendor
// @access  Super Admin
exports.allocateToSuperVendor = async (req, res) => {
    try {
        const { superVendorId, productId, quantity, discount_percentage, markup_percentage } = req.body;
        const qty = Number(quantity);

        if (!superVendorId || !productId || !qty || qty <= 0) {
            return res.status(400).json({
                success: false,
                message: 'superVendorId, productId and positive quantity are required'
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (qty > product.stock_quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${product.stock_quantity} units available in main inventory`
            });
        }

        const superVendor = await SuperVendor.findById(superVendorId);
        if (!superVendor) {
            return res.status(404).json({ success: false, message: 'Super Vendor not found' });
        }

        // Deduct from main inventory
        product.stock_quantity -= qty;
        await product.save();

        // Add to super vendor inventory
        const existing = superVendor.inventory.find(item => item.product?.toString() === productId);
        if (existing) {
            existing.assigned_stock += qty;
            existing.available_stock += qty;
            if (discount_percentage !== undefined) existing.discount_percentage = discount_percentage;
            if (markup_percentage !== undefined) existing.markup_percentage = markup_percentage;
        } else {
            superVendor.inventory.push({
                product: productId,
                assigned_stock: qty,
                sold_stock: 0,
                available_stock: qty,
                discount_percentage: discount_percentage || 0,
                markup_percentage: markup_percentage || 0
            });
        }

        await superVendor.save();
        await superVendor.populate({ path: 'inventory.product', select: 'name model base_price' });

        res.status(200).json({
            success: true,
            message: `Allocated ${qty} units to Super Vendor successfully`,
            remaining_main_stock: product.stock_quantity,
            super_vendor_inventory: superVendor.inventory
        });
    } catch (error) {
        console.error('Error allocating to super vendor:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error allocating inventory'
        });
    }
};

// @desc    Allocate inventory from Super Admin directly to Sub Vendor
// @route   POST /api/super-admin/allocate/sub-vendor
// @access  Super Admin
exports.allocateToSubVendor = async (req, res) => {
    try {
        const { vendorId, productId, quantity, min_price, max_price, custom_price } = req.body;
        const qty = Number(quantity);

        if (!vendorId || !productId || !qty || qty <= 0) {
            return res.status(400).json({
                success: false,
                message: 'vendorId, productId and positive quantity are required'
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (qty > product.stock_quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${product.stock_quantity} units available in main inventory`
            });
        }

        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }

        // Deduct from main inventory
        product.stock_quantity -= qty;
        await product.save();

        // Add to sub vendor inventory
        const existing = vendor.inventory.find(item => item.product?.toString() === productId);
        if (existing) {
            existing.assigned_stock += qty;
            existing.available_stock += qty;
            if (min_price !== undefined) existing.min_price = min_price;
            if (max_price !== undefined) existing.max_price = max_price;
            if (custom_price !== undefined) existing.custom_price = custom_price;
        } else {
            vendor.inventory.push({
                product: productId,
                assigned_stock: qty,
                sold_stock: 0,
                available_stock: qty,
                min_price: min_price || product.base_price * 0.9,
                max_price: max_price || product.base_price * 1.1,
                custom_price: custom_price
            });
        }

        vendor.vendor_type = 'direct'; // Mark as directly managed by Super Admin
        vendor.super_vendor = null; // No super vendor

        await vendor.save();
        await vendor.populate({ path: 'inventory.product', select: 'name model base_price' });

        res.status(200).json({
            success: true,
            message: `Allocated ${qty} units to Sub Vendor directly`,
            remaining_main_stock: product.stock_quantity,
            sub_vendor_inventory: vendor.inventory
        });
    } catch (error) {
        console.error('Error allocating to sub vendor:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error allocating inventory'
        });
    }
};

// @desc    Super Admin sells product directly (deduct from main inventory)
// @route   POST /api/super-admin/sell
// @access  Super Admin
exports.sellProduct = async (req, res) => {
    try {
        const { productId, quantity, selling_price, customer_details } = req.body;
        const qty = Number(quantity);

        if (!productId || !qty || qty <= 0) {
            return res.status(400).json({
                success: false,
                message: 'productId and positive quantity are required'
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (qty > product.stock_quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${product.stock_quantity} units available`
            });
        }

        // Deduct from main inventory
        product.stock_quantity -= qty;
        await product.save();

        // Here you can create an order record if needed
        const saleAmount = (selling_price || product.price) * qty;

        res.status(200).json({
            success: true,
            message: `Sale completed successfully`,
            sale_details: {
                product: product.name,
                quantity: qty,
                price_per_unit: selling_price || product.price,
                total_amount: saleAmount,
                remaining_stock: product.stock_quantity,
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

// @desc    Get all vendors (Super Vendors + Sub Vendors) with inventory, sales, reports
// @route   GET /api/super-admin/vendors/all
// @access  Super Admin
exports.getAllVendorsReport = async (req, res) => {
    try {
        const superVendors = await SuperVendor.find()
            .populate({ path: 'inventory.product', select: 'name model base_price' })
            .populate({ path: 'sub_vendors', select: 'name city state total_business total_bikes_sold' });

        const subVendors = await Vendor.find()
            .populate({ path: 'inventory.product', select: 'name model base_price' })
            .populate({ path: 'super_vendor', select: 'company_name state' });

        res.status(200).json({
            success: true,
            super_vendors: {
                count: superVendors.length,
                data: superVendors
            },
            sub_vendors: {
                count: subVendors.length,
                data: subVendors
            }
        });
    } catch (error) {
        console.error('Error fetching vendors report:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error fetching report'
        });
    }
};

// @desc    Get detailed inventory report across all levels
// @route   GET /api/super-admin/reports/inventory
// @access  Super Admin
exports.getInventoryReport = async (req, res) => {
    try {
        const products = await Product.find({ is_active: true });

        const report = [];
        for (const product of products) {
            const superVendorStock = await SuperVendor.aggregate([
                { $unwind: '$inventory' },
                { $match: { 'inventory.product': product._id } },
                {
                    $group: {
                        _id: null,
                        total_assigned: { $sum: '$inventory.assigned_stock' },
                        total_available: { $sum: '$inventory.available_stock' },
                        total_sold: { $sum: '$inventory.sold_stock' }
                    }
                }
            ]);

            const subVendorStock = await Vendor.aggregate([
                { $unwind: '$inventory' },
                { $match: { 'inventory.product': product._id } },
                {
                    $group: {
                        _id: null,
                        total_assigned: { $sum: '$inventory.assigned_stock' },
                        total_available: { $sum: '$inventory.available_stock' },
                        total_sold: { $sum: '$inventory.sold_stock' }
                    }
                }
            ]);

            report.push({
                product: {
                    id: product._id,
                    name: product.name,
                    model: product.model,
                    base_price: product.base_price
                },
                main_inventory: product.stock_quantity,
                super_vendor_stock: superVendorStock[0] || { total_assigned: 0, total_available: 0, total_sold: 0 },
                sub_vendor_stock: subVendorStock[0] || { total_assigned: 0, total_available: 0, total_sold: 0 }
            });
        }

        res.status(200).json({
            success: true,
            count: report.length,
            data: report
        });
    } catch (error) {
        console.error('Error generating inventory report:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error generating report'
        });
    }
};

// @desc    Update product base price (Super Admin only)
// @route   PUT /api/super-admin/products/:id/base-price
// @access  Super Admin
exports.updateProductBasePrice = async (req, res) => {
    try {
        const { base_price } = req.body;

        if (!base_price || base_price <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid base_price is required'
            });
        }

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        product.base_price = base_price;
        product.price = base_price; // Update current price to match base
        await product.save();

        res.status(200).json({
            success: true,
            message: 'Base price updated successfully',
            data: {
                product: product.name,
                old_price: product.price,
                new_base_price: base_price
            }
        });
    } catch (error) {
        console.error('Error updating base price:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error updating price'
        });
    }
};
