// controllers/productController.js
const Product = require('../models/product');
const path = require('path');
const fs = require('fs');

// Helper functions
const getLiveUrl = (req, filename) => (filename ? `${req.protocol}://${req.get('host')}/${filename}` : null);
const getLiveUrls = (req, files) => (files && files.length > 0 ? files.map(f => getLiveUrl(req, f)) : []);

const sendError = (res, code, message) =>
  res.status(code).json({ status: 'error', code, message });

// CREATE PRODUCT
exports.createProduct = async (req, res) => {
  try {
    const {
      name, description, price, mrp, category_id, stock_quantity,
      power, color, features, model_details, is_active, battery_specs
    } = req.body;

    // Validate required fields
    const requiredFields = { name, price, category_id };
    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value || value === '') {
        return sendError(res, 400, `Field "${key}" is required.`);
      }
    }

    // Parse arrays
    const parseArray = (val) => val ? (Array.isArray(val) ? val : val.split(',').map(v => v.trim())) : [];

    // Parse battery_specs (JSON string)
    let parsedBatterySpecs = [];
    if (battery_specs) {
      try {
        parsedBatterySpecs = JSON.parse(battery_specs);
      } catch (e) {
        return sendError(res, 400, 'Invalid battery_specs JSON format');
      }
    }

    // Handle image uploads
    const imageFile = req.files?.['image']?.[0]?.filename || null;
    const thumbnailFiles = req.files?.['thumbnails']?.map(file => file.originalname) || []; // Use originalname to keep color-based names

    const product = new Product({
      name,
      description,
      price: Number(price),
      mrp: mrp ? Number(mrp) : null,
      category_id,
      stock_quantity: Number(stock_quantity) || 0,
      power: parseArray(power),
      color: parseArray(color),
      features: parseArray(features),
      model_details: parseArray(model_details),
      image_url: imageFile,
      thumbnails: thumbnailFiles,
      battery_specs: parsedBatterySpecs,
      is_active: is_active === 'false' ? false : true
    });

    await product.save();

    const productObj = product.toObject();
    delete productObj.__v;

    res.status(201).json({
      status: 'success',
      code: 201,
      message: 'Product created successfully.',
      data: {
        ...productObj,
        image_url: getLiveUrl(req, productObj.image_url),
        thumbnails: getLiveUrls(req, productObj.thumbnails)
      }
    });
  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 400, 'Image size too large.');
    }
    sendError(res, 400, err.message);
  }
};

// UPDATE PRODUCT
exports.updateProduct = async (req, res) => {
  try {
    const updateData = { ...req.body };
    const parseArray = (val) => val ? (Array.isArray(val) ? val : val.split(',').map(v => v.trim())) : [];

    if (updateData.power) updateData.power = parseArray(updateData.power);
    if (updateData.color) updateData.color = parseArray(updateData.color);
    if (updateData.features) updateData.features = parseArray(updateData.features);
    if (updateData.model_details) updateData.model_details = parseArray(updateData.model_details);

    // Parse battery_specs
    if (updateData.battery_specs) {
      try {
        updateData.battery_specs = JSON.parse(updateData.battery_specs);
      } catch (e) {
        return sendError(res, 400, 'Invalid battery_specs JSON format');
      }
    }

    // Handle file uploads
    if (req.files?.['image']) updateData.image_url = req.files['image'][0].filename;
    if (req.files?.['thumbnails']) updateData.thumbnails = req.files['thumbnails'].map(file => file.originalname);

    const product = await Product.findById(req.params.id);
    if (!product) return sendError(res, 404, 'Product not found.');

    // Delete old images if new ones uploaded
    if (updateData.image_url && product.image_url) {
      const oldImagePath = path.join(__dirname, '..', 'Uploads', product.image_url);
      if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
    }

    Object.assign(product, updateData);
    await product.save();

    const productObj = product.toObject();
    delete productObj.__v;

    res.json({
      status: 'success',
      code: 200,
      message: 'Product updated successfully.',
      data: {
        ...productObj,
        image_url: getLiveUrl(req, productObj.image_url),
        thumbnails: getLiveUrls(req, productObj.thumbnails)
      }
    });
  } catch (err) {
    sendError(res, 400, err.message);
  }
};

// GET ALL PRODUCTS
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().select('-__v');
    const formatted = products.map(p => ({
      ...p.toObject(),
      image_url: getLiveUrl(req, p.image_url),
      thumbnails: getLiveUrls(req, p.thumbnails)
    }));
    res.json({
      status: 'success',
      code: 200,
      message: 'Products retrieved successfully.',
      data: formatted
    });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

// GET SINGLE PRODUCT
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select('-__v');
    if (!product) return sendError(res, 404, 'Product not found.');
    res.json({
      status: 'success',
      code: 200,
      message: 'Product retrieved successfully.',
      data: {
        ...product.toObject(),
        image_url: getLiveUrl(req, product.image_url),
        thumbnails: getLiveUrls(req, product.thumbnails)
      }
    });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

// DELETE PRODUCT
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return sendError(res, 404, 'Product not found.');

    // Delete uploaded files
    if (product.image_url) {
      const imgPath = path.join(__dirname, '..', 'Uploads', product.image_url);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
    if (product.thumbnails?.length) {
      for (const file of product.thumbnails) {
        const filePath = path.join(__dirname, '..', 'Uploads', file);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    }

    res.json({
      status: 'success',
      code: 200,
      message: 'Product deleted successfully.'
    });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};