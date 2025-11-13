const Booking = require('../models/booking');
const Vendor = require('../models/vendor');
const mongoose = require('mongoose');


exports.createBooking = async (req, res) => {
  try {
    const { user_id, product_id, vendor_id, shipping_address_id, pickup_date } = req.body;

    console.log("💥body",req.body);
    // -------------------------------
    // 1️⃣ Validate required fields
    // -------------------------------
    if (!user_id || !product_id || !vendor_id || !shipping_address_id) {
      return res.status(400).json({
        status: 'error',
        message: 'user_id, product_id, vendor_id, and shipping_address_id are required'
      });
    }

    // -------------------------------
    // 2️⃣ Validate MongoDB ObjectId format
    // -------------------------------
    const ids = { user_id, product_id, vendor_id, shipping_address_id };
    for (const [key, value] of Object.entries(ids)) {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return res.status(400).json({
          status: 'error',
          message: `${key} is not a valid ID`
        });
      }
    }

    // -------------------------------
    // 3️⃣ Validate pickup_date if provided
    // -------------------------------
    let baseDate = pickup_date ? new Date(pickup_date) : new Date();
    if (isNaN(baseDate.getTime())) {
      return res.status(400).json({
        status: 'error',
        message: 'pickup_date is invalid. Use ISO format e.g., 2025-11-12T10:00:00Z'
      });
    }

    // -------------------------------
    // 4️⃣ Check Vendor existence
    // -------------------------------
    const vendor = await Vendor.findById(vendor_id);
    if (!vendor) {
      return res.status(404).json({ status: 'error', message: 'Vendor not found' });
    }

    // -------------------------------
    // 5️⃣ Check product availability
    // -------------------------------
    const isAvailable = vendor.available_products.some(
      p => p.toString() === product_id.toString()
    );

    // Adjust pickup date if product not available (+1 day)
    const delayed = !isAvailable;
    const finalPickupDate = delayed
      ? new Date(baseDate.getTime() + 24 * 60 * 60 * 1000)
      : baseDate;

    const status = isAvailable ? 'ready' : 'delayed';

    // -------------------------------
    // 6️⃣ Create booking
    // -------------------------------
    const booking = new Booking({
      user_id,
      product_id,
      vendor_id,
      shipping_address_id,
      status,
      pickup_date: finalPickupDate
    });

    await booking.save();

    // -------------------------------
    // 7️⃣ Format pickup date for response
    // -------------------------------
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
      ? `Product not currently available. Your bike can be picked up on ${formattedDate}.`
      : `Booking confirmed! 🎉 You can take your bike on ${formattedDate}.`;

    // -------------------------------
    // 8️⃣ Send response
    // -------------------------------
    res.status(201).json({
      status: 'success',
      message,
      isAvailable,
      delayed,
      data: booking
    });
  } catch (err) {
    console.error('❌ Error creating booking:', err.message);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};




// ✅ Get All Bookings
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user_id product_id vendor_id shipping_address_id');
    res.json({ status: 'success', count: bookings.length, data: bookings });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ✅ Get All Bookings for a Specific User
exports.getBookingsByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;
console.log(user_id);
    // Validate user_id
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid user_id format',
      });
    }

    // Find all bookings by this user
    const bookings = await Booking.find({ user_id })
      .populate('user_id product_id vendor_id shipping_address_id')
      .sort({ createdAt: -1 }); // optional: newest first

    if (bookings.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No bookings found for this user',
      });
    }

    res.status(200).json({
      status: 'success',
      count: bookings.length,
      data: bookings,
    });
  } catch (err) {
    console.error('❌ Error fetching user bookings:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};


// ✅ Get Booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user_id product_id vendor_id shipping_address_id');
    if (!booking)
      return res.status(404).json({ status: 'error', message: 'Booking not found' });
    res.json({ status: 'success', data: booking });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ✅ Update Booking
exports.updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('user_id product_id vendor_id shipping_address_id');
    if (!booking)
      return res.status(404).json({ status: 'error', message: 'Booking not found' });
    res.json({ status: 'success', message: 'Booking updated successfully', data: booking });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ✅ Delete Booking
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking)
      return res.status(404).json({ status: 'error', message: 'Booking not found' });
    res.json({ status: 'success', message: 'Booking deleted successfully' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ✅ Check Availability for a Booking
exports.checkBookingAvailability = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('vendor_id product_id');
    if (!booking)
      return res.status(404).json({ status: 'error', message: 'Booking not found' });

    const vendor = await Vendor.findById(booking.vendor_id);
    const isAvailable = vendor.available_products.some(
      p => p.toString() === booking.product_id._id.toString()
    );

    res.json({
      status: 'success',
      availability: isAvailable ? 'ready' : 'delayed',
      message: isAvailable
        ? 'Product ready for pickup'
        : 'Product not available, pickup will be rescheduled',
      data: booking
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
