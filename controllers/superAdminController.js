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

        const newStock = product.stock_quantity + qty;
        // Avoid full validation on legacy products missing base_price
        await Product.updateOne(
            { _id: productId },
            { $inc: { stock_quantity: qty } },
            { runValidators: false }
        );

        res.status(200).json({
            success: true,
            message: `Added ${qty} units to main inventory`,
            data: {
                product: product.name,
                new_stock: newStock
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

        // Deduct from main inventory without triggering product validation
        const remainingStock = product.stock_quantity - qty;
        await Product.updateOne(
            { _id: productId },
            { $inc: { stock_quantity: -qty } },
            { runValidators: false }
        );

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
            remaining_main_stock: remainingStock,
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

        const basePrice = product.base_price || product.price || 0;

        // Deduct from main inventory without triggering product validation
        const remainingStock = product.stock_quantity - qty;
        await Product.updateOne(
            { _id: productId },
            { $inc: { stock_quantity: -qty } },
            { runValidators: false }
        );

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
                min_price: min_price ?? basePrice * 0.9,
                max_price: max_price ?? basePrice * 1.1,
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
            remaining_main_stock: remainingStock,
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

        // Deduct from main inventory without triggering product validation
        const remainingStock = product.stock_quantity - qty;
        await Product.updateOne(
            { _id: productId },
            { $inc: { stock_quantity: -qty } },
            { runValidators: false }
        );

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
                remaining_stock: remainingStock,
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

// ========================================
// SUB VENDOR MANAGEMENT (Super Admin)
// ========================================

// @desc    Get all sub vendors with detailed info
// @route   GET /api/super-admin/sub-vendors
// @access  Super Admin
exports.getAllSubVendors = async (req, res) => {
    try {
        const { status, state, search } = req.query;
        let query = { vendor_type: 'sub_vendor' };

        if (status) query.status = status;
        if (state) query.state = state;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        const subVendors = await Vendor.find(query)
            .populate('super_vendor', 'company_name state')
            .populate({ path: 'inventory.product', select: 'name model base_price' })
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: subVendors.length,
            data: subVendors
        });
    } catch (error) {
        console.error('Error fetching sub vendors:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error fetching sub vendors'
        });
    }
};

// @desc    Get detailed sub vendor info with ledger and sales
// @route   GET /api/super-admin/sub-vendors/:id
// @access  Super Admin
exports.getSubVendorDetails = async (req, res) => {
    try {
        const subVendor = await Vendor.findById(req.params.id)
            .populate('super_vendor', 'company_name state')
            .populate({ path: 'inventory.product', select: 'name model base_price price' });

        if (!subVendor) {
            return res.status(404).json({ success: false, message: 'Sub Vendor not found' });
        }

        // Calculate inventory value and metrics
        let inventoryValue = 0;
        let totalAssignedStock = 0;
        let totalAvailableStock = 0;
        let totalSoldStock = 0;

        subVendor.inventory.forEach(item => {
            totalAssignedStock += item.assigned_stock;
            totalAvailableStock += item.available_stock;
            totalSoldStock += item.sold_stock;
            if (item.product) {
                inventoryValue += (item.product.price * item.available_stock);
            }
        });

        res.status(200).json({
            success: true,
            data: {
                vendor_info: {
                    _id: subVendor._id,
                    name: subVendor.name,
                    email: subVendor.email,
                    phone: subVendor.phone,
                    address: subVendor.address_line,
                    city: subVendor.city,
                    state: subVendor.state,
                    postal_code: subVendor.postal_code,
                    super_vendor: subVendor.super_vendor,
                    status: subVendor.status,
                    createdAt: subVendor.createdAt,
                    updatedAt: subVendor.updatedAt
                },
                inventory: {
                    total_assigned_stock: totalAssignedStock,
                    total_available_stock: totalAvailableStock,
                    total_sold_stock: totalSoldStock,
                    inventory_value: inventoryValue,
                    products: subVendor.inventory
                },
                business_metrics: {
                    total_business: subVendor.total_business,
                    total_bikes_sold: subVendor.total_bikes_sold,
                    pending_amount: subVendor.pending_amount,
                    rating: subVendor.rating
                }
            }
        });
    } catch (error) {
        console.error('Error fetching sub vendor details:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error fetching details'
        });
    }
};

// @desc    Update sub vendor status (active, inactive, suspended)
// @route   PUT /api/super-admin/sub-vendors/:id/status
// @access  Super Admin
exports.updateSubVendorStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!['active', 'inactive', 'suspended'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be: active, inactive, or suspended'
            });
        }

        const subVendor = await Vendor.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!subVendor) {
            return res.status(404).json({ success: false, message: 'Sub Vendor not found' });
        }

        res.status(200).json({
            success: true,
            message: `Sub Vendor status updated to ${status}`,
            data: subVendor
        });
    } catch (error) {
        console.error('Error updating sub vendor status:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error updating status'
        });
    }
};

// @desc    Get sub vendor account ledger (all transactions)
// @route   GET /api/super-admin/sub-vendors/:id/ledger
// @access  Super Admin
exports.getSubVendorLedger = async (req, res) => {
    try {
        const { startDate, endDate, type } = req.query;
        let query = { vendor_id: req.params.id };

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        if (type) query.type = type; // sale, purchase, payment, credit, etc.

        // Get vendor info
        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }

        // Create ledger entries from inventory sales
        const ledgerEntries = [];

        // Business entries
        ledgerEntries.push({
            date: vendor.createdAt,
            type: 'account_created',
            description: 'Account Created',
            debit: 0,
            credit: 0,
            balance: 0
        });

        // Add sales records (if tracked separately)
        if (vendor.total_bikes_sold > 0) {
            ledgerEntries.push({
                date: vendor.updatedAt,
                type: 'sales',
                description: `Total Sales: ${vendor.total_bikes_sold} bikes`,
                debit: vendor.total_business,
                credit: 0,
                balance: vendor.total_business - vendor.pending_amount
            });
        }

        // Add pending payments
        if (vendor.pending_amount > 0) {
            ledgerEntries.push({
                date: vendor.updatedAt,
                type: 'pending_payment',
                description: 'Pending Payment Amount',
                debit: 0,
                credit: vendor.pending_amount,
                balance: vendor.total_business - vendor.pending_amount
            });
        }

        const totalDebit = ledgerEntries.reduce((sum, entry) => sum + entry.debit, 0);
        const totalCredit = ledgerEntries.reduce((sum, entry) => sum + entry.credit, 0);

        res.status(200).json({
            success: true,
            vendor: { name: vendor.name, id: vendor._id },
            summary: {
                total_business: vendor.total_business,
                total_bikes_sold: vendor.total_bikes_sold,
                pending_amount: vendor.pending_amount,
                received_amount: vendor.total_business - vendor.pending_amount,
                total_debit: totalDebit,
                total_credit: totalCredit
            },
            ledger: ledgerEntries.sort((a, b) => new Date(b.date) - new Date(a.date))
        });
    } catch (error) {
        console.error('Error fetching sub vendor ledger:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error fetching ledger'
        });
    }
};

// @desc    Get sub vendor payment history
// @route   GET /api/super-admin/sub-vendors/:id/payments
// @access  Super Admin
exports.getSubVendorPayments = async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;

        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }

        // Create payment records based on vendor metrics
        const payments = [
            {
                _id: `${vendor._id}-sales`,
                vendor_id: vendor._id,
                type: 'sales',
                amount: vendor.total_business,
                status: vendor.pending_amount > 0 ? 'partial' : 'completed',
                description: `Total Sales (${vendor.total_bikes_sold} bikes)`,
                date: vendor.updatedAt,
                payment_method: 'not_applicable'
            }
        ];

        if (vendor.pending_amount > 0) {
            payments.push({
                _id: `${vendor._id}-pending`,
                vendor_id: vendor._id,
                type: 'pending',
                amount: vendor.pending_amount,
                status: 'pending',
                description: 'Outstanding Payment',
                date: vendor.updatedAt,
                payment_method: 'not_applicable'
            });
        }

        res.status(200).json({
            success: true,
            vendor: { name: vendor.name, id: vendor._id },
            summary: {
                total_transactions: payments.length,
                total_amount: payments.reduce((sum, p) => sum + p.amount, 0),
                pending_amount: vendor.pending_amount,
                completed_amount: vendor.total_business - vendor.pending_amount
            },
            payments: payments.sort((a, b) => new Date(b.date) - new Date(a.date))
        });
    } catch (error) {
        console.error('Error fetching sub vendor payments:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error fetching payments'
        });
    }
};

// @desc    Record payment received from sub vendor
// @route   POST /api/super-admin/sub-vendors/:id/record-payment
// @access  Super Admin
exports.recordSubVendorPayment = async (req, res) => {
    try {
        const { amount, payment_method, reference_number, notes } = req.body;
        const paymentAmount = Number(amount);

        if (!paymentAmount || paymentAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid payment amount is required'
            });
        }

        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }

        if (paymentAmount > vendor.pending_amount) {
            return res.status(400).json({
                success: false,
                message: `Payment cannot exceed pending amount: ${vendor.pending_amount}`
            });
        }

        // Update pending amount
        vendor.pending_amount -= paymentAmount;
        await vendor.save();

        res.status(200).json({
            success: true,
            message: 'Payment recorded successfully',
            data: {
                vendor: vendor.name,
                payment_amount: paymentAmount,
                payment_method,
                reference_number,
                remaining_pending: vendor.pending_amount,
                total_business: vendor.total_business,
                notes
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

// @desc    Get sub vendor sales/transactions history
// @route   GET /api/super-admin/sub-vendors/:id/transactions
// @access  Super Admin
exports.getSubVendorTransactions = async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id)
            .populate({ path: 'inventory.product', select: 'name model base_price price' });

        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }

        // Create transaction records from inventory
        const transactions = vendor.inventory.map(item => ({
            product: item.product?.name || 'Unknown Product',
            product_model: item.product?.model || 'N/A',
            assigned_stock: item.assigned_stock,
            sold_stock: item.sold_stock,
            available_stock: item.available_stock,
            base_price: item.product?.base_price || 0,
            custom_price: item.custom_price || item.product?.price || 0,
            estimated_value: item.available_stock * (item.custom_price || item.product?.price || 0),
            sale_value: item.sold_stock * (item.custom_price || item.product?.price || 0)
        }));

        const totalValue = transactions.reduce((sum, t) => sum + t.estimated_value, 0);
        const totalSalesValue = transactions.reduce((sum, t) => sum + t.sale_value, 0);

        res.status(200).json({
            success: true,
            vendor: { name: vendor.name, id: vendor._id },
            summary: {
                total_products: transactions.length,
                total_assigned_stock: vendor.inventory.reduce((sum, i) => sum + i.assigned_stock, 0),
                total_sold_stock: vendor.inventory.reduce((sum, i) => sum + i.sold_stock, 0),
                total_available_stock: vendor.inventory.reduce((sum, i) => sum + i.available_stock, 0),
                total_inventory_value: totalValue,
                total_sales_value: totalSalesValue
            },
            transactions: transactions
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error fetching transactions'
        });
    }
};

// @desc    Get sub vendor invoice history (if invoices are tracked)
// @route   GET /api/super-admin/sub-vendors/:id/invoices
// @access  Super Admin
exports.getSubVendorInvoices = async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }

        // Generate invoice records based on sales data
        const invoices = [];

        // Create a summary invoice for total business
        if (vendor.total_business > 0) {
            invoices.push({
                invoice_id: `INV-${vendor._id.toString().slice(-8)}-001`,
                vendor_name: vendor.name,
                vendor_id: vendor._id,
                date: vendor.createdAt,
                period: 'All Time',
                total_items: vendor.total_bikes_sold,
                total_amount: vendor.total_business,
                paid_amount: vendor.total_business - vendor.pending_amount,
                pending_amount: vendor.pending_amount,
                status: vendor.pending_amount > 0 ? 'partially_paid' : 'paid',
                description: `Total business from ${vendor.total_bikes_sold} bike sales`
            });
        }

        res.status(200).json({
            success: true,
            vendor: { name: vendor.name, id: vendor._id },
            summary: {
                total_invoices: invoices.length,
                total_amount: vendor.total_business,
                paid_amount: vendor.total_business - vendor.pending_amount,
                pending_amount: vendor.pending_amount
            },
            invoices: invoices
        });
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error fetching invoices'
        });
    }
};

// @desc    Get sub vendors by state/region
// @route   GET /api/super-admin/sub-vendors/state/:state
// @access  Super Admin
exports.getSubVendorsByState = async (req, res) => {
    try {
        const { state } = req.params;

        const subVendors = await Vendor.find({ 
            state: state,
            vendor_type: 'sub_vendor'
        })
            .populate('super_vendor', 'company_name')
            .select('name email phone city state total_business total_bikes_sold status');

        res.status(200).json({
            success: true,
            state: state,
            count: subVendors.length,
            data: subVendors
        });
    } catch (error) {
        console.error('Error fetching sub vendors by state:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error fetching sub vendors'
        });
    }
};

// @desc    Get sub vendor performance report
// @route   GET /api/super-admin/sub-vendors/:id/report
// @access  Super Admin
exports.getSubVendorReport = async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id)
            .populate('super_vendor', 'company_name state')
            .populate({ path: 'inventory.product', select: 'name model base_price price' });

        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }

        // Calculate performance metrics
        let bestSellingProduct = null;
        let maxSales = 0;

        vendor.inventory.forEach(item => {
            if (item.sold_stock > maxSales) {
                maxSales = item.sold_stock;
                bestSellingProduct = item.product?.name;
            }
        });

        const turnoverRate = vendor.total_business > 0 
            ? ((vendor.total_bikes_sold / vendor.total_business) * 100).toFixed(2)
            : 0;

        res.status(200).json({
            success: true,
            report: {
                vendor_info: {
                    name: vendor.name,
                    email: vendor.email,
                    phone: vendor.phone,
                    city: vendor.city,
                    state: vendor.state,
                    super_vendor: vendor.super_vendor?.company_name || 'Direct',
                    status: vendor.status
                },
                performance: {
                    total_bikes_sold: vendor.total_bikes_sold,
                    total_business: vendor.total_business,
                    average_per_sale: vendor.total_bikes_sold > 0 
                        ? (vendor.total_business / vendor.total_bikes_sold).toFixed(2)
                        : 0,
                    pending_amount: vendor.pending_amount,
                    received_amount: vendor.total_business - vendor.pending_amount,
                    payment_completion_rate: vendor.total_business > 0
                        ? (((vendor.total_business - vendor.pending_amount) / vendor.total_business) * 100).toFixed(2)
                        : 0
                },
                inventory: {
                    total_products: vendor.inventory.length,
                    total_assigned: vendor.inventory.reduce((sum, i) => sum + i.assigned_stock, 0),
                    total_sold: vendor.inventory.reduce((sum, i) => sum + i.sold_stock, 0),
                    total_available: vendor.inventory.reduce((sum, i) => sum + i.available_stock, 0),
                    best_selling_product: bestSellingProduct,
                    best_selling_quantity: maxSales
                },
                rating: vendor.rating || 0
            }
        });
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error generating report'
        });
    }
};

