const express = require('express');
const router = express.Router();
const bookRideController = require('../controllers/bookRideController');

router.post('/', bookRideController.createBookRide);
router.get('/', bookRideController.getAllBookRides);
router.get('/:id', bookRideController.getBookRideById);
router.get('/user/:user_id', bookRideController.getBookRidesByUser);
router.put('/:id', bookRideController.updateBookRide);
router.delete('/:id', bookRideController.deleteBookRide);
router.get('/:id/check-availability', bookRideController.checkBookRideAvailability);

module.exports = router;
