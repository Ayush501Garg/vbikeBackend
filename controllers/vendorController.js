const Vendor = require('../models/vendor');
const geocodeAddress = require('../utils/geocode');

exports.createVendor = async (req, res) => {
  try {
    const { name, address_line, city, state, postal_code, country, phone, email, opening_hours, available_products } = req.body;

    const fullAddress = `${address_line}, ${city}, ${state}, ${postal_code}, ${country}`;
    const coordinates = await geocodeAddress(fullAddress);
    if (!coordinates) return res.status(400).json({ status: 'error', message: 'Unable to geocode address' });

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
      location: { type: 'Point', coordinates }
    });

    await vendor.save();
    res.status(201).json({ status: 'success', data: vendor });

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.getVendors = async (req, res) => {
  const vendors = await Vendor.find();
  res.json({ status: 'success', data: vendors });
};

exports.getNearbyVendors = async (req, res) => {
  try {
    const { lat, lng, radius = 10, product_id } = req.query;
    const vendors = await Vendor.find({
      available_products: product_id,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseFloat(radius) * 1000
        }
      }
    });
    res.json({ status: 'success', data: vendors });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
