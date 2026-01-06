const Coupon = require("../models/Coupon");
const CouponUsage = require("../models/CouponUsage");

/* ================= CREATE COUPON (ADMIN) ================= */
exports.createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      data: coupon
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/* ================= GET ALL COUPONS ================= */
exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: coupons.length,
      data: coupons
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ================= GET SINGLE COUPON ================= */
exports.getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon)
      return res.status(404).json({ message: "Coupon not found" });

    res.status(200).json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ================= UPDATE COUPON ================= */
exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!coupon)
      return res.status(404).json({ message: "Coupon not found" });

    res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      data: coupon
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/* ================= DELETE COUPON ================= */
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon)
      return res.status(404).json({ message: "Coupon not found" });

    // Optional: delete usage records
    await CouponUsage.deleteMany({ couponId: coupon._id });

    res.status(200).json({
      success: true,
      message: "Coupon deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ================= APPLY COUPON ================= */
exports.applyCoupon = async (req, res) => {
  try {
    const { userId, couponCode, rideAmount } = req.body;

    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (!coupon || !coupon.isActive)
      return res.status(400).json({ message: "Invalid coupon" });

    if (coupon.expiryDate < new Date())
      return res.status(400).json({ message: "Coupon expired" });

    if (coupon.usedCount >= coupon.maxUses)
      return res.status(400).json({ message: "Coupon limit exceeded" });

    if (rideAmount < coupon.minRideAmount)
      return res.status(400).json({ message: "Minimum ride amount not met" });

    let usage = await CouponUsage.findOne({
      userId,
      couponId: coupon._id
    });

    if (usage && usage.usedCount >= coupon.perUserLimit)
      return res.status(400).json({ message: "Coupon already used" });

    let discount = coupon.discountType === "percentage"
      ? (rideAmount * coupon.discountValue) / 100
      : coupon.discountValue;

    coupon.usedCount += 1;
    await coupon.save();

    if (!usage) {
      await CouponUsage.create({
        userId,
        couponId: coupon._id,
        usedCount: 1
      });
    } else {
      usage.usedCount += 1;
      await usage.save();
    }

    res.status(200).json({
      success: true,
      message: "Coupon applied successfully",
      discount,
      finalAmount: rideAmount - discount
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
