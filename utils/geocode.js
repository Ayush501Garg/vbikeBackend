const axios = require('axios');

async function geocodeAddress(address) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY; // or Mapbox API
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

  const response = await axios.get(url);
  if (response.data.results.length > 0) {
    const location = response.data.results[0].geometry.location;
    return [location.lng, location.lat]; // [lng, lat]
  }
  return null;
}

module.exports = geocodeAddress;
