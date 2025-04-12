const express = require("express");
const {
    loginDeliveryBoy,
    getDeliveryBoyProfile,
    getDeliveryBoyDashboard,
    getDeliveryBoyOrders,
    markAsDelivered
} = require("../controllers/deliveryBoyController");
const deliveryBoyAuthMiddleware = require("../middlewares/deliveryBoyAuthMiddleware");

const router = express.Router();

router.post("/login", loginDeliveryBoy);
router.get("/getMyProfile", deliveryBoyAuthMiddleware, getDeliveryBoyProfile);
router.get("/dashboard", deliveryBoyAuthMiddleware, getDeliveryBoyDashboard);
router.get("/getMyOrderlist", deliveryBoyAuthMiddleware, getDeliveryBoyOrders);
router.patch("/markAsDelivered/:id", deliveryBoyAuthMiddleware, markAsDelivered);

module.exports = router;
