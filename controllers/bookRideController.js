const BookRide = require('../models/bookride');
const Vendor = require('../models/vendor');
const mongoose = require('mongoose');

// Create a Book Ride
exports.createBookRide = async (req, res) => {
  try {
    const { user_id, product_id, vendor_id, shipping_address_id, pickup_date } = req.body;

    // Required fields check
    if (!user_id || !product_id || !vendor_id || !shipping_address_id) {
      return res.status(400).json({ status: 'error', message: 'user_id, product_id, vendor_id, and shipping_address_id are required' });
    }

    // Validate MongoDB IDs
    const ids = { user_id, product_id, vendor_id, shipping_address_id };
    for (const [key, value] of Object.entries(ids)) {
      if (!mongoose.Types.ObjectId.isValid(value)) return res.status(400).json({ status: 'error', message: `${key} is not a valid ID` });
    }

    // Pickup date validation
    const baseDate = pickup_date ? new Date(pickup_date) : new Date();
    if (isNaN(baseDate.getTime())) return res.status(400).json({ status: 'error', message: 'pickup_date is invalid. Use ISO format' });

    // Check Vendor
    const vendor = await Vendor.findById(vendor_id);
    if (!vendor) return res.status(404).json({ status: 'error', message: 'Vendor not found' });

    // Check product availability
    const isAvailable = vendor.available_products?.some(p => p.toString() === product_id.toString());
    const delayed = !isAvailable;
    const finalPickupDate = delayed ? new Date(baseDate.getTime() + 24*60*60*1000) : baseDate;
    const status = isAvailable ? 'ready' : 'delayed';

    // Create booking
    const bookride = new BookRide({ user_id, product_id, vendor_id, shipping_address_id, status, pickup_date: finalPickupDate });
    await bookride.save();

    const formattedDate = finalPickupDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday:'long', year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' });
    const message = delayed ? `Product not available today. Your ride is scheduled for ${formattedDate}.` : `Ride booked successfully! Pickup on ${formattedDate}.`;

    res.status(201).json({ status: 'success', message, isAvailable, delayed, data: bookride });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// Get all Book Rides
exports.getAllBookRides = async (req, res) => {
  try {
    const bookrides = await BookRide.find().populate('user_id product_id vendor_id shipping_address_id').sort({ createdAt: -1 });
    res.json({ status: 'success', count: bookrides.length, data: bookrides });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// Get Book Rides by User
exports.getBookRidesByUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(user_id)) return res.status(400).json({ status: 'error', message: 'Invalid user_id' });

    const bookrides = await BookRide.find({ user_id }).populate('user_id product_id vendor_id shipping_address_id').sort({ createdAt: -1 });
    if (!bookrides.length) return res.status(404).json({ status: 'error', message: 'No rides found for this user' });

    res.json({ status: 'success', count: bookrides.length, data: bookrides });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// Get Book Ride by ID
exports.getBookRideById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ status: 'error', message: 'Invalid ID' });

    const bookride = await BookRide.findById(id).populate('user_id product_id vendor_id shipping_address_id');
    if (!bookride) return res.status(404).json({ status: 'error', message: 'Ride not found' });

    res.json({ status: 'success', data: bookride });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// Update Book Ride
exports.updateBookRide = async (req, res) => {
  try {
    const bookride = await BookRide.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('user_id product_id vendor_id shipping_address_id');
    if (!bookride) return res.status(404).json({ status: 'error', message: 'Ride not found' });

    res.json({ status: 'success', message: 'Ride updated successfully', data: bookride });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// Delete Book Ride
exports.deleteBookRide = async (req, res) => {
  try {
    const bookride = await BookRide.findByIdAndDelete(req.params.id);
    if (!bookride) return res.status(404).json({ status: 'error', message: 'Ride not found' });

    res.json({ status: 'success', message: 'Ride deleted successfully' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// Check Book Ride Availability
exports.checkBookRideAvailability = async (req, res) => {
  try {
    const bookride = await BookRide.findById(req.params.id).populate('vendor_id product_id');
    if (!bookride) return res.status(404).json({ status: 'error', message: 'Ride not found' });

    const vendor = await Vendor.findById(bookride.vendor_id);
    const isAvailable = vendor.available_products?.some(p => p.toString() === bookride.product_id._id.toString());

    res.json({ status: 'success', availability: isAvailable ? 'ready' : 'delayed', message: isAvailable ? 'Product ready for pickup' : 'Product not available, pickup will be rescheduled', data: bookride });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
