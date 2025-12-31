const express = require("express");
const router = express.Router();
const controller = require("../controllers/batteryController");

router.post("/create", controller.createBattery);
router.get("/all", controller.getAllBatteries);
router.get("/:id", controller.getBatteryById);
router.put("/:id", controller.updateBattery);
router.delete("/:id", controller.deleteBattery);

module.exports = router;
