const express = require("express");
const router = express.Router();
const featuredCtrl = require("../controllers/featuredOfferController");

const { upload, handleUploadErrors } = require("../utils/upload");

// CREATE
router.post(
  "/",
  upload.fields([{ name: "image", maxCount: 1 }]),
  handleUploadErrors,
  featuredCtrl.createOffer
);

// GET ALL
router.get("/", featuredCtrl.getOffers);

// GET SINGLE
router.get("/:id", featuredCtrl.getOffer);

// UPDATE
router.put(
  "/:id",
  upload.fields([{ name: "image", maxCount: 1 }]),
  handleUploadErrors,
  featuredCtrl.updateOffer
);

// DELETE
router.delete("/:id", featuredCtrl.deleteOffer);

module.exports = router;
