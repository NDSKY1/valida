const express = require("express");
const upload = require("../middlewares/upload"); 
const { addProduct, getAllProducts, getProductById, updateProduct, deleteProduct, getAvailableForSell,getProductsByCategory } = require("../controllers/productController");

const router = express.Router();

router.get("/all", getAllProducts);
router.get("/:id", getProductById);
router.delete("/delete/:id", deleteProduct);



router.get("/category/:categoryId", getProductsByCategory);

router.post(
  "/addproducts",
  upload.fields([
    { name: "productMainImage", maxCount: 1 },
    { name: "productOtherImages", maxCount: 5 },
  ]),
  addProduct
);

// Update product
router.put(
  "/updateproducts/:id",
  upload.fields([
    { name: "productMainImage", maxCount: 1 },
    { name: "productOtherImages", maxCount: 5 },
  ]),
  updateProduct
);
// Delete product
router.delete("/deleteproducts/:id", deleteProduct);




// Fix: Add this route after defining getAvailableForSell
router.get("/availableForSell", getAvailableForSell);

module.exports = router;
