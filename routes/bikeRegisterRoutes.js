const express = require("express");
const router = express.Router();
const bikeRegisterController = require("../controllers/bikeRegisterController");

router.post("/", bikeRegisterController.createBikeRegister);
router.get("/", bikeRegisterController.getBikeRegisters);
router.get("/:id", bikeRegisterController.getBikeRegisterById);
router.put("/:id", bikeRegisterController.updateBikeRegister);
router.delete("/:id", bikeRegisterController.deleteBikeRegister);

module.exports = router;
