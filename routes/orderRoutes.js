const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController"); // Import controller
const verifyToken = require("../middlewares/authMiddleware"); // Import middleware

// ✅ Order routes
router.post("/create", verifyToken, orderController.createOrder);
router.get("/myOrderList", verifyToken, orderController.getUserOrders);

router.post("/updateOrderStatus", orderController.updateOrderStatus);
router.get("/allOrders", orderController.getAllOrdersForAdmin); 

router.get("/cancelledOrders", orderController.getAllCancelledOrders);



module.exports = router;


