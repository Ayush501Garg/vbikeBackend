const Product = require('../models/product');
const path = require('path');
const fs = require('fs');

// Helper to generate live URLs dynamically from request
const getLiveUrl = (req, filename) => (filename ? `${req.protocol}://${req.get('host')}/${filename}` : null);
const getLiveUrls = (req, files) => (files && files.length > 0 ? files.map(f => getLiveUrl(req, f)) : []);

// Create Product
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, mrp, category_id, sku, stock_quantity, power, color, features } = req.body;


    const powerArray = power ? (Array.isArray(power) ? power : power.split(',').map(p => p.trim())) : [];
    const colorArray = color ? (Array.isArray(color) ? color : color.split(',').map(c => c.trim())) : [];

    const imageFile = req.files['image'] ? req.files['image'][0].filename : null;
    const thumbnailFiles = req.files['thumbnails'] ? req.files['thumbnails'].map(file => file.filename) : [];

    const product = new Product({
      name,
      description,
      price,
      mrp,
      category_id,
      sku,
      stock_quantity,
      power: powerArray,
      color: colorArray,
      image_url: imageFile,
      thumbnails: thumbnailFiles,
      features,
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
    res.status(400).json({
      status: 'error',
      code: 400,
      message: err.message
    });
  }
};

// Get All Products
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().select('-__v');

    const formattedProducts = products.map(p => ({
      ...p.toObject(),
      image_url: getLiveUrl(req, p.image_url),
      thumbnails: getLiveUrls(req, p.thumbnails)
    }));

    res.json({
      status: 'success',
      code: 200,
      message: 'Products retrieved successfully.',
      data: formattedProducts
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      code: 500,
      message: err.message
    });
  }
};

// Get Single Product
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select('-__v');
    if (!product) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'Product not found'
      });
    }

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
    res.status(500).json({
      status: 'error',
      code: 500,
      message: err.message
    });
  }
};

// Update Product
exports.updateProduct = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (updateData.power) {
      updateData.power = Array.isArray(updateData.power)
        ? updateData.power
        : updateData.power.split(',').map(p => p.trim());
    }
    if (updateData.color) {
      updateData.color = Array.isArray(updateData.color)
        ? updateData.color
        : updateData.color.split(',').map(c => c.trim());
    }

    if (req.files['image']) {
      updateData.image_url = req.files['image'][0].filename;
    }
    if (req.files['thumbnails']) {
      updateData.thumbnails = req.files['thumbnails'].map(file => file.filename);
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-__v');
    if (!product) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'Product not found'
      });
    }

    res.json({
      status: 'success',
      code: 200,
      message: 'Product updated successfully.',
      data: {
        ...product.toObject(),
        image_url: getLiveUrl(req, product.image_url),
        thumbnails: getLiveUrls(req, product.thumbnails)
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'error',
      code: 400,
      message: err.message
    });
  }
};

// Delete Product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'Product not found'
      });
    }

    // Delete files from uploads folder
    if (product.image_url) {
      const imagePath = path.join(__dirname, '..', 'uploads', product.image_url);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    if (product.thumbnails && product.thumbnails.length > 0) {
      product.thumbnails.forEach(file => {
        const filePath = path.join(__dirname, '..', 'uploads', file);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    }

    res.json({
      status: 'success',
      code: 200,
      message: 'Product deleted successfully.'
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      code: 500,
      message: err.message
    });
  }
};
