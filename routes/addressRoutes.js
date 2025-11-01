const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');

// 🏠 Address Routes
router.post('/', addressController.createAddress);                // Add new address
router.get('/:userId', addressController.getAddresses);           // Get all addresses of a user
router.put('/:id', addressController.updateAddress);              // Update specific address
router.delete('/:id', addressController.deleteAddress);           // Delete specific address

module.exports = router;
