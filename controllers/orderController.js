const Order = require("../models/orderModel");

// ✅ Create COD Order
exports.createCODOrder = async (req, res) => {
  try {
    const { user_id, address_id, items, total_price } = req.body;

    console.log("🛒 Creating COD Order for User:", user_id);

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

    console.log("✅ COD Order Created:", order._id);

    return res.status(201).json({
      status: "success",
      code: 201,
      message: "COD order created successfully.",
      data: {
        order_id: order._id,
        payment_method: order.payment_method,
        total_price: order.total_price,
        order_status: order.order_status,
      },
    });
  } catch (error) {
    console.error("❌ createCODOrder Error:", error);
    return res.status(500).json({
      status: "error",
      code: 500,
      message: "Failed to create COD order.",
      error: error.message,
    });
  }
};

// ✅ Get All Orders for a User
exports.getOrdersByUser = async (req, res) => {
  try {
    console.log("📦 Fetching orders for user:", req.params.userId);

    const orders = await Order.find({ user_id: req.params.userId })
      .populate("items.product_id", "name price imageUrl")
      .populate("address_id");

    if (!orders || orders.length === 0) {
      return res.status(404).json({
        status: "success",
        code: 404,
        message: "No orders found for this user.",
        data: [],
      });
    }

    return res.status(200).json({
      status: "success",
      code: 200,
      message: "Orders retrieved successfully.",
      data: orders,
    });
  } catch (error) {
    console.error("❌ getOrdersByUser Error:", error);
    return res.status(500).json({
      status: "error",
      code: 500,
      message: "Server error while fetching user orders.",
      error: error.message,
    });
  }
};
