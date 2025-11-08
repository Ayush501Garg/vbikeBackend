const Booking = require('../models/booking');
const Vendor = require('../models/vendor');

// ✅ Create Booking
exports.createBooking = async (req, res) => {
  try {
    const { user_id, product_id, vendor_id, shipping_address_id, pickup_date } = req.body;

    const vendor = await Vendor.findById(vendor_id);
    if (!vendor) {
      return res.status(404).json({ status: 'error', message: 'Vendor not found' });
    }

    // Optional: verify product availability
    const isAvailable = vendor.available_products.some(p => p.toString() === product_id);
    if (!isAvailable) {
      return res.status(400).json({ status: 'error', message: 'Product not available at this vendor' });
    }

    const booking = new Booking({
      user_id,
      product_id,
      vendor_id,
      shipping_address_id,
      status: 'ready',
      pickup_date: pickup_date || new Date()
    });

    await booking.save();
    res.status(201).json({ status: 'success', message: 'Booking created successfully', data: booking });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
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
