// routes/purchaseRoutes.js
const express = require("express");
const router = express.Router();

const {
  initiatePurchase,
  confirmPurchasePayment,
  getPurchasesByUser
} = require("../controllers/purchaseController");

router.post("/purchase/initiate", initiatePurchase);
router.post("/purchase/confirm-payment", confirmPurchasePayment);
router.get("/purchase/user/:user_id", getPurchasesByUser);

module.exports = router;
