const express = require("express");
const router = express.Router();
const controller = require("../controllers/vendorServiceSlotController");

/* CREATE */
router.post("/create", controller.createSlot);

/* GET */
router.get("/:vendorId", controller.getVendorSlot);

/* UPDATE */
router.put("/update/:vendorId", controller.updateSlot);

/* DELETE */
router.delete("/:vendorId", controller.deleteVendorSlot);

module.exports = router;
