const Booking = require('../models/booking');
const Vendor = require('../models/vendor');

exports.createBooking = async (req, res) => {
  try {
    const { user_id, product_id, vendor_id, shipping_address_id } = req.body;

    const vendor = await Vendor.findById(vendor_id);
    if (!vendor) return res.status(404).json({ status: 'error', message: 'Vendor not found' });

    const isAvailable = vendor.available_products.some(p => p.toString() === product_id);
    if (!isAvailable) return res.status(400).json({ status: 'error', message: 'Product not available at this vendor' });

    const booking = new Booking({
      user_id,
      product_id,
      vendor_id,
      shipping_address_id,
      status: 'ready',
      pickup_date: new Date()
    });

    await booking.save();
    res.status(201).json({ status: 'success', data: booking });

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.getBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('user_id product_id vendor_id shipping_address_id');
  res.json({ status: 'success', data: booking });
};

exports.checkBookingAvailability = async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate('vendor_id product_id');
  if (!booking) return res.status(404).json({ status: 'error', message: 'Booking not found' });

  const vendor = await Vendor.findById(booking.vendor_id);
  const isAvailable = vendor.available_products.some(p => p.toString() === booking.product_id._id.toString());

  res.json({
    status: isAvailable ? 'ready' : 'delayed',
    message: isAvailable ? 'Product ready for pickup' : 'Product not available, pickup will be rescheduled',
    data: booking
  });
};
