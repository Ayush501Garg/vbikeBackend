const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/orderModel");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Step 1: Initiate Razorpay Order
// controllers/paymentController.js

exports.initiatePayment = async (req, res) => {
  try {
    const { user_id, address_id, amount } = req.body;
    console.log("🧾 Initiating payment:", req.body);

    const maxAmount = 500000; // ₹5 lakh
    if (amount > maxAmount) {
      return res.status(400).json({
        status: "error",
        code: 400,
        message: `Amount exceeds Razorpay limit of ₹${maxAmount}. Please split your payment.`,
      });
    }

    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

   return res.status(200).json({
  status: "success",
  code: 200,
  message: "Payment initiated successfully.",
  data: {
    key: process.env.RAZORPAY_KEY_ID,
    razorpay_order_id: order.id,
    amount: amount,
  },
});
  } catch (error) {
    console.error("💥 initiatePayment Error:", error);
    return res.status(500).json({
      status: "error",
      code: 500,
      message: "Failed to initiate payment.",
      error: error.message,
    });
  }
};



// ✅ Step 2: Verify Payment & Create Order
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      user_id,
      address_id,
      items,
      total_price,
    } = req.body;

    console.log("🧾 Verifying Razorpay payment for order:", razorpay_order_id);

    // 🔐 Generate signature to verify authenticity
    const generatedSig = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSig !== razorpay_signature) {
      console.log("⚠️ Payment verification failed: Invalid signature");
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "Invalid payment signature.",
      });
    }

    // ✅ Save verified order
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
    console.log("✅ Payment verified and order saved:", newOrder._id);

    return res.status(201).json({
      status: "success",
      code: 201,
      message: "Payment verified and order created successfully.",
      data: {
        order_id: newOrder._id,
        payment_method: newOrder.payment_method,
        total_price: newOrder.total_price,
        payment_status: newOrder.payment_status,
      },
    });
  } catch (error) {
    console.error("❌ verifyPayment Error:", error);
    return res.status(500).json({
      status: "error",
      code: 500,
      message: "Payment verification failed.",
      error: error.message,
    });
  }
};
