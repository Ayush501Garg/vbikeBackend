const Order = require('../models/orderModel');
const Cart = require('../models/Cart');
const Vehicle = require('../models/product'); // Using your existing Product model
const Address = require('../models/addressModel');
const User = require('../models/User');

// 🛍️ Create Order
exports.createOrder = async (req, res) => {
  try {
    const { user_id, address_id } = req.body;

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'User not found.'
      });
    }

    const address = await Address.findById(address_id);
    if (!address) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'Invalid address.'
      });
    }

    const cart = await Cart.findOne({ user_id }).populate('items.product_id');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        status: 'error',
        code: 400,
        message: 'Cart is empty.'
      });
    }

    const orderItems = cart.items.map(item => ({
      product_id: item.product_id._id,
      quantity: item.quantity,
      price: item.product_id.price
    }));

    const totalPrice = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const order = new Order({
      user_id,
      address_id,
      items: orderItems,
      total_price: totalPrice
    });

    const savedOrder = await order.save();

    // Clear user cart
    cart.items = [];
    await cart.save();

    res.status(201).json({
      status: 'success',
      code: 201,
      message: 'Order placed successfully.',
      data: savedOrder
    });
  } catch (err) {
    res.status(400).json({
      status: 'error',
      code: 400,
      message: err.message
    });
  }
};

// 📜 Get Orders for User
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user_id: req.params.userId })
      .populate('items.product_id', 'name price image_url')
      .populate('address_id')
      .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      code: 200,
      message: 'Orders retrieved successfully.',
      data: orders
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      code: 500,
      message: err.message
    });
  }
};

// 🧾 Get Single Order
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product_id', 'name price image_url')
      .populate('address_id');

    if (!order) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'Order not found.'
      });
    }

    res.json({
      status: 'success',
      code: 200,
      message: 'Order details fetched successfully.',
      data: order
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      code: 500,
      message: err.message
    });
  }
};

// 🚚 Update Order Status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });

    if (!order) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'Order not found.'
      });
    }

    res.json({
      status: 'success',
      code: 200,
      message: 'Order status updated successfully.',
      data: order
    });
  } catch (err) {
    res.status(400).json({
      status: 'error',
      code: 400,
      message: err.message
    });
  }
};
