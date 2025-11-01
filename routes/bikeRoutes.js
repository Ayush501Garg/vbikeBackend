const express = require("express");
const router = express.Router();
const auth = require('../middlewares/authMiddleware');

const { createBike, getBikes, getSingleBike, updateBike, deleteBike } = require("../controllers/bikeController");

router.post("/", createBike);
router.get("/",auth, getBikes);
router.get("/:id", getSingleBike);
router.put("/:id", updateBike);
router.delete("/:id", deleteBike);

module.exports = router;
