const express = require("express");
const router = express.Router();
const controller = require("../controllers/accessoryCartController");

router.post("/add", controller.addToCart);
router.get("/user/:userId", controller.getUserCart);
router.put("/update/:cartId", controller.updateQuantity);
router.delete("/remove/:cartId", controller.removeFromCart);
router.delete("/clear/:userId", controller.clearCart);

module.exports = router;
