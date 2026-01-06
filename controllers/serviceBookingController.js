const ServiceBooking = require("../models/ServiceBooking");
const VendorServiceSlot = require("../models/VendorServiceSlot");
const mongoose = require("mongoose");

/* ===== Service Price Map ===== */
const SERVICE_PRICES = {
  full_service: 499,
  washing: 99,
  battery_change: 299,
  breakdown: 199
};

/* ================= CREATE BOOKING ================= */
exports.createBooking = async (req, res) => {
  try {
    const {
      user_id,
      vendor_id,
      service_type,
      booking_date,
      booking_time,
      address
    } = req.body;

    /* ===== Validation ===== */
    if (
      !user_id ||
      !vendor_id ||
      !service_type ||
      !booking_date ||
      !booking_time ||
      !address
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(user_id) ||
      !mongoose.Types.ObjectId.isValid(vendor_id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid user or vendor id"
      });
    }

    if (!SERVICE_PRICES[service_type]) {
      return res.status(400).json({
        success: false,
        message: "Invalid service type"
      });
    }

    /* ===== Vendor Slot Config ===== */
    const vendorSlot = await VendorServiceSlot.findOne({ vendor_id });

    if (!vendorSlot) {
      return res.status(404).json({
        success: false,
        message: "Vendor slot configuration not found"
      });
    }

    if (!vendorSlot.service_types.includes(service_type)) {
      return res.status(400).json({
        success: false,
        message: "Service not provided by vendor"
      });
    }

    /* ===== Slot Capacity Check ===== */
    const bookedCount = await ServiceBooking.countDocuments({
      vendor_id,
      booking_date,
      booking_time,
      status: { $ne: "cancelled" }
    });

    if (bookedCount >= vendorSlot.max_service_per_slot) {
      return res.status(400).json({
        success: false,
        message: "This time slot is fully booked"
      });
    }

    /* ===== Create Booking ===== */
    const booking = await ServiceBooking.create({
      user_id,
      vendor_id,
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
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/* ================= GET USER BOOKINGS ================= */
exports.getUserBookings = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id"
      });
    }

    const bookings = await ServiceBooking.find({ user_id: userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/* ================= CANCEL BOOKING ================= */
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking id"
      });
    }

    const booking = await ServiceBooking.findById(bookingId);

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
      message: "Booking cancelled successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
