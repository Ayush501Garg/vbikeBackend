const Vendor = require('../models/vendor');
const geocodeAddress = require('../utils/geocode');
const path = require('path');
const fs = require('fs');

// 🌐 Helper: Generate live URLs dynamically
const getLiveUrl = (req, filename) =>
  filename ? `${req.protocol}://${req.get('host')}/${filename}` : null;

const getLiveUrls = (req, files) =>
  files && files.length > 0 ? files.map(f => getLiveUrl(req, f)) : [];

// 🏗️ Create Vendor
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
      available_products,
      rating
    } = req.body;

    const fullAddress = `${address_line}, ${city}, ${state}, ${postal_code}, ${country}`;
    const coordinates = await geocodeAddress(fullAddress);

    if (!coordinates) {
      return res.status(400).json({
        status: "error",
        message: "Unable to get location from address"
      });
    }

    const locationObj = Array.isArray(coordinates)
      ? { lat: coordinates[1], lng: coordinates[0] }
      : coordinates;

    // ✅ Handle file uploads
    const logoFile = req.files['logo'] ? req.files['logo'][0].filename : null;
    const galleryFiles = req.files['gallery'] ? req.files['gallery'].map(f => f.filename) : [];

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
      available_products,
      rating: Number(rating) || 0,
      location: locationObj,
      logo: logoFile,
      gallery: galleryFiles
    });

    await vendor.save();

    const vendorObj = vendor.toObject();
    delete vendorObj.__v;

    res.status(201).json({
      status: "success",
      message: "Vendor created successfully",
      data: {
        ...vendorObj,
        logo: getLiveUrl(req, vendorObj.logo),
        gallery: getLiveUrls(req, vendorObj.gallery)
      }
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// 📋 Get All Vendors
exports.getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find().populate('available_products').select('-__v');
    const formattedVendors = vendors.map(v => ({
      ...v.toObject(),
      logo: getLiveUrl(req, v.logo),
      gallery: getLiveUrls(req, v.gallery)
    }));

    res.json({ status: 'success', data: formattedVendors });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// 🔍 Get Single Vendor
exports.getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id).populate('available_products').select('-__v');
    if (!vendor)
      return res.status(404).json({ status: 'error', message: 'Vendor not found' });

    res.json({
      status: 'success',
      data: {
        ...vendor.toObject(),
        logo: getLiveUrl(req, vendor.logo),
        gallery: getLiveUrls(req, vendor.gallery)
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ✏️ Update Vendor
exports.updateVendor = async (req, res) => {
  try {
    const { address_line, city, state, postal_code, country } = req.body;
    let coordinates;

    // ✅ Update location if address changes
    if (address_line || city || state || postal_code || country) {
      const fullAddress = `${address_line || ''}, ${city || ''}, ${state || ''}, ${postal_code || ''}, ${country || ''}`;
      coordinates = await geocodeAddress(fullAddress);
      if (coordinates) {
        req.body.location = Array.isArray(coordinates)
          ? { lat: coordinates[1], lng: coordinates[0] }
          : coordinates;
      }
    }

    // ✅ Handle file updates
    if (req.files['logo']) req.body.logo = req.files['logo'][0].filename;
    if (req.files['gallery']) req.body.gallery = req.files['gallery'].map(f => f.filename);

    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-__v');
    if (!vendor)
      return res.status(404).json({ status: 'error', message: 'Vendor not found' });

    res.json({
      status: 'success',
      message: 'Vendor updated successfully',
      data: {
        ...vendor.toObject(),
        logo: getLiveUrl(req, vendor.logo),
        gallery: getLiveUrls(req, vendor.gallery)
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// 🗑️ Delete Vendor
exports.deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    if (!vendor)
      return res.status(404).json({ status: 'error', message: 'Vendor not found' });

    // ✅ Delete uploaded files
    if (vendor.logo) {
      const logoPath = path.join(__dirname, '..', 'uploads', vendor.logo);
      if (fs.existsSync(logoPath)) fs.unlinkSync(logoPath);
    }
    if (vendor.gallery && vendor.gallery.length > 0) {
      vendor.gallery.forEach(file => {
        const filePath = path.join(__dirname, '..', 'uploads', file);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    }

    res.json({ status: 'success', message: 'Vendor deleted successfully' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// 📍 Get Nearby Vendors
exports.getNearbyVendors = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    if (!userLat || !userLng) {
      return res.status(400).json({
        status: 'error',
        message: 'Latitude and longitude are required'
      });
    }

    let vendors = await Vendor.find();
    vendors = vendors.filter(v => {
      if (!v.location?.lat || !v.location?.lng) return false;
      const distance = getDistanceFromLatLonInKm(userLat, userLng, v.location.lat, v.location.lng);
      return distance <= radius;
    });

    res.json({
      status: 'success',
      message: `Found ${vendors.length} vendors within ${radius} km`,
      count: vendors.length,
      data: vendors.map(v => ({
        ...v.toObject(),
        logo: getLiveUrl(req, v.logo),
        gallery: getLiveUrls(req, v.gallery)
      }))
    });
  } catch (err) {
    console.error('❌ Error in getNearbyVendors:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// 🧮 Haversine formula
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
