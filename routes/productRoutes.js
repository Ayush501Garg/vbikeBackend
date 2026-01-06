const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

const { upload, handleUploadErrors } = require("../utils/upload");

router.post(
  "/",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "thumbnails", maxCount: 5 }
  ]),
  handleUploadErrors,
  productController.createProduct
);

router.get("/", productController.getProducts);
router.get("/:id", productController.getProduct);

router.put(
  "/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "thumbnails", maxCount: 5 }
  ]),
  handleUploadErrors,
  productController.updateProduct
);

router.delete("/:id", productController.deleteProduct);

module.exports = router;
