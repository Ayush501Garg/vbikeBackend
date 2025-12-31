const express = require("express");
const router = express.Router();
const controller = require("../controllers/accessoryWishlistController");

router.post("/add", controller.addToWishlist);
router.get("/user/:userId", controller.getUserWishlist);
router.delete("/remove/:wishlistId", controller.removeFromWishlist);
router.delete("/clear/:userId", controller.clearWishlist);

module.exports = router;
