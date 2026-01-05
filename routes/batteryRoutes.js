const express = require("express");
const router = express.Router();
const controller = require("../controllers/batteryController");
const upload = require("../utils/multer");

router.post(
  "/create",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "thumbnails", maxCount: 5 }
  ]),
  controller.createBattery
);

module.exports = router;
