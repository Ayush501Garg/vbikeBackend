const Address = require('../models/addressModel');
const User = require('../models/User');
const geocodeAddress = require('../utils/geocode');

const cityCoordinates = {
  "New Delhi": [77.2167, 28.6448],
  "Mumbai": [72.8777, 19.0760],
  "Bangalore": [77.5946, 12.9716]
};

exports.createAddress = async (req, res) => {
  try {
    const { user_id, full_name, email, phone, address_line, city, state, postal_code, country, is_default } = req.body;

    const user = await User.findById(user_id);
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

    // Try to geocode full address
    const fullAddress = `${address_line}, ${city}, ${state}, ${postal_code}, ${country}`;
    let coordinates = await geocodeAddress(fullAddress);

    // Fallback: use city coordinates
    if (!coordinates) {
      if (cityCoordinates[city]) {
        coordinates = cityCoordinates[city];
        console.log('Using fallback coordinates for city:', city);
      } else {
        return res.status(400).json({ status: 'error', message: 'Unable to get location from address' });
      }
    }

    if (is_default) await Address.updateMany({ user_id }, { is_default: false });

    const address = new Address({
      user_id, full_name, email, phone,
      address_line, city, state, postal_code, country,
      is_default: is_default || false,
      location: { type: 'Point', coordinates }
    });

    await address.save();

    res.status(201).json({ status: 'success', message: 'Address added successfully', data: address });

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};


exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user_id: req.params.userId }).sort({ createdAt: -1 });
    res.json({ status: 'success', data: addresses });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;

    // If updating to default, unset others
    if (req.body.is_default) {
      const address = await Address.findById(id);
      if (address) await Address.updateMany({ user_id: address.user_id }, { is_default: false });
    }

    // If address changed, update location
    let coordinates;
    if (req.body.address_line || req.body.city || req.body.state || req.body.postal_code || req.body.country) {
      const fullAddress = `${req.body.address_line || ''}, ${req.body.city || ''}, ${req.body.state || ''}, ${req.body.postal_code || ''}, ${req.body.country || ''}`;
      coordinates = await geocodeAddress(fullAddress);
      if (coordinates) req.body.location = { type: 'Point', coordinates };
    }

    const updated = await Address.findByIdAndUpdate(id, req.body, { new: true });
    res.json({ status: 'success', data: updated });

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const deleted = await Address.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ status: 'error', message: 'Address not found' });
    res.json({ status: 'success', message: 'Address deleted successfully' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
