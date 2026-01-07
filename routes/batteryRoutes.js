const express = require("express");
const router = express.Router();
const controller = require("../controllers/batteryController");
const upload = require("../utils/multer");

// CREATE BATTERY
router.post(
  "/create",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "thumbnails", maxCount: 5 }
  ]),
  controller.createBattery
);

// UPDATE BATTERY
router.put(
  "/update/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "thumbnails", maxCount: 5 }
  ]),
  controller.updateBattery
);

// com
// GET ALL BATTERIES
router.get(
  "/all",
  controller.getAllBatteries
);

// GET SINGLE BATTERY BY ID
router.get(
  "/:id",
  controller.getBatteryById
);

// DELETE BATTERY
router.delete(
  "/delete/:id",
  controller.deleteBattery
);

module.exports = router;
