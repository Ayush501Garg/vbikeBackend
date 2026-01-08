const Battery = require("../models/Battery");
const Accessory = require("../models/accessory");
const Purchase = require("../models/Purchase");

/**
 * =========================
 * INITIATE PURCHASE
 * =========================
 */
exports.initiatePurchase = async (req, res) => {
  try {
    const { user_id, products } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    if (!products || products.length === 0) {
      return res.status(400).json({ message: "Products are required" });
    }

    let purchaseItems = [];
    let finalAmount = 0;

    for (const item of products) {
      let productData;

      if (item.reference_type === "battery") {
        productData = await Battery.findOne({
          _id: item.reference_id,
          is_active: true
        });
      } 
      else if (item.reference_type === "accessory") {
        productData = await Accessory.findOne({
          _id: item.reference_id,
          is_active: true
        });
      } 
      else {
        return res.status(400).json({ message: "Invalid reference type" });
      }

      if (!productData) {
        return res.status(404).json({ message: "Product not found" });
      }

      const qty = item.qty || 1;

      if (productData.available_stock < qty) {
        return res.status(400).json({
          message: `Insufficient stock for ${productData.name}`
        });
      }

      const lineTotal = productData.price * qty;
      finalAmount += lineTotal;

      purchaseItems.push({
        reference_id: productData._id,
        reference_type: item.reference_type,
        title: productData.name,
        qty: qty,
        price_per_unit: productData.price,
        line_total: lineTotal
      });
    }

    const purchase = await Purchase.create({
      purchase_code: `PUR-${Date.now()}`,
      user_id,
      products: purchaseItems,
      grand_total: finalAmount
    });

    res.status(201).json({
      success: true,
      message: "Purchase initiated (dummy payment)",
      purchase_id: purchase._id,
      purchase_code: purchase.purchase_code,
      grand_total: finalAmount
    });

  } catch (error) {
    console.error("Initiate Purchase Error:", error);
    res.status(500).json({ message: "Purchase initiation failed" });
  }
};

/**
 * =========================
 * CONFIRM DUMMY PAYMENT
 * =========================
 */
exports.confirmPurchasePayment = async (req, res) => {
  try {
    const { purchase_id, reference_no } = req.body;

    if (!purchase_id) {
      return res.status(400).json({ message: "Purchase ID is required" });
    }

    const purchase = await Purchase.findById(purchase_id);

    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    purchase.payment_info.state = "success";
    purchase.payment_info.reference_no = reference_no || `DUMMY-${Date.now()}`;
    purchase.purchase_status = "completed";

    await purchase.save();

    res.json({
      success: true,
      message: "Payment confirmed (dummy)",
      purchase_id: purchase._id
    });

  } catch (error) {
    console.error("Confirm Payment Error:", error);
    res.status(500).json({ message: "Payment confirmation failed" });
  }
};

/**
 * =========================
 * FETCH PURCHASES BY USER
 * =========================
 */
exports.getPurchasesByUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const purchases = await Purchase.find({ user_id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: purchases.length,
      purchases
    });

  } catch (error) {
    console.error("Fetch Purchases Error:", error);
    res.status(500).json({ message: "Failed to fetch purchases" });
  }
};
