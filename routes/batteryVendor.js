const express = require("express");
const controller = require("../controllers/batteryVendor");

const router = express.Router();

router.post("/", controller.createBatteryVendor);
router.get("/", controller.getBatteryVendors);
router.post("/inventory/add", controller.addBatteryToInventory);
router.put("/inventory/update", controller.updateBatteryInventory);
router.delete("/inventory/remove", controller.removeBatteryFromInventory);
router.get("/nearby", controller.getNearbyBatteryVendors);

module.exports = router;
