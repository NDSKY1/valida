const express = require("express");
const cors = require("cors");
const path = require("path");

const vendorRoutes = require("./routes/vendorRoutes");
const salesmanRoutes = require("./routes/salesmanRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes"); // Cart-related routes
const orderRoutes = require("./routes/orderRoutes"); // Order-related routes\
const adminRoutes = require("./routes/adminRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const categoriesRoutes = require("./routes/categoriesRoutes");



// const paymentRoutes = require("./routes/paymentRoutes");

const deliveryBoyRoutes = require("./routes/deliveryBoyRoutes"); //deliveryBoy routes


const app = express();

const corsOptions = {
  origin: 'http://localhost:5005',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Serve static files (for uploaded images)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/categories_img", express.static(path.join(__dirname, "categories_img")));

// Routes
app.use("/vendor", vendorRoutes);
app.use("/categories",categoriesRoutes);
app.use("/salesman", salesmanRoutes);
app.use("/product", productRoutes);
app.use("/cart", cartRoutes);
app.use("/order", orderRoutes);
app.use("/deliveryBoy", deliveryBoyRoutes);
app.use("/admin", adminRoutes);
app.use("/paymentEntry", paymentRoutes);

// Default route for health check
app.get("/", (req, res) => {
  res.status(200).json({ message: "API is running successfully!" });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({ message: "Internal Server Error 1", error: err.message });
});

module.exports = app;
