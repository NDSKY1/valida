const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

// Secret key for JWT
const SECRET_KEY = process.env.JWT_SECRET;

const sendOtp = require("../utils/sendOtp");
const { readFileSafely, writeFileSafely } = require("../utils/fileUtils");


// Path to users.json file
const usersFilePath = path.join(__dirname, "../models/users.json");

// Read users.json safely
const readUsersFile = () => {
    try {
        if (!fs.existsSync(usersFilePath)) {
            fs.writeFileSync(usersFilePath, "[]", "utf8"); // Create if missing
        }
        let data = fs.readFileSync(usersFilePath, "utf8");
        return JSON.parse(data || "[]"); // Ensure valid JSON
    } catch (error) {
        console.error("Error reading users.json:", error);
        return [];
    }
};

// Write users.json safely
const writeUsersFile = (data) => {
    try {
        fs.writeFileSync(usersFilePath, JSON.stringify(data, null, 2), "utf8");
    } catch (error) {
        console.error("Error writing to users.json:", error);
    }
};

// Vendor Registration API
const registerVendor = (req, res) => {
    try {
        console.log("Received Request Body:", req.body);

        const { vendorName, shopName, mobile, password, gstNo, shopNo, address, landmark, city, state, pinCode, salesman } = req.body;
        
        // Required fields validation
        if (!vendorName || !shopName || !mobile || !password || !address || !city || !state || !pinCode) {
            return res.status(400).json({ status: 400, message: "Missing required fields" });
        }

        // Mobile number validation (10 digits, numeric)
        const mobileRegex = /^[6-9]\d{9}$/;
        if (!mobileRegex.test(mobile)) {
            return res.status(400).json({ status: 400, message: "Invalid mobile number" });
        }

        // Pincode validation (6 digits, numeric)
        const pinCodeRegex = /^[1-9][0-9]{5}$/;
        if (!pinCodeRegex.test(pinCode)) {
            return res.status(400).json({ status: 400, message: "Invalid pin code" });
        }

        let users = readUsersFile();
        
        // Check if vendor already exists
        if (users.find((user) => user.mobile === mobile)) {
            return res.status(409).json({ status: 409, message: "Vendor already registered" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const newVendor = {
            id: users.length + 1,
            vendorName,
            shopName,
            mobile,
            password,
            gstNo,
            shopNo,
            address,
            landmark,
            city,
            state,
            pinCode,
            salesman,
            otp,
            verified: false,
            pendingOrders: 0,
            acceptedOrders: 0,
            cancelledOrders: 0,
            outOfDeliveryOrders: 0,
            deliveredOrders: 0
        };

        sendOtp(mobile, otp);
        users.push(newVendor);
        writeUsersFile(users);

        res.status(201).json({ status: 201, message: "OTP sent to registered mobile number", mobile });
    } catch (error) {
        console.error("Error in registerVendor:", error);
        res.status(500).json({ status: 500, message: "Internal server error" });
    }
};

// OTP Verification API
const verifyOtp = (req, res) => {
    try {
        let users = readUsersFile();
        const { mobile, otp } = req.body;

        if (!mobile || !otp) {
            return res.status(400).json({ status: 400, message: "Mobile number and OTP required" });
        }

        const vendorIndex = users.findIndex((user) => user.mobile === mobile);
        if (vendorIndex === -1) {
            return res.status(404).json({ status: 404, message: "Vendor not found" });
        }

        const vendor = users[vendorIndex];

        if (vendor.otp !== otp) {
            return res.status(401).json({ status: 401, message: "Invalid OTP" });
        }

        users[vendorIndex].verified = true;
        users[vendorIndex].otp = null;
        writeUsersFile(users);

        res.status(200).json({ status: 200, message: "Vendor verified successfully" });
    } catch (error) {
        console.error("Error in verifyOtp:", error);
        res.status(500).json({ status: 500, message: "Internal server error" });
    }
};

// Vendor Login API
const loginVendor = (req, res) => {
    try {
        let users = readUsersFile();
        const { mobile, password } = req.body;

        if (!mobile || !password) {
            return res.status(400).json({ status: 400, message: "Mobile number and password required" });
        }

        // Find the vendor by mobile number
        const vendor = users.find((user) => user.mobile === mobile);

        if (!vendor) {
            return res.status(404).json({ status: 404, message: "Vendor not found" });
        }

        // Check if password matches
        if (vendor.password !== password) {
            return res.status(404).json({ status: 404, message: "Invalid password" });
        }

        // Check if vendor is verified
        if (!vendor.verified) {
            return res.status(403).json({ status: 403, message: "Vendor not verified. Please verify OTP." });
        }

        // Generate JWT Token
        const token = jwt.sign({ mobile: vendor.mobile, id: vendor.id }, SECRET_KEY, { expiresIn: "30d" });

        // Ensure response matches Flutter model
        res.status(200).json({
            status: 200,
            message: "Login successful",
            data: {
                token: token,
                vendorName: vendor.vendorName,
                mobile: vendor.mobile,
                gstNo: vendor.gstNo
            }
        });
    } catch (error) {
        console.error("Error in loginVendor:", error);
        res.status(500).json({ status: 500, message: "Internal server error" });
    }
};

// Get Profile API
const getProfile = (req, res) => {
    try {
        let users = readUsersFile();
        
        // Extract user ID from token
        const userId = req.user.id; // Ensure JWT contains 'id'

        const vendor = users.find((user) => user.id === userId);

        if (!vendor) {
            return res.status(404).json({ status: 404, message: "Vendor not found" });
        }

        // Structuring response
        const response = {
            status: 200,
            message: "Vendor profile fetched successfully",
            data: {
                id: vendor.id,
                vendorName: vendor.vendorName,
                shopName: vendor.shopName,
                mobile: vendor.mobile,
                gstNo: vendor.gstNo,
                status: vendor.verified ? "Active" : "Inactive",
                shipment: {
                    shopNo: vendor.shopNo || "",
                    address: vendor.address || "",
                    landmark: vendor.landmark || "",
                    city: vendor.city || "",
                    state: vendor.state || "",
                    pinCode: vendor.pinCode || ""
                }
            },
            orderData: {
                pendingOrders: vendor.pendingOrders || 0,
                acceptedOrders: vendor.acceptedOrders || 0,
                cancelledOrders: vendor.cancelledOrders || 0,
                outOfDeliveryOrders: vendor.outOfDeliveryOrders || 0,
                deliveredOrders: vendor.deliveredOrders || 0
            }
        };

        res.status(200).json(response);
    } catch (error) {
        console.error("Error in getProfile:", error);
        res.status(500).json({ status: 500, message: "Internal server error" });
    }
};

// Change Password API
const changePassword = (req, res) => {
    try {
        let users = readUsersFile();
        
        const mobile = req.user.mobile;
        
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ status: 400, message: "Old password and new password are required" });
        }

        let userIndex = users.findIndex((user) => user.mobile === mobile);
        if (userIndex === -1) {
            return res.status(404).json({ status: 404, message: "User not found" });
        }

        let user = users[userIndex];

        if (user.password !== oldPassword) {
            return res.status(404).json({ status: 404, message: "Old password is incorrect" });
        }

        users[userIndex].password = newPassword;
        writeUsersFile(users);

        res.status(200).json({ status: 200, message: "Password changed successfully" });
    } catch (error) {
        console.error("Error in changePassword:", error);
        res.status(500).json({ status: 500, message: "Internal server error" });
    }
};

// Forgot Password API
const forgotPassword = (req, res) => {
    try {
        let users = readUsersFile();
        const { mobile } = req.body;

        if (!mobile) {
            return res.status(400).json({ status: 400, message: "Mobile number is required" });
        }

        let userIndex = users.findIndex((user) => user.mobile === mobile);
        if (userIndex === -1) {
            return res.status(404).json({ status: 404, message: "User not found" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate OTP
        users[userIndex].otp = otp;
        writeUsersFile(users);

        sendOtp(mobile, otp); // Send OTP to the user

        res.status(200).json({ status: 200, message: "OTP sent successfully", mobile });
    } catch (error) {
        console.error("Error in forgotPassword:", error);
        res.status(500).json({ status: 500, message: "Internal server error" });
    }
};

// Forgot Password OTP Verification API
const forgotPasswordVerifyOtp = (req, res) => {
    try {
        let users = readUsersFile();
        const { mobile, otp, password } = req.body;

        if (!mobile || !otp || !password) {
            return res.status(400).json({ status: 400, message: "Mobile, OTP, and new password are required" });
        }

        let userIndex = users.findIndex((user) => user.mobile === mobile);
        if (userIndex === -1) {
            return res.status(404).json({ status: 404, message: "User not found" });
        }

        let user = users[userIndex];

        if (user.otp !== otp) {
            return res.status(401).json({ status: 401, message: "Invalid OTP" });
        }

        // Update the password and remove OTP
        users[userIndex].password = password;
        users[userIndex].otp = null; // Clear OTP after verification
        writeUsersFile(users);

        res.status(200).json({ status: 200, message: "Password reset successfully" });
    } catch (error) {
        console.error("Error in forgotPasswordVerifyOtp:", error);
        res.status(500).json({ status: 500, message: "Internal server error" });
    }
};

// Update Address API
const updateAddress = (req, res) => {
    try {
        let users = readUsersFile();
        const userId = req.user.id; // Extract vendor ID from token
        const { shopNo, address, landmark, city, state, pinCode } = req.body;

        // Validate required fields
        if (!shopNo || !address || !city || !state || !pinCode) {
            return res.status(400).json({ status: 400, message: "All address fields are required" });
        }

        // Find vendor by ID
        let userIndex = users.findIndex((user) => user.id === userId);
        if (userIndex === -1) {
            return res.status(404).json({ status: 404, message: "Vendor not found" });
        }

        // Update vendor's address
        users[userIndex].shopNo = shopNo;
        users[userIndex].address = address;
        users[userIndex].landmark = landmark || ""; // Optional field
        users[userIndex].city = city;
        users[userIndex].state = state;
        users[userIndex].pinCode = pinCode;

        // Save updated users.json
        writeUsersFile(users);

        res.status(200).json({ status: 200, message: "Address updated successfully" });
    } catch (error) {
        console.error("Error in updateAddress:", error);
        res.status(500).json({ status: 500, message: "Internal server error" });
    }
};

const getAllVendors = (req, res) => {
  try {
    const { keyword } = req.query;
    const users = readFileSafely(usersFilePath);

    let vendors = users.map((vendor) => ({
      id: vendor.id,
      vendorName: vendor.vendorName,
      shopName: vendor.shopName,
      mobile: vendor.mobile,
      password: vendor.password,
      gstNo: vendor.gstNo,
      shopNo: vendor.shopNo,
      address: vendor.address,
      landmark: vendor.landmark,
      city: vendor.city,
      state: vendor.state,
      pinCode: vendor.pinCode,
      salesman: vendor.salesman,
      otp: vendor.otp,
      verified: vendor.verified,
      pendingOrders: vendor.pendingOrders || 0,
      acceptedOrders: vendor.acceptedOrders || 0,
      cancelledOrders: vendor.cancelledOrders || 0,
      outOfDeliveryOrders: vendor.outOfDeliveryOrders || 0,
      deliveredOrders: vendor.deliveredOrders || 0,
    }));

    // ✅ Apply keyword filter (if any)
    if (keyword && keyword.trim() !== "") {
      const lowerKeyword = keyword.toLowerCase();
      vendors = vendors.filter(vendor =>
        (vendor.vendorName && vendor.vendorName.toLowerCase().includes(lowerKeyword)) ||
        (vendor.shopName && vendor.shopName.toLowerCase().includes(lowerKeyword))
      );
    }

    return res.status(200).json({
      status: 200,
      message: "Vendors fetched successfully",  
      data: vendors
    });

  } catch (error) {
    console.error("Error in getAllVendors:", error);
    return res.status(500).json({
      status: 500,
      message: "Internal Server Error"
    });
  }
};







module.exports = {
    registerVendor,
    verifyOtp,
    loginVendor,
    getProfile,
    changePassword,
    forgotPassword,
    forgotPasswordVerifyOtp,
    updateAddress,
    getAllVendors
    
};