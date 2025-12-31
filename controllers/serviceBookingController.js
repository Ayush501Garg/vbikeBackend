const ServiceBooking = require("../models/ServiceBooking");
const mongoose = require("mongoose");

/* ===== Service Price Map (VBike Fixed Services) ===== */
const SERVICE_PRICES = {
  full_service: 499,
  washing: 99,
  battery_change: 299,
  breakdown: 199
};

/* ================= CREATE BOOKING ================= */
exports.createBooking = async (req, res) => {
  try {
    const { user_id, service_type, booking_date, booking_time, address } = req.body;

    if (!user_id || !service_type || !booking_date || !booking_time || !address) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id"
      });
    }

    if (!SERVICE_PRICES[service_type]) {
      return res.status(400).json({
        success: false,
        message: "Invalid service type"
      });
    }

    const booking = await ServiceBooking.create({
      user_id,
      service_type,
      booking_date,
      booking_time,
      address,
      price: SERVICE_PRICES[service_type]
    });

    res.status(201).json({
      success: true,
      message: "Service booked successfully",
      data: booking
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ================= GET USER BOOKINGS ================= */
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await ServiceBooking.find({
      user_id: req.params.userId
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ================= CANCEL BOOKING ================= */
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await ServiceBooking.findById(req.params.bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    booking.status = "cancelled";
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Booking cancelled"
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
