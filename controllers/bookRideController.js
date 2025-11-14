const BookRide = require('../models/bookride');
const User = require('../models/User');
const Product = require('../models/product');
const Vendor = require('../models/vendor');
const Address = require('../models/addressModel');
const mongoose = require('mongoose');

// ---------- HELPERS ----------
const getLiveUrl = (req, filename) =>
  filename ? `${req.protocol}://${req.get('host')}/${filename}` : null;

const getLiveUrls = (req, files) =>
  files && files.length ? files.map(f => getLiveUrl(req, f)) : [];

const formatRide = (req, ride) => ({
  ...ride,
  product_id: ride.product_id
    ? {
        ...ride.product_id,
        image_url: getLiveUrl(req, ride.product_id.image_url),
        thumbnails: getLiveUrls(req, ride.product_id.thumbnails)
      }
    : null
});

// ---------- CREATE BOOK RIDE ----------
exports.createBookRide = async (req, res) => {
  try {
    const { user_id, product_id, vendor_id, shipping_address_id, pickup_date } = req.body;

    if (!user_id || !product_id || !vendor_id || !shipping_address_id)
      return res.status(400).json({ status: 'error', message: 'All IDs are required' });

    const ids = { user_id, product_id, vendor_id, shipping_address_id };
    for (const [key, value] of Object.entries(ids)) {
      if (!mongoose.Types.ObjectId.isValid(value))
        return res.status(400).json({ status: 'error', message: `${key} is invalid` });
    }

    // Verify documents exist
    const user = await User.findById(user_id);
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

    const product = await Product.findById(product_id);
    if (!product) return res.status(404).json({ status: 'error', message: 'Product not found' });

    const vendor = await Vendor.findById(vendor_id);
    if (!vendor) return res.status(404).json({ status: 'error', message: 'Vendor not found' });

    const address = await Address.findById(shipping_address_id);
    if (!address) return res.status(404).json({ status: 'error', message: 'Address not found' });

    // Pickup date
    const baseDate = pickup_date ? new Date(pickup_date) : new Date();
    if (isNaN(baseDate.getTime()))
      return res.status(400).json({ status: 'error', message: 'Invalid pickup_date' });

    // Check availability
    const isAvailable = vendor.available_products?.some(p => p.toString() === product_id.toString());
    const delayed = !isAvailable;
    const finalPickupDate = delayed ? new Date(baseDate.getTime() + 24 * 60 * 60 * 1000) : baseDate;
    const status = isAvailable ? 'ready' : 'delayed';

    const bookride = await BookRide.create({
      user_id, product_id, vendor_id, shipping_address_id, status, pickup_date: finalPickupDate
    });

    const formattedDate = finalPickupDate.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const message = delayed
      ? `Product not available today. Pickup scheduled for ${formattedDate}.`
      : `Ride booked successfully! Pickup on ${formattedDate}.`;

    res.status(201).json({ status: 'success', message, delayed, data: bookride });

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ---------- GET ALL RIDES ----------
exports.getAllBookRides = async (req, res) => {
  try {
    let rides = await BookRide.find()
      .populate('user_id product_id vendor_id shipping_address_id')
      .sort({ createdAt: -1 });

    rides = rides.map(r => formatRide(req, r.toObject()));

    res.json({ status: 'success', count: rides.length, data: rides });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ---------- GET RIDES BY USER ----------
exports.getBookRidesByUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(user_id))
      return res.status(400).json({ status: 'error', message: 'Invalid user_id' });

    let rides = await BookRide.find({ user_id })
      .populate('user_id product_id vendor_id shipping_address_id')
      .sort({ createdAt: -1 });

    if (!rides.length) return res.status(404).json({ status: 'error', message: 'No rides found' });

    rides = rides.map(r => formatRide(req, r.toObject()));

    res.json({ status: 'success', count: rides.length, data: rides });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ---------- GET RIDE BY ID ----------
exports.getBookRideById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ status: 'error', message: 'Invalid ID' });

    let ride = await BookRide.findById(id)
      .populate('user_id product_id vendor_id shipping_address_id');

    if (!ride) return res.status(404).json({ status: 'error', message: 'Ride not found' });

    ride = formatRide(req, ride.toObject());
    res.json({ status: 'success', data: ride });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ---------- UPDATE RIDE ----------
exports.updateBookRide = async (req, res) => {
  try {
    const ride = await BookRide.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('user_id product_id vendor_id shipping_address_id');

    if (!ride) return res.status(404).json({ status: 'error', message: 'Ride not found' });

    res.json({ status: 'success', message: 'Ride updated', data: formatRide(req, ride.toObject()) });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ---------- DELETE RIDE ----------
exports.deleteBookRide = async (req, res) => {
  try {
    const ride = await BookRide.findByIdAndDelete(req.params.id);
    if (!ride) return res.status(404).json({ status: 'error', message: 'Ride not found' });

    res.json({ status: 'success', message: 'Ride deleted successfully' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ---------- CHECK AVAILABILITY ----------
exports.checkBookRideAvailability = async (req, res) => {
  try {
    const ride = await BookRide.findById(req.params.id)
      .populate('vendor_id product_id');

    if (!ride) return res.status(404).json({ status: 'error', message: 'Ride not found' });

    const isAvailable = ride.vendor_id.available_products?.some(
      p => p.toString() === ride.product_id._id.toString()
    );

    res.json({
      status: 'success',
      availability: isAvailable ? 'ready' : 'delayed',
      message: isAvailable ? 'Product ready for pickup' : 'Product not available, pickup will be rescheduled',
      data: formatRide(req, ride.toObject())
    });

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
