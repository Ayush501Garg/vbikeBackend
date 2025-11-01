const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");

// Add / Update item
router.post("/add", cartController.addToCart);

// Get user's cart
router.get("/:user_id", cartController.getUserCart);

// Update quantity
router.patch("/update", cartController.updateQuantity);

// Remove item
router.delete("/remove", cartController.removeItem);

// Clear entire cart
router.delete("/clear/:user_id", cartController.clearCart);

module.exports = router;
