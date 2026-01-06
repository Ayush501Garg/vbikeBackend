const express = require("express");
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { createType, getTypes, updateType, deleteType } = require("../controllers/bikeTypeController");

router.post("/", createType);
router.get("/", getTypes);
router.put("/:id", updateType);
router.delete("/:id", deleteType);

module.exports = router;
