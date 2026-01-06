const Cart = require("../models/Cart");

// Helper to build live image URLs
const getLiveUrl = (req, filename) =>
  filename ? `${req.protocol}://${req.get("host")}/${filename.replace(/^\/+/, "")}` : null;
const getLiveUrls = (req, files) =>
  files && files.length > 0 ? files.map((f) => getLiveUrl(req, f)) : [];

// 🛒 Add or Update item in cart
exports.addToCart = async (req, res) => {
  try {
    const { user_id, product_id, quantity } = req.body;

    if (!user_id || !product_id)
      return res.status(400).json({
        status: "error",
        message: "user_id and product_id are required",
      });

    const qty = quantity && quantity > 0 ? quantity : 1;
    let cart = await Cart.findOne({ user_id });

    if (!cart) {
      cart = await Cart.create({
        user_id,
        items: [{ product_id, quantity: qty }],
      });
    } else {
      const itemIndex = cart.items.findIndex(
        (item) => item.product_id.toString() === product_id
      );

      if (itemIndex >= 0) {
        cart.items[itemIndex].quantity += qty;
      } else {
        cart.items.push({ product_id, quantity: qty });
      }

      await cart.save();
    }

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Product added to cart successfully.",
      data: cart,
    });
  } catch (error) {
    console.error("❌ addToCart Error:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// 🛍️ Get user's full cart with populated products
exports.getUserCart = async (req, res) => {
  try {
    const { user_id } = req.params;

    const cart = await Cart.findOne({ user_id }).populate("items.product_id");
    if (!cart || cart.items.length === 0) {
      return res.status(200).json({
        status: "success",
        code: 200,
        message: "Cart is empty.",
        data: [],
      });
    }

    const formattedItems = cart.items.map((item) => {
      const product = item.product_id ? item.product_id.toObject() : null;
      if (product) {
        product.image_url = getLiveUrl(req, product.image_url);
        product.thumbnails = getLiveUrls(req, product.thumbnails);
      }
      return {
        product,
        quantity: item.quantity,
      };
    });

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Cart retrieved successfully.",
      data: formattedItems,
    });
  } catch (error) {
    console.error("❌ getUserCart Error:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// ✏️ Update item quantity
exports.updateQuantity = async (req, res) => {
  try {
    const { user_id, product_id, quantity } = req.body;

    if (!user_id || !product_id || !quantity)
      return res.status(400).json({
        status: "error",
        message: "user_id, product_id, and quantity are required",
      });

    const cart = await Cart.findOne({ user_id });
    if (!cart) return res.status(404).json({ status: "error", message: "Cart not found" });

    const item = cart.items.find(
      (i) => i.product_id.toString() === product_id
    );

    if (!item)
      return res.status(404).json({ status: "error", message: "Item not found in cart" });

    item.quantity = quantity;
    await cart.save();

    res.status(200).json({
      status: "success",
      message: "Quantity updated successfully.",
      data: cart,
    });
  } catch (error) {
    console.error("❌ updateQuantity Error:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// 🗑️ Remove single item
exports.removeItem = async (req, res) => {
  try {
    const { user_id, product_id } = req.body;

    const cart = await Cart.findOne({ user_id });
    if (!cart) return res.status(404).json({ status: "error", message: "Cart not found" });

    cart.items = cart.items.filter(
      (i) => i.product_id.toString() !== product_id
    );
    await cart.save();

    res.status(200).json({
      status: "success",
      message: "Item removed from cart.",
      data: cart,
    });
  } catch (error) {
    console.error("❌ removeItem Error:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// 🧹 Clear entire cart
exports.clearCart = async (req, res) => {
  try {
    const { user_id } = req.params;

    const cart = await Cart.findOne({ user_id });
    if (!cart)
      return res.status(404).json({ status: "error", message: "Cart not found" });

    cart.items = [];
    await cart.save();

    res.status(200).json({
      status: "success",
      message: "Cart cleared successfully.",
    });
  } catch (error) {
    console.error("❌ clearCart Error:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};
