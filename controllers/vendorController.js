const Vendor = require('../models/vendor');
const geocodeAddress = require('../utils/geocode');

const path = require('path');

// 🗺️ Fallback coordinates for major Indian cities
const cityCoordinates = {
  "New Delhi": { lat: 28.6139, lng: 77.2090 },
  "Noida": { lat: 28.5355, lng: 77.3910 },
  "Ghaziabad": { lat: 28.6692, lng: 77.4538 },
  "Gurgaon": { lat: 28.4595, lng: 77.0266 },
  "Mumbai": { lat: 19.0760, lng: 72.8777 },
  "Pune": { lat: 18.5204, lng: 73.8567 },
  "Bangalore": { lat: 12.9716, lng: 77.5946 },
  "Hyderabad": { lat: 17.3850, lng: 78.4867 },
  "Chennai": { lat: 13.0827, lng: 80.2707 },
  "Kolkata": { lat: 22.5726, lng: 88.3639 },
  "Ahmedabad": { lat: 23.0225, lng: 72.5714 },
  "Jaipur": { lat: 26.9124, lng: 75.7873 }
};

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
    let coordinates = await geocodeAddress(fullAddress);


    console.log("💥💥💥coordinates",coordinates);

    // fallback
    if (!coordinates) { 
        return res
          .status(400)
          .json({ status: "error", message: "Unable to get location from address" });
    
    }

    const locationObj = Array.isArray(coordinates)
      ? { lat: coordinates[1], lng: coordinates[0] }
      : coordinates;

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
      rating: Number(rating) || 0, // ✅ fix here
      location: locationObj
    });

    await vendor.save();

    res
      .status(201)
      .json({
        status: "success",
        message: "Vendor created successfully",
        data: vendor
      });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


// Helper to generate live URLs dynamically from request
const getLiveUrl = (req, filename) =>
  filename ? `${req.protocol}://${req.get('host')}/${filename}` : null;
const getLiveUrls = (req, files) =>
  files && files.length > 0 ? files.map(f => getLiveUrl(req, f)) : [];

// 📋 Get All Vendors
exports.getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find().populate('available_products');

    const formattedVendors = vendors.map(vendor => {
      const vendorObj = vendor.toObject();

      // ✅ Transform product images
      if (vendorObj.available_products && vendorObj.available_products.length > 0) {
        vendorObj.available_products = vendorObj.available_products.map(prod => ({
          ...prod,
          image_url: getLiveUrl(req, prod.image_url),
          thumbnails: getLiveUrls(req, prod.thumbnails)
        }));
      }

      return vendorObj;
    });

    res.json({
      status: 'success',
      data: formattedVendors
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

// 🔍 Get Single Vendor
exports.getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id).populate('available_products');
    if (!vendor)
      return res.status(404).json({
        status: 'error',
        message: 'Vendor not found'
      });

    const vendorObj = vendor.toObject();

    // ✅ Transform product images
    if (vendorObj.available_products && vendorObj.available_products.length > 0) {
      vendorObj.available_products = vendorObj.available_products.map(prod => ({
        ...prod,
        image_url: getLiveUrl(req, prod.image_url),
        thumbnails: getLiveUrls(req, prod.thumbnails)
      }));
    }

    res.json({
      status: 'success',
      data: vendorObj
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

// ✏️ Update Vendor
exports.updateVendor = async (req, res) => {
  try {
    const { address_line, city, state, postal_code, country } = req.body;
    let coordinates;

    // update location if address changes
    if (address_line || city || state || postal_code || country) {
      const fullAddress = `${address_line || ''}, ${city || ''}, ${state || ''}, ${postal_code || ''}, ${country || ''}`;
      coordinates = await geocodeAddress(fullAddress);
      if (!coordinates && cityCoordinates[city]) coordinates = cityCoordinates[city];
      if (coordinates) {
        req.body.location = Array.isArray(coordinates)
          ? { lat: coordinates[1], lng: coordinates[0] }
          : coordinates;
      }
    }

    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!vendor) return res.status(404).json({ status: 'error', message: 'Vendor not found' });
    res.json({ status: 'success', message: 'Vendor updated successfully', data: vendor });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// 🗑️ Delete Vendor
exports.deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    if (!vendor) return res.status(404).json({ status: 'error', message: 'Vendor not found' });
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

    // ✅ Validate coordinates
    if (!userLat || !userLng) {
      return res.status(400).json({
        status: 'error',
        message: 'Latitude and longitude are required'
      });
    }

    // ✅ Fetch all vendors
    let vendors = await Vendor.find();

    // ✅ Filter vendors within radius (km)
    vendors = vendors.filter(vendor => {
      if (!vendor.location?.lat || !vendor.location?.lng) return false;
      const distance = getDistanceFromLatLonInKm(
        userLat,
        userLng,
        vendor.location.lat,
        vendor.location.lng
      );
      return distance <= radius;
    });

    // ✅ Return nearby vendors
    res.json({
      status: 'success',
      message: `Found ${vendors.length} vendors within ${radius} km`,
      count: vendors.length,
      data: vendors
    });
  } catch (err) {
    console.error('❌ Error in getNearbyVendors:', err);
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

// 🧮 Haversine formula (in KM)
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


// 🔢 Haversine Formula
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
