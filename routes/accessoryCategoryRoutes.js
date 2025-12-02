const express = require("express");
const router = express.Router();
const controller = require("../controllers/accessoryCategoryController");

router.post("/", controller.createCategory);
router.get("/", controller.getCategories);
router.delete("/:id", controller.deleteCategory);

module.exports = router;
