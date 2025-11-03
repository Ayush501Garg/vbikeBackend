const Order = require("../models/orderModel");

// ✅ Create COD Order
exports.createCODOrder = async (req, res) => {
  try {
    const { user_id, address_id, items, total_price } = req.body;

    const order = new Order({
      user_id,
      address_id,
      items,
      total_price,
      payment_method: "COD",
      payment_status: "Unpaid",
      order_status: "Pending",
    });

    await order.save();
    res.status(201).json({ success: true, order_id: order._id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get All Orders for a User
exports.getOrdersByUser = async (req, res) => {
  try {
    const orders = await Order.find({ user_id: req.params.userId })
      .populate("items.product_id", "name price imageUrl")
      .populate("address_id");
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
