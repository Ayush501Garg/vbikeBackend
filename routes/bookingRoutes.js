const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

router.post('/', bookingController.createBooking);
router.get('/:id', bookingController.getBooking);
router.get('/:id/check', bookingController.checkBookingAvailability);

module.exports = router;
