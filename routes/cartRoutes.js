const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const verifyToken = require("../middlewares/authMiddleware"); // Import middleware

router.post("/addProduct", verifyToken, cartController.addProductToCart);
router.post("/updateCart", verifyToken, cartController.updateCartProduct);
router.get("/showMyCart", verifyToken, cartController.showMyCart);
router.delete("/decreaseQTY/:id", verifyToken, cartController.removeCartProduct);
router.delete("/increaseQTY/:id", verifyToken, cartController.increaseCartProduct);
router.delete("/removeProduct/:id", verifyToken, cartController.removeParticularCartProduct);

module.exports = router;
