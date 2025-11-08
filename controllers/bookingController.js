const Booking = require('../models/booking');
const Vendor = require('../models/vendor');



exports.createBooking = async (req, res) => {
  try {
    const { user_id, product_id, vendor_id, shipping_address_id, pickup_date } = req.body;

    // 🧾 Validate required fields
    if (!user_id || !product_id || !vendor_id || !shipping_address_id) {
      return res.status(400).json({
        status: 'error',
        message: 'user_id, product_id, vendor_id, and shipping_address_id are required'
      });
    }

    // 🏪 Find Vendor
    const vendor = await Vendor.findById(vendor_id);
    if (!vendor)
      return res.status(404).json({ status: 'error', message: 'Vendor not found' });

    // 🧩 Check product availability
    const isAvailable = vendor.available_products.some(
      p => p.toString() === product_id.toString()
    );

    // 📅 Handle user-specified or default date
    let baseDate = pickup_date ? new Date(pickup_date) : new Date();
    if (isNaN(baseDate.getTime())) baseDate = new Date(); // fallback if invalid date

    // 🕒 Adjust date if product not available (+1 day)
    const finalPickupDate = isAvailable
      ? baseDate
      : new Date(baseDate.getTime() + 24 * 60 * 60 * 1000);

    const status = isAvailable ? 'ready' : 'delayed';

    // 🧱 Create booking
    const booking = new Booking({
      user_id,
      product_id,
      vendor_id,
      shipping_address_id,
      status,
      pickup_date: finalPickupDate
    });

    await booking.save();

    // 🕒 Format human-readable date
    const formattedDate = finalPickupDate.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // 🧾 Build response message
    const message = isAvailable
      ? `Booking confirmed! 🎉 You can take your bike on ${formattedDate}.`
      : `Product not currently available. You can take your bike on ${formattedDate}.`;

    // 🚀 Final response
    res.status(201).json({
      status: 'success',
      message,
      isAvailable,
      data: booking
    });

  } catch (err) {
    console.error('❌ Error creating booking:', err.message);
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
