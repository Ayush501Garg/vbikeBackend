const express = require("express");
const router = express.Router();

const upload = require("../middlewares/multer");
const {
  createFriendsFamily
} = require("../controllers/friendsFamily");

router.post(
  "/create",
  upload.single("or_image"),
  createFriendsFamily
);

module.exports = router;
