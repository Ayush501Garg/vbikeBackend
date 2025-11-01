const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// 📦 Order Routes
router.post('/', orderController.createOrder);                    // Create order from cart
router.get('/user/:userId', orderController.getOrders);           // Get all orders for a user
router.get('/:id', orderController.getOrderById);                 // Get single order details
router.patch('/:id/status', orderController.updateOrderStatus);   // Update order status (admin/staff)

module.exports = router;
