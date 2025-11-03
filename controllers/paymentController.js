const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/orderModel");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Step 1: Initiate Razorpay Order
exports.initiatePayment = async (req, res) => {
  try {
    const { user_id, address_id, items, amount } = req.body;

    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      razorpay_order_id: order.id,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Step 2: Verify Payment & Create Order
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, user_id, address_id, items, total_price } = req.body;

    const generatedSig = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSig !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    const newOrder = new Order({
      user_id,
      address_id,
      items,
      total_price,
      payment_method: "Razorpay",
      payment_status: "Paid",
      order_status: "Pending",
      razorpay_order_id,
      razorpay_payment_id,
    });

    await newOrder.save();
    res.json({ success: true, order_id: newOrder._id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
