const express = require("express");
const router = express.Router();
const controller = require("../controllers/batteryCategoryController");

router.post("/create", controller.createCategory);
router.get("/all", controller.getAllCategories);
router.put("/:id", controller.updateCategory);
router.delete("/:id", controller.deleteCategory);

module.exports = router;
