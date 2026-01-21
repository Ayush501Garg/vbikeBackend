const Vendor = require("../models/vendor");
const Product = require("../models/product");
const geocodeAddress = require("../utils/geocode");
const path = require("path");

// ------------------------------
// LIVE URL HELPERS
// ------------------------------
const getLiveUrl = (req, filename) =>
  filename ? `${req.protocol}://${req.get("host")}/${filename}` : null;

const getLiveUrls = (req, files) =>
  files?.length ? files.map(f => getLiveUrl(req, f)) : [];

// ------------------------------
// CREATE VENDOR
// ------------------------------
// ------------------------------
// CREATE VENDOR (WITH INVENTORY)
// ------------------------------
exports.createVendor = async (req, res) => {
  try {
    const {
      name,
      address_line,
      city,
      state,
      postal_code,
      country,
      phone,
      email,
      opening_hours,
      rating,
      inventory   // <-- NEW
    } = req.body;

    // Geocode
    const fullAddress = `${address_line}, ${city}, ${state}, ${postal_code}, ${country}`;
    let coordinates = await geocodeAddress(fullAddress);

    if (!coordinates) {
      return res.status(400).json({
        status: "error",
        message: "Unable to get location from address"
      });
    }

    const locationObj = Array.isArray(coordinates)
      ? { lat: coordinates[1], lng: coordinates[0] }
      : coordinates;

    // -----------------------------------------
    // HANDLE INVENTORY AT CREATION
    // -----------------------------------------
    let formattedInventory = [];

    if (Array.isArray(inventory) && inventory.length > 0) {
      for (const item of inventory) {
        const { product, assigned_stock } = item;

        const productData = await Product.findById(product);
        if (!productData) {
          return res.status(404).json({
            status: "error",
            message: `Product not found: ${product}`,
          });
        }

        if (assigned_stock > productData.stock_quantity) {
          return res.status(400).json({
            status: "error",
            message: `Only ${productData.stock_quantity} units available for product ${productData.name}`
          });
        }

        // Deduct stock from warehouse
        productData.stock_quantity -= assigned_stock;
        await productData.save();

        formattedInventory.push({
          product,
          assigned_stock,
          sold_stock: 0,
          available_stock: assigned_stock
        });
      }
    }

    // -----------------------------------------
    // CREATE VENDOR WITH INVENTORY
    // -----------------------------------------
    const vendor = new Vendor({
      name,
      address_line,
      city,
      state,
      postal_code,
      country,
      phone,
      email,
      opening_hours,
      rating: Number(rating) || 0,
      location: locationObj,
      inventory: formattedInventory   // <-- FINALLY ADDED
    });

    await vendor.save();

    res.status(201).json({
      status: "success",
      message: "Vendor created successfully",
      data: vendor,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


// ------------------------------
// FORMAT vendor.inventory (add live URLs)
// ------------------------------
const formatVendorProducts = (req, vendorObj) => {
  vendorObj.inventory = vendorObj.inventory.map(item => {
    if (item.product) {
      item.product.image_url = getLiveUrl(req, item.product.image_url);
      item.product.thumbnails = getLiveUrls(req, item.product.thumbnails);
    }
    return item;
  });
  return vendorObj;
};

// ------------------------------
// GET ALL VENDORS (WITH LIVE IMAGE URL)
// ------------------------------
exports.getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find().populate("inventory.product");

    const formatted = vendors.map(vendor => {
      const vObj = vendor.toObject();
      return formatVendorProducts(req, vObj);
    });

    res.json({ status: "success", data: formatted });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ------------------------------
// GET SINGLE VENDOR
// ------------------------------
exports.getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id)
      .populate("inventory.product");

    if (!vendor)
      return res.status(404).json({ status: "error", message: "Vendor not found" });

    const vObj = vendor.toObject();
    formatVendorProducts(req, vObj);

    res.json({ status: "success", data: vObj });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ------------------------------
// UPDATE VENDOR
// ------------------------------
exports.updateVendor = async (req, res) => {
  try {
    const {
      address_line,
      city,
      state,
      postal_code,
      country
    } = req.body;

    if (address_line || city || state || postal_code || country) {
      const fullAddress = `${address_line}, ${city}, ${state}, ${postal_code}, ${country}`;
      const coordinates = await geocodeAddress(fullAddress);

      if (!coordinates) {
        return res.status(400).json({
          status: "error",
          message: "Unable to get location from address",
        });
      }

      req.body.location = Array.isArray(coordinates)
        ? { lat: coordinates[1], lng: coordinates[0] }
        : coordinates;
    }

    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!vendor)
      return res.status(404).json({ status: "error", message: "Vendor not found" });

    res.json({ status: "success", message: "Vendor updated successfully", data: vendor });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ------------------------------
// DELETE VENDOR
// ------------------------------
exports.deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    if (!vendor)
      return res.status(404).json({ status: "error", message: "Vendor not found" });

    res.json({ status: "success", message: "Vendor deleted successfully" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ------------------------------
// ADD PRODUCT TO VENDOR INVENTORY
// ------------------------------
exports.addProductToInventory = async (req, res) => {
  try {
    const { vendorId, product, assigned_stock } = req.body;

    const productData = await Product.findById(product);
    if (!productData) return res.status(404).json({ message: "Product not found" });

    if (assigned_stock > productData.stock_quantity) {
      return res.status(400).json({
        message: `Only ${productData.stock_quantity} units available in warehouse`
      });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    const existing = vendor.inventory.find(item => item.product.toString() === product);
    if (existing) {
      return res.status(400).json({
        message: "Product already added. Use update instead."
      });
    }

    productData.stock_quantity -= assigned_stock;
    await productData.save();

    vendor.inventory.push({
      product,
      assigned_stock,
      sold_stock: 0,
      available_stock: assigned_stock
    });

    await vendor.save();

    res.json({ message: "Product assigned to vendor", vendor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ------------------------------
// UPDATE INVENTORY
// ------------------------------
exports.updateInventory = async (req, res) => {
  try {
    const { vendorId, product, assigned_stock, sold_stock } = req.body;

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    const productData = await Product.findById(product);
    if (!productData) return res.status(404).json({ message: "Product not found" });

    const item = vendor.inventory.find(i => i.product.toString() === product);
    if (!item) {
      return res.status(404).json({ message: "Product not in vendor inventory" });
    }

    const oldAssigned = item.assigned_stock;
    const addedAmount = assigned_stock ?? 0;

    if (addedAmount < 0)
      return res.status(400).json({ message: "assigned_stock must be positive" });

    if (addedAmount > productData.stock_quantity) {
      return res.status(400).json({
        message: `Only ${productData.stock_quantity} units available in warehouse`
      });
    }

    const newAssigned = oldAssigned + addedAmount;

    productData.stock_quantity -= addedAmount;

    const newSold = sold_stock ?? item.sold_stock;
    if (newSold > newAssigned) {
      return res.status(400).json({ message: "sold_stock cannot exceed assigned stock" });
    }

    item.assigned_stock = newAssigned;
    item.sold_stock = newSold;
    item.available_stock = newAssigned - newSold;

    await productData.save();
    await vendor.save();

    res.json({ message: "Inventory updated", vendor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ------------------------------
// REMOVE PRODUCT FROM INVENTORY
// ------------------------------
exports.removeProductFromInventory = async (req, res) => {
  try {
    const { vendorId, productId } = req.body;

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    const item = vendor.inventory.find(i => i.product.toString() === productId);
    if (!item) return res.status(404).json({ message: "Product not in inventory" });

    const productData = await Product.findById(productId);
    if (productData) {
      productData.stock_quantity += item.available_stock;
      await productData.save();
    }

    vendor.inventory = vendor.inventory.filter(i => i.product.toString() !== productId);
    await vendor.save();

    res.json({ message: "Product removed from inventory", vendor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ------------------------------
// TOTAL ASSIGNED STOCK
// ------------------------------
exports.getTotalAssignedStock = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const vendors = await Vendor.find();

    let totalAssigned = 0;
    let totalSold = 0;
    let totalAvailableAtVendors = 0;

    vendors.forEach(vendor => {
      vendor.inventory.forEach(item => {
        if (item.product.toString() === productId) {
          totalAssigned += item.assigned_stock;
          totalSold += item.sold_stock;
          totalAvailableAtVendors += item.available_stock;
        }
      });
    });

    const remainingInWarehouse = product.stock_quantity;

    res.json({
      productId,
      totalAssigned,
      totalSold,
      totalAvailableAtVendors,
      remainingInWarehouse,
      totalSystemQuantity: totalAssigned + remainingInWarehouse
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ------------------------------
// TOTAL STOCK SUMMARY
// ------------------------------
exports.getAllProductsTotalStock = async (req, res) => {
  try {
    const products = await Product.find();
    const vendors = await Vendor.find();

    const result = [];

    products.forEach(product => {
      let totalAssigned = 0;
      let totalSold = 0;
      let totalAvailableAtVendors = 0;

      vendors.forEach(vendor => {
        vendor.inventory.forEach(item => {
          if (item.product.toString() === product._id.toString()) {
            totalAssigned += item.assigned_stock;
            totalSold += item.sold_stock;
            totalAvailableAtVendors += item.available_stock;
          }
        });
      });

      result.push({
        productId: product._id,
        productName: product.name,
        totalAssigned,
        totalSold,
        totalAvailableAtVendors,
        remainingInWarehouse: product.stock_quantity,
        totalSystemQuantity: totalAssigned + product.stock_quantity
      });
    });

    res.json({
      status: "success",
      count: result.length,
      data: result
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ------------------------------
// Haversine
// ------------------------------
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ------------------------------
// SUB VENDOR SELLS PRODUCT
// ------------------------------
exports.sellProductBySubVendor = async (req, res) => {
  try {
    const { productId, quantity, selling_price, customer_details } = req.body;
    const qty = Number(quantity);

    if (!productId || !qty || qty <= 0) {
      return res.status(400).json({
        status: "error",
        message: "productId and positive quantity are required"
      });
    }

    const vendor = await Vendor.findById(req.params.id)
      .populate('super_vendor');
    
    if (!vendor) {
      return res.status(404).json({ 
        status: "error", 
        message: "Vendor not found" 
      });
    }

    const inventoryItem = vendor.inventory.find(
      item => item.product?.toString() === productId
    );

    if (!inventoryItem) {
      return res.status(404).json({
        status: "error",
        message: "Product not found in inventory"
      });
    }

    if (inventoryItem.available_stock < qty) {
      return res.status(400).json({
        status: "error",
        message: `Only ${inventoryItem.available_stock} units available`
      });
    }

    // Validate pricing if sub vendor under super vendor
    const product = await Product.findById(productId);
    if (vendor.vendor_type === 'sub_vendor' && vendor.super_vendor) {
      if (inventoryItem.min_price && selling_price < inventoryItem.min_price) {
        return res.status(400).json({
          status: "error",
          message: `Price cannot be below minimum price: ${inventoryItem.min_price}`
        });
      }
      if (inventoryItem.max_price && selling_price > inventoryItem.max_price) {
        return res.status(400).json({
          status: "error",
          message: `Price cannot exceed maximum price: ${inventoryItem.max_price}`
        });
      }
    }

    // Deduct from sub vendor inventory
    inventoryItem.available_stock -= qty;
    inventoryItem.sold_stock += qty;

    // Update business metrics
    const saleAmount = (selling_price || product.price) * qty;
    vendor.total_business += saleAmount;
    vendor.total_bikes_sold += qty;

    await vendor.save();

    // If sub vendor is under super vendor, update super vendor metrics
    if (vendor.vendor_type === 'sub_vendor' && vendor.super_vendor) {
      const SuperVendor = require('../models/SuperVendor');
      const superVendor = await SuperVendor.findById(vendor.super_vendor);
      
      if (superVendor) {
        superVendor.sub_vendor_business += saleAmount;
        superVendor.sub_vendor_bikes_sold += qty;
        superVendor.total_business = superVendor.direct_business + superVendor.sub_vendor_business;
        await superVendor.save();
      }
    }

    res.status(200).json({
      status: "success",
      message: "Sale completed successfully",
      sale_details: {
        product: product.name,
        quantity: qty,
        price_per_unit: selling_price || product.price,
        total_amount: saleAmount,
        remaining_stock: inventoryItem.available_stock,
        customer: customer_details
      }
    });
  } catch (err) {
    res.status(500).json({ 
      status: "error", 
      message: err.message 
    });
  }
};

// ------------------------------
// SET PRODUCT PRICING FOR SUB VENDOR
// ------------------------------
exports.setSubVendorProductPrice = async (req, res) => {
  try {
    const { productId, custom_price } = req.body;

    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ 
        status: "error", 
        message: "Vendor not found" 
      });
    }

    const inventoryItem = vendor.inventory.find(
      item => item.product?.toString() === productId
    );

    if (!inventoryItem) {
      return res.status(404).json({
        status: "error",
        message: "Product not found in inventory"
      });
    }

    // Check if custom pricing is allowed
    if (!vendor.pricing_rules?.can_set_custom_price) {
      return res.status(403).json({
        status: "error",
        message: "Custom pricing not allowed for this vendor"
      });
    }

    // Validate price within limits
    if (inventoryItem.min_price && custom_price < inventoryItem.min_price) {
      return res.status(400).json({
        status: "error",
        message: `Price cannot be below minimum: ${inventoryItem.min_price}`
      });
    }

    if (inventoryItem.max_price && custom_price > inventoryItem.max_price) {
      return res.status(400).json({
        status: "error",
        message: `Price cannot exceed maximum: ${inventoryItem.max_price}`
      });
    }

    inventoryItem.custom_price = custom_price;
    await vendor.save();

    res.status(200).json({
      status: "success",
      message: "Product price updated successfully",
      data: inventoryItem
    });
  } catch (err) {
    res.status(500).json({ 
      status: "error", 
      message: err.message 
    });
  }
};

// ------------------------------
// GET SUB VENDOR SALES HISTORY
// ------------------------------
exports.getSubVendorSalesHistory = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id)
      .populate({
        path: 'inventory.product',
        select: 'name model base_price'
      });

    if (!vendor) {
      return res.status(404).json({ 
        status: "error", 
        message: "Vendor not found" 
      });
    }

    const salesData = vendor.inventory.map(item => ({
      product: item.product,
      assigned_stock: item.assigned_stock,
      sold_stock: item.sold_stock,
      available_stock: item.available_stock,
      custom_price: item.custom_price
    }));

    res.status(200).json({
      status: "success",
      vendor_name: vendor.name,
      total_business: vendor.total_business,
      total_bikes_sold: vendor.total_bikes_sold,
      sales_data: salesData
    });
  } catch (err) {
    res.status(500).json({ 
      status: "error", 
      message: err.message 
    });
  }
};

// ------------------------------
// GET NEARBY VENDORS (with live image URLs)
// ------------------------------
exports.getNearbyVendors = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;

    const vendors = await Vendor.find().populate("inventory.product");

    const near = vendors.filter(v =>
      v.location?.lat &&
      getDistance(lat, lng, v.location.lat, v.location.lng) <= radius
    );

    const formatted = near.map(vendor => {
      const vObj = vendor.toObject();
      return formatVendorProducts(req, vObj);
    });

    res.json({ status: "success", count: formatted.length, data: formatted });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
