const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

// Create a payment entry
router.post("/create", paymentController.createPayment);

// Get all payments with filtering, pagination, and status
router.get("/myList", paymentController.getAllPayments);

module.exports = router;
