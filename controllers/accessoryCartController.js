const AccessoryCart = require("../models/AccessoryCart");
const Accessory = require("../models/accessory");
const mongoose = require("mongoose");

/* ================= ADD TO CART ================= */
exports.addToCart = async (req, res) => {
  try {
    const { user_id, accessory_id, quantity } = req.body;

    const userObjectId = new mongoose.Types.ObjectId(user_id);
    const accessoryObjectId = new mongoose.Types.ObjectId(accessory_id);

    const accessory = await Accessory.findById(accessoryObjectId);
    if (!accessory || !accessory.is_active)
      return res.status(404).json({
        success: false,
        message: "Accessory not available"
      });

    let cartItem = await AccessoryCart.findOne({
      user_id: userObjectId,
      accessory_id: accessoryObjectId
    });

    if (cartItem) {
      cartItem.quantity += quantity || 1;
      await cartItem.save();
    } else {
      cartItem = await AccessoryCart.create({
        user_id: userObjectId,
        accessory_id: accessoryObjectId,
        quantity: quantity || 1,
        price: accessory.price
      });
    }

    res.status(200).json({
      success: true,
      message: "Accessory added to cart",
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

    const cart = await AccessoryCart.find({ user_id: userId })
      .populate("accessory_id", "name price image_url category");

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

    if (quantity < 1)
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1"
      });

    const cartItem = await AccessoryCart.findByIdAndUpdate(
      req.params.cartId,
      { quantity },
      { new: true }
    );

    if (!cartItem)
      return res.status(404).json({
        success: false,
        message: "Cart item not found"
      });

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
    const cartItem = await AccessoryCart.findByIdAndDelete(req.params.cartId);

    if (!cartItem)
      return res.status(404).json({
        success: false,
        message: "Cart item not found"
      });

    res.status(200).json({
      success: true,
      message: "Accessory removed from cart"
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ================= CLEAR CART ================= */
exports.clearCart = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.userId);

    await AccessoryCart.deleteMany({ user_id: userId });

    res.status(200).json({
      success: true,
      message: "Accessory cart cleared successfully"
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
