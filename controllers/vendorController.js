const Vendor = require('../models/vendor');
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

// 📍 Create new vendor
exports.createVendor = async (req, res) => {
  try {
    const { name, address_line, city, state, postal_code, country, phone, email, opening_hours, available_products } = req.body;

    // Generate full address string
    const fullAddress = `${address_line}, ${city}, ${state}, ${postal_code}, ${country}`;
    let coordinates = await geocodeAddress(fullAddress);

    // Fallback if geocoding fails
    if (!coordinates) {
      if (cityCoordinates[city]) {
        coordinates = cityCoordinates[city];
        console.log('📍 Using fallback coordinates for city:', city);
      } else {
        return res.status(400).json({ status: 'error', message: 'Unable to get location from address' });
      }
    }

    // Convert array → { lat, lng }
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
      location: locationObj
    });

    await vendor.save();
    res.status(201).json({ status: 'success', message: 'Vendor created successfully', data: vendor });

  } catch (err) {
    console.error('❌ Error creating vendor:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// 📋 Get all vendors
exports.getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find().populate('available_products');
    res.json({ status: 'success', data: vendors });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// 📍 Get nearby vendors (manual distance calculation since no GeoJSON index)
exports.getNearbyVendors = async (req, res) => {
  try {
    const { lat, lng, radius = 10, product_id } = req.query;
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    if (!userLat || !userLng)
      return res.status(400).json({ status: 'error', message: 'Latitude and longitude are required' });

    // Get all vendors that have the product
    let vendors = await Vendor.find({ available_products: product_id });

    // Filter vendors within radius (in km)
    vendors = vendors.filter(vendor => {
      if (!vendor.location?.lat || !vendor.location?.lng) return false;
      const distance = getDistanceFromLatLonInKm(userLat, userLng, vendor.location.lat, vendor.location.lng);
      return distance <= radius;
    });

    res.json({ status: 'success', count: vendors.length, data: vendors });
  } catch (err) {
    console.error('❌ Error finding nearby vendors:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// 🧮 Haversine formula for distance (in KM)
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in KM
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
