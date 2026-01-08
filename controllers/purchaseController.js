const Battery = require("../models/Battery");
const Accessory = require("../models/accessory");
const Purchase = require("../models/Purchase");

exports.initiatePurchase = async (req, res) => {
  try {
    const { products } = req.body;

    if (!products || products.length === 0) {
      return res.status(400).json({ message: "Products are required" });
    }

    let finalAmount = 0;
    let purchaseItems = [];

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
        return res.status(400).json({ message: "Invalid product type" });
      }

      if (!productData) {
        return res.status(404).json({ message: "Product not found" });
      }

      const quantity = item.qty || 1;

      if (productData.available_stock < quantity) {
        return res.status(400).json({ message: "Stock not available" });
      }

      const total = productData.price * quantity;
      finalAmount += total;

      purchaseItems.push({
        reference_id: productData._id,
        reference_type: item.reference_type,
        title: productData.name,
        qty: quantity,
        price_per_unit: productData.price,
        line_total: total
      });
    }

    const purchase = await Purchase.create({
      purchase_code: `PUR-${Date.now()}`,
      products: purchaseItems,
      grand_total: finalAmount
    });

    res.status(201).json({
      success: true,
      message: "Purchase initiated (dummy payment)",
      purchase_id: purchase._id,
      purchase_code: purchase.purchase_code,
      payable_amount: finalAmount
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Purchase initiation failed" });
  }
};

// Dummy Payment Confirmation
exports.confirmPurchasePayment = async (req, res) => {
  const { purchase_id } = req.body;

  const purchase = await Purchase.findById(purchase_id);
  if (!purchase) {
    return res.status(404).json({ message: "Purchase not found" });
  }

  purchase.payment_info.state = "success";
  purchase.purchase_status = "completed";
  await purchase.save();

  res.json({
    success: true,
    message: "Payment confirmed (dummy)"
  });
};
