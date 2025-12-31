const express = require("express");
const router = express.Router();
const controller = require("../controllers/serviceBookingController");

router.post("/create", controller.createBooking);
router.get("/user/:userId", controller.getUserBookings);

router.put("/cancel/:bookingId", controller.cancelBooking);

module.exports = router;
