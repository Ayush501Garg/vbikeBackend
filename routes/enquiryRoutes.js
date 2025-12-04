const express = require("express");
const router = express.Router();
const enquiryController = require("../controllers/enquiryController");

// Create
router.post("/", enquiryController.createEnquiry);

// Get All
router.get("/", enquiryController.getEnquiries);

// Get One
router.get("/:id", enquiryController.getEnquiry);

// Update
router.put("/:id", enquiryController.updateEnquiry);

// Delete
router.delete("/:id", enquiryController.deleteEnquiry);

module.exports = router;
