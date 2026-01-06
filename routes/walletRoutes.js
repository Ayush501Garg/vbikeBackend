const express = require("express");
const router = express.Router();
const walletController = require("../controllers/walletController");

// Auto-create wallet & fetch
router.get("/:userId", walletController.getWallet);

// Add points
router.post("/add", walletController.addPoints);

// Spend points
router.post("/spend", walletController.spendPoints);

// Update manually
router.put("/update/:userId", walletController.updateWallet);

// Delete wallet
router.delete("/delete/:userId", walletController.deleteWallet);

module.exports = router;
