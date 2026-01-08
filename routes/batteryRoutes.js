const express = require("express");
const router = express.Router();
const controller = require("../controllers/batteryController");
const upload = require("../utils/multer");

<<<<<<< HEAD
// CREATE BATTERY
=======
>>>>>>> c737960e32e3da80169a71b40a9512c0a89a6b6a
router.post(
  "/create",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "thumbnails", maxCount: 5 }
  ]),
  controller.createBattery
);

<<<<<<< HEAD
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

=======
>>>>>>> c737960e32e3da80169a71b40a9512c0a89a6b6a
module.exports = router;
