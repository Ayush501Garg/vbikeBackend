const express = require("express");
const router = express.Router();

const {
  initiatePurchase,
  confirmPurchasePayment
} = require("../controllers/purchaseController");

router.post("/purchase/initiate", initiatePurchase);
router.post("/purchase/confirm-payment", confirmPurchasePayment);

module.exports = router;
