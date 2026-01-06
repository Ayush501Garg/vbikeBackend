const Address = require('../models/addressModel');
const User = require('../models/User');
const geocodeAddress = require('../utils/geocode');

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

// 📦 Create new address
exports.createAddress = async (req, res) => {
  try {
    const { user_id, full_name, email, phone, address_line, city, state, postal_code, country, is_default } = req.body;

    const user = await User.findById(user_id);
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

    // Try to geocode full address
    const fullAddress = `${address_line}, ${city}, ${state}, ${postal_code}, ${country}`;
    let coordinates = await geocodeAddress(fullAddress);

    // Fallback: use city coordinates if geocode fails
    if (!coordinates) {
      if (cityCoordinates[city]) {
        coordinates = cityCoordinates[city];
        console.log('📍 Using fallback coordinates for city:', city);
      } else {
        return res.status(400).json({ status: 'error', message: 'Unable to get location from address' });
      }
    }

    // Convert array to {lat, lng} if geocodeAddress returned [lng, lat]
    const locationObj = Array.isArray(coordinates)
      ? { lat: coordinates[1], lng: coordinates[0] }
      : coordinates;

    // Unset old default address if new one is default
    if (is_default) await Address.updateMany({ user_id }, { is_default: false });

    // Save address
    const address = new Address({
      user_id,
      full_name,
      email,
      phone,
      address_line,
      city,
      state,
      postal_code,
      country,
      is_default: is_default || false,
      location: locationObj
    });

    await address.save();

    res.status(201).json({
      status: 'success',
      message: 'Address added successfully',
      data: address
    });
  } catch (err) {
    console.error('❌ Error creating address:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
};


// 📬 Get single address for a user
exports.getAddressByUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find one address for this user (most recent one)
    const address = await Address.findOne({ user_id: userId })
      .sort({ createdAt: -1 })
      .lean();

    if (!address) {
      return res.json({
        status: 'success',
        message: 'No address found for this user',
        data: null
      });
    }

    res.json({
      status: 'success',
      data: address
    });
  } catch (err) {
    console.error('❌ Error fetching address:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
};


// 📬 Get all addresses for a user
exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user_id: req.params.userId }).sort({ createdAt: -1 });
    res.json({ status: 'success', data: addresses });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// 🧾 Update address
exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.body.is_default) {
      const address = await Address.findById(id);
      if (address) await Address.updateMany({ user_id: address.user_id }, { is_default: false });
    }

    let coordinates;
    if (req.body.address_line || req.body.city || req.body.state || req.body.postal_code || req.body.country) {
      const fullAddress = `${req.body.address_line || ''}, ${req.body.city || ''}, ${req.body.state || ''}, ${req.body.postal_code || ''}, ${req.body.country || ''}`;
      coordinates = await geocodeAddress(fullAddress);

      if (!coordinates && cityCoordinates[req.body.city]) {
        coordinates = cityCoordinates[req.body.city];
        console.log('📍 Using fallback coordinates for city:', req.body.city);
      }

      if (coordinates) {
        req.body.location = Array.isArray(coordinates)
          ? { lat: coordinates[1], lng: coordinates[0] }
          : coordinates;
      }
    }

    const updated = await Address.findByIdAndUpdate(id, req.body, { new: true });
    res.json({ status: 'success', data: updated });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ❌ Delete address
exports.deleteAddress = async (req, res) => {
  try {
    const deleted = await Address.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ status: 'error', message: 'Address not found' });
    res.json({ status: 'success', message: 'Address deleted successfully' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
