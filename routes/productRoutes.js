const express = require("express");
const upload = require("../middlewares/upload"); 
const { addProduct, getAllProducts, getProductById, updateProduct, deleteProduct, getAvailableForSell,getProductsByCategory } = require("../controllers/productController");

const router = express.Router();

router.post("/add", upload.single("productMainImage"), addProduct);
router.get("/all", getAllProducts);
router.get("/:id", getProductById);
router.put("/update/:id", upload.single("productMainImage"), updateProduct);
router.delete("/delete/:id", deleteProduct);
router.get("/category/:categoryId", getProductsByCategory);





// Fix: Add this route after defining getAvailableForSell
router.get("/availableForSell", getAvailableForSell);

module.exports = router;
