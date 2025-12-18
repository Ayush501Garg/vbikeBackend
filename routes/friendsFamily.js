const express = require("express");
const router = express.Router();
const multer = require("multer");
const friendsFamilyController = require("../controllers/friendsFamily");

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/create", upload.single("or_image"), friendsFamilyController.createFriendsFamily);

module.exports = router;
