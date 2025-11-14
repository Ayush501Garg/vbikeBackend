const BookRide = require('../models/bookride');
const Vendor = require('../models/vendor');
const mongoose = require('mongoose');

// ---------- HELPERS FOR LIVE IMAGE URLs ----------
const getLiveUrl = (req, filename) =>
  filename ? `${req.protocol}://${req.get('host')}/${filename}` : null;

const getLiveUrls = (req, files) =>
  files && files.length ? files.map(f => getLiveUrl(req, f)) : [];

// ---------- CREATE BOOK RIDE ----------
exports.createBookRide = async (req, res) => {
  try {
    const { user_id, product_id, vendor_id, shipping_address_id, pickup_date } = req.body;

    // Required fields check
    if (!user_id || !product_id || !vendor_id || !shipping_address_id) {
      return res.status(400).json({
        status: 'error',
        message: 'user_id, product_id, vendor_id, and shipping_address_id are required'
      });
    }

    // Validate MongoDB IDs
    const ids = { user_id, product_id, vendor_id, shipping_address_id };
    for (const [key, value] of Object.entries(ids)) {
      if (!mongoose.Types.ObjectId.isValid(value))
        return res.status(400).json({ status: 'error', message: `${key} is not a valid ID` });
    }

    // Pickup date validation
    const baseDate = pickup_date ? new Date(pickup_date) : new Date();
    if (isNaN(baseDate.getTime()))
      return res.status(400).json({ status: 'error', message: 'pickup_date is invalid. Use ISO format.' });

    // Check Vendor
    const vendor = await Vendor.findById(vendor_id);
    if (!vendor) return res.status(404).json({ status: 'error', message: 'Vendor not found' });

    // Check product availability
    const isAvailable = vendor.available_products?.some(
      p => p.toString() === product_id.toString()
    );

    const delayed = !isAvailable;
    const finalPickupDate = delayed
      ? new Date(baseDate.getTime() + 24 * 60 * 60 * 1000)
      : baseDate;

    const status = isAvailable ? 'ready' : 'delayed';

    // Create booking
    const bookride = new BookRide({
      user_id,
      product_id,
      vendor_id,
      shipping_address_id,
      status,
      pickup_date: finalPickupDate
    });

    await bookride.save();

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
      ? `Product not available today. Your ride is scheduled for ${formattedDate}.`
      : `Ride booked successfully! Pickup on ${formattedDate}.`;

    res.status(201).json({
      status: 'success',
      message,
      isAvailable,
      delayed,
      data: bookride
    });

  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ---------- FORMAT BOOK RIDE FOR LIVE IMAGES ----------
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

// ---------- GET ALL BOOK RIDES ----------
exports.getAllBookRides = async (req, res) => {
  try {
    let rides = await BookRide.find().populate('user_id product_id vendor_id shipping_address_id').sort({ createdAt: -1 });
      

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

    let rides = await BookRide.find({ user_id }).populate('user_id product_id vendor_id shipping_address_id').sort({ createdAt: -1 });
      


    if (!rides.length)
      return res.status(404).json({ status: 'error', message: 'No rides found for this user' });

    rides = rides.map(r => formatRide(req, r.toObject()));

    res.json({ status: 'success', count: rides.length, data: rides });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Internal server error' });
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

    if (!ride)
      return res.status(404).json({ status: 'error', message: 'Ride not found' });

    ride = formatRide(req, ride.toObject());

    res.json({ status: 'success', data: ride });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ---------- UPDATE BOOK RIDE ----------
exports.updateBookRide = async (req, res) => {
  try {
    let ride = await BookRide.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('user_id product_id vendor_id shipping_address_id');

    if (!ride)
      return res.status(404).json({ status: 'error', message: 'Ride not found' });

    ride = formatRide(req, ride.toObject());

    res.json({ status: 'success', message: 'Ride updated successfully', data: ride });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ---------- DELETE BOOK RIDE ----------
exports.deleteBookRide = async (req, res) => {
  try {
    const ride = await BookRide.findByIdAndDelete(req.params.id);
    if (!ride)
      return res.status(404).json({ status: 'error', message: 'Ride not found' });

    res.json({ status: 'success', message: 'Ride deleted successfully' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ---------- CHECK AVAILABILITY ----------
exports.checkBookRideAvailability = async (req, res) => {
  try {
    const ride = await BookRide.findById(req.params.id).populate('vendor_id product_id');
    if (!ride)
      return res.status(404).json({ status: 'error', message: 'Ride not found' });

    const vendor = await Vendor.findById(ride.vendor_id);
    const isAvailable = vendor.available_products?.some(
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
