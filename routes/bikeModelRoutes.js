const express = require("express");
const router = express.Router();
const { createModel, getModels, getSingleModel, updateModel, deleteModel } = require("../controllers/bikeModelController");

router.post("/", createModel);
router.get("/", getModels);
router.get("/:id", getSingleModel);
router.put("/:id", updateModel);
router.delete("/:id", deleteModel);

module.exports = router;
