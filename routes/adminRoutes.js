const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");

router.post("/assignDeliveryBoy", adminController.assignDeliveryBoy);

module.exports = router;
