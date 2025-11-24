const Booking = require('../models/booking');
const Vendor = require('../models/vendor');
const mongoose = require("mongoose");

// Helper to convert filename to live URL
const getLiveUrl = (req, filename) => {
  if (!filename) return null;

  // If file already contains http or https → return as-is
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }

  return `${req.protocol}://${req.get('host')}/${filename}`;
};

// hhh

// ---------- CREATE BOOKING ----------
exports.createBooking = async (req, res) => {
  try {
    console.log("req.body:", req.body);

    const { user_id, product_id, vendor_id, shipping_address_id, pickup_date } = req.body;

    // Required fields check
    if (!user_id || !product_id || !vendor_id || !shipping_address_id) {
      return res.status(400).json({
        status: "error",
        message: "user_id, product_id, vendor_id, and shipping_address_id are required",
      });
    }

    // Validate IDs
    const ids = { user_id, product_id, vendor_id, shipping_address_id };
    for (const [key, value] of Object.entries(ids)) {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return res.status(400).json({ status: "error", message: `${key} is not a valid ID` });
      }
    }

    // Parse pickup date
    let baseDate = pickup_date ? new Date(pickup_date) : new Date();
    if (isNaN(baseDate.getTime())) {
      return res.status(400).json({
        status: "error",
        message: "pickup_date is invalid. Use ISO format",
      });
    }

    // Get vendor
    const vendor = await Vendor.findById(vendor_id);
    if (!vendor)
      return res.status(404).json({ status: "error", message: "Vendor not found" });

    // ⭐ Check availability using vendor.inventory ⭐
    const productEntry = vendor.inventory.find(
      (item) => item.product.toString() === product_id.toString()
    );

    const isAvailable = productEntry && productEntry.available_stock > 0;

    // Delay logic based on availability
    const delayed = !isAvailable;
    const finalPickupDate = delayed
      ? new Date(baseDate.getTime() + 24 * 60 * 60 * 1000) // +1 day
      : baseDate;

    const status = isAvailable ? "ready" : "delayed";

    // Create booking
    const booking = new Booking({
      user_id,
      product_id,
      vendor_id,
      shipping_address_id,
      status,
      pickup_date: finalPickupDate,
    });

    await booking.save();

    // Format pickup date
    const formattedDate = finalPickupDate.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const message = delayed
      ? `Product currently unavailable. Pickup will be available on ${formattedDate}.`
      : `Booking confirmed! 🎉 Pickup on ${formattedDate}.`;

    // Populate product
    await booking.populate("product_id");

    // Convert image to URL
    if (booking.product_id?.image_url) {
      booking.product_id.image_url = getLiveUrl(req, booking.product_id.image_url);
    }

    return res.status(201).json({
      status: "success",
      message,
      isAvailable,
      delayed,
      data: booking,
    });
  } catch (err) {
    console.error("CREATE BOOKING ERROR:", err);
    return res.status(500).json({
      status: "error",
      message: err.message || "Internal server error",
    });
  }
};


// ---------- GET ALL BOOKINGS ----------
exports.getAllBookings = async (req, res) => {
  try {
    let bookings = await Booking.find().populate('user_id product_id vendor_id shipping_address_id').sort({ createdAt: -1 });

    // convert product images to live URLs
    bookings = bookings.map(b => {
      if (b.product_id) b.product_id.image_url = getLiveUrl(req, b.product_id.image_url);
      return b;
    });

    res.json({ status: 'success', count: bookings.length, data: bookings });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ---------- GET BOOKINGS BY USER ----------
exports.getBookingsByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(user_id)) return res.status(400).json({ status: 'error', message: 'Invalid user_id format' });

    let bookings = await Booking.find({ user_id }).populate('user_id product_id vendor_id shipping_address_id').sort({ createdAt: -1 });
    if (bookings.length === 0) return res.status(404).json({ status: 'error', message: 'No bookings found for this user' });

    bookings = bookings.map(b => {
      if (b.product_id) b.product_id.image_url = getLiveUrl(req, b.product_id.image_url);
      return b;
    });

    res.status(200).json({ status: 'success', count: bookings.length, data: bookings });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ---------- GET BOOKING BY ID ----------
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ status: 'error', message: 'Invalid booking ID format' });

    let booking = await Booking.findById(id).populate('user_id product_id vendor_id shipping_address_id');
    if (!booking) return res.status(404).json({ status: 'error', message: 'Booking not found' });

    if (booking.product_id) booking.product_id.image_url = getLiveUrl(req, booking.product_id.image_url);

    res.json({ status: 'success', data: booking });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ---------- UPDATE BOOKING ----------
exports.updateBooking = async (req, res) => {
  try {
    let booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('user_id product_id vendor_id shipping_address_id');
    if (!booking) return res.status(404).json({ status: 'error', message: 'Booking not found' });

    if (booking.product_id) booking.product_id.image_url = getLiveUrl(req, booking.product_id.image_url);

    res.json({ status: 'success', message: 'Booking updated successfully', data: booking });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ---------- DELETE BOOKING ----------
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ status: 'error', message: 'Booking not found' });
    res.json({ status: 'success', message: 'Booking deleted successfully' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ---------- CHECK BOOKING AVAILABILITY ----------
exports.checkBookingAvailability = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('vendor_id product_id');

    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    const vendor = booking.vendor_id;
    const productId = booking.product_id._id.toString();

    // ⭐ FIXED INVENTORY LOGIC ⭐
    const productEntry = vendor.inventory.find(
      item => item.product.toString() === productId
    );

    const isAvailable = productEntry && productEntry.available_stock > 0;

    // Update image URL
    if (booking.product_id) {
      booking.product_id.image_url = getLiveUrl(req, booking.product_id.image_url);
    }

    res.json({
      status: 'success',
      availability: isAvailable ? 'ready' : 'delayed',
      message: isAvailable
        ? 'Product ready for pickup'
        : 'Product not available, pickup will be rescheduled',
      data: booking
    });

  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};
