const express = require("express");
const {
    loginDeliveryBoy,
    getDeliveryBoyProfile,
    getDeliveryBoyDashboard,
    getDeliveryBoyOrders,
    markAsDelivered,
    getAllDeliveryBoys,
    updateDeliveryBoyStatus,
    assignDeliveryBoy,
    getActiveDeliveryBoys
} = require("../controllers/deliveryBoyController");
const deliveryBoyAuthMiddleware = require("../middlewares/deliveryBoyAuthMiddleware");

const router = express.Router();

router.post("/login", loginDeliveryBoy);
router.get("/getMyProfile", deliveryBoyAuthMiddleware, getDeliveryBoyProfile);
router.get("/dashboard", deliveryBoyAuthMiddleware, getDeliveryBoyDashboard);
router.get("/getMyOrderlist", deliveryBoyAuthMiddleware, getDeliveryBoyOrders);
router.patch("/markAsDelivered/:id", deliveryBoyAuthMiddleware, markAsDelivered);

router.get("/getalldeliveryBoys", getAllDeliveryBoys );
router.post("/updateDeliveryBoyStatus", updateDeliveryBoyStatus);
router.get("/getactivedeliveryboys", getActiveDeliveryBoys);
router.post("/assignDeliveryBoy", assignDeliveryBoy);




module.exports = router;
