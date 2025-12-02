const express = require("express");
const router = express.Router();
const accessoryController = require("../controllers/accessoryController");

const { upload, handleUploadErrors } = require("../utils/upload");

router.post(
  "/",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "thumbnails", maxCount: 5 }
  ]),
  handleUploadErrors,
  accessoryController.createAccessory
);
router.get("/", accessoryController.getAccessories);
// If in controller you renamed to getAccessoriesByCategoryName
router.get("/category/:categoryName", accessoryController.getAccessoriesByCategoryName);
router.get("/:id", accessoryController.getAccessory);

router.put(
  "/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "thumbnails", maxCount: 5 }
  ]),
  handleUploadErrors,
  accessoryController.updateAccessory
);

router.delete("/:id", accessoryController.deleteAccessory);

module.exports = router;
