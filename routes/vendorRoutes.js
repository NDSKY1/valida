const express = require("express");
const { 
    registerVendor, 
    verifyOtp, 
    loginVendor, 
    getProfile, 
    changePassword, 
    forgotPassword,            // New: Forgot Password API
    forgotPasswordVerifyOtp,
    updateAddress   // Existing: OTP Verification for Forgot Password
} = require("../controllers/vendorController");

const verifyToken = require("../middlewares/authMiddleware"); // Import middleware

const router = express.Router();

// Public Routes (No Authentication Required)
router.post("/registration", registerVendor);
router.post("/registrationOtpVerification", verifyOtp);
router.post("/login", loginVendor);
router.post("/forgotPassword", forgotPassword);               
router.post("/forgotPasswordOTPVerification", forgotPasswordVerifyOtp); 

// Protected Routes (Authentication Required)
router.get("/getProfile", verifyToken, getProfile);
router.post("/changePassword", verifyToken, changePassword);
router.post("/updateAddress", verifyToken, updateAddress);


module.exports = router;
