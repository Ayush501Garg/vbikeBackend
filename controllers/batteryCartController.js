const BatteryCart = require("../models/BatteryCart");
const Battery = require("../models/Battery");
const mongoose = require("mongoose");

/* ================= ADD TO CART ================= */
exports.addToCart = async (req, res) => {
  try {
    const { user_id, battery_id, quantity } = req.body;

    const userObjectId = new mongoose.Types.ObjectId(user_id);
    const batteryObjectId = new mongoose.Types.ObjectId(battery_id);

    const battery = await Battery.findById(batteryObjectId);
    if (!battery || !battery.is_active)
      return res.status(404).json({ success: false, message: "Battery not available" });

    let cartItem = await BatteryCart.findOne({
      user_id: userObjectId,
      battery_id: batteryObjectId
    });

    if (cartItem) {
      cartItem.quantity += quantity || 1;
      await cartItem.save();
    } else {
      cartItem = await BatteryCart.create({
        user_id: userObjectId,
        battery_id: batteryObjectId,
        quantity: quantity || 1,
        price: battery.price
      });
    }

    res.status(200).json({
      success: true,
      message: "Battery added to cart",
      data: cartItem
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ================= GET USER CART ================= */
exports.getUserCart = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.userId);

    const cart = await BatteryCart.find({ user_id: userId })
      .populate("battery_id", "name capacity price image_url");

    const totalAmount = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    res.status(200).json({
      success: true,
      count: cart.length,
      totalAmount,
      data: cart
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ================= UPDATE QUANTITY ================= */
exports.updateQuantity = async (req, res) => {
  try {
    const { quantity } = req.body;

    const cartItem = await BatteryCart.findByIdAndUpdate(
      req.params.cartId,
      { quantity },
      { new: true }
    );

    if (!cartItem)
      return res.status(404).json({ success: false, message: "Cart item not found" });

    res.status(200).json({
      success: true,
      message: "Quantity updated",
      data: cartItem
    });

  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/* ================= REMOVE FROM CART ================= */
exports.removeFromCart = async (req, res) => {
  try {
    const cartItem = await BatteryCart.findByIdAndDelete(req.params.cartId);

    if (!cartItem)
      return res.status(404).json({ success: false, message: "Cart item not found" });

    res.status(200).json({
      success: true,
      message: "Battery removed from cart"
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ================= CLEAR CART ================= */
exports.clearCart = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.userId);

    await BatteryCart.deleteMany({ user_id: userId });

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully"
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
