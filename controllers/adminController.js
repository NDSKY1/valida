const path = require("path");
const { readFileSafely, writeFileSafely } = require("../utils/fileUtils");

const orderFilePath = path.join(__dirname, "../models/orders.json");
const corderFilePath = path.join(__dirname, "../models/COrders.json");
const deliveryBoyFilePath = path.join(__dirname, "../models/deliveryBoy.json");
const userFilePath = path.join(__dirname, "../models/users.json");
const adminFilePath = path.join(__dirname, "../models/admin.json"); // NEW: Admin data
const categoryFilePath = path.join(__dirname, "../models/categories.json");




const jwt = require("jsonwebtoken");
require("dotenv").config(); // load env variables


// Admin Login
const adminLogin = (req, res) => {
  
  const { mobile, password } = req.body;

  const admins = readFileSafely(adminFilePath);
  const matchedAdmin = admins.find(
    (admin) => admin.mobile === mobile && admin.password === password
  );

  if (matchedAdmin) {
    const token = jwt.sign(
      { mobile: matchedAdmin.mobile, id: matchedAdmin.id },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    return res.status(200).json({
      status: 200,
      message: "Login successful",
      data: {
        id: matchedAdmin.id,
        name: matchedAdmin.name,
        mobile: matchedAdmin.mobile,
        token: token
      },
      
    });
  } else {
    return res.status(401).json({ message: "Invalid credentials" });
  }
};



module.exports = {
  adminLogin,  
};
