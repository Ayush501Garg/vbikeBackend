const express = require("express");
const router = express.Router();
const couponController = require("../controllers/couponController");

/* ===== ADMIN ROUTES ===== */
router.post("/create", couponController.createCoupon);
router.get("/all", couponController.getAllCoupons);
router.get("/:id", couponController.getCouponById);
router.put("/:id", couponController.updateCoupon);
router.delete("/:id", couponController.deleteCoupon);

/* ===== USER ROUTE ===== */
router.post("/apply", couponController.applyCoupon);

module.exports = router;
