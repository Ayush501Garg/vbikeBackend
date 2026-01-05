const express = require("express");
const router = express.Router();
const controller = require("../controllers/batteryController");
const { upload, handleUploadErrors } = require("../utils/upload");

router.post(
  "/create",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "thumbnails", maxCount: 5 }
  ]),
  handleUploadErrors,
  controller.createBattery
);

router.put(
  "/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "thumbnails", maxCount: 5 }
  ]),
  handleUploadErrors,
  controller.updateBattery
);

router.get("/all", controller.getAllBatteries);
router.get("/:id", controller.getBatteryById);
router.delete("/:id", controller.deleteBattery);

module.exports = router;
