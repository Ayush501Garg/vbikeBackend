const express = require("express");
const { createCODOrder, getOrdersByUser } = require("../controllers/orderController");
const router = express.Router();

router.post("/create", createCODOrder);
router.get("/user/:userId", getOrdersByUser);

module.exports = router;
