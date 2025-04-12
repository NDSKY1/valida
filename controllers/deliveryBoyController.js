const fs = require("fs");
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config();

const SECRET_KEY = process.env.JWT_SECRET;
const ordersFilePath = path.join(__dirname, '../models/COrders.json');
const ordersJsonPath = path.join(__dirname, '../models/orders.json');


// Load delivery boys from JSON file
const loadDeliveryBoys = () => {
    const filePath = path.join(__dirname, "../models/deliveryBoy.json");
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
};

// Delivery Boy Login
const loginDeliveryBoy = (req, res) => {
    const { mobile, password } = req.body;
    const users = loadDeliveryBoys();
    console.log(`Mobile: ${mobile}, Password: ${password}`);
    // Find user in the list
    const user = users.find(user => user.mobile === mobile && user.password === password);

    if (!user) {
        return res.status(401).json({ status: 401, message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, mobile: user.mobile }, SECRET_KEY, { expiresIn: "7d" });

    res.json({ status: 200, message: "Login successful", data: { token } });
};



// Get Delivery Boy Profile (Protected Route)


const getDeliveryBoyProfile = (req, res) => {
    const userId = req.user.id;
    const users = loadDeliveryBoys();
    
    const user = users.find(user => user.id === userId);
    if (!user) {
        return res.status(404).json({ status: 404, message: "User not found", data: null });
    }

    res.json({
        status: 200,
        message: "Profile fetched successfully",
        data: {
            _id: user.id.toString(),
            name: user.name || "Delivery Boy",
            dialcode: "+91",
            mobile: user.mobile,
            status: true
        }
    });
};

// Load delivery dashboard data (Mock Data for now)
const loadDashboardData = () => {
    try {
        const ordersData = JSON.parse(fs.readFileSync(ordersFilePath, 'utf8'));
        
        const pendingOrder = ordersData.filter(order => order.status === "out of delivery").length;
        const deliveredOrder = ordersData.filter(order => order.status === "Delivered").length;
        
        return {
            status: 200,
            message: "Dashboard data fetched successfully",
            data: {
                pendingOrder,
                deliveredOrder
            }
        };
    } catch (error) {
        console.error("Error reading orders file:", error);
        return { status: 500, message: "Error loading dashboard data" };
    }
};

// Get Dashboard Data for Delivery Boy
const getDeliveryBoyDashboard = (req, res) => {
    try {
        const dashboardData = loadDashboardData();
        res.status(200).json(dashboardData);
    } catch (error) {
        res.status(500).json({ status: 500, message: "Error fetching dashboard data", error: error.message });
    }
};







const getDeliveryBoyOrders = (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 10, keyword = "", status = "" } = req.query;

    try {
        const ordersData = JSON.parse(fs.readFileSync(ordersFilePath, "utf8"));
        
        // Ensure correct field for deliveryBoyId
        let filteredOrders = ordersData.filter(order => order.deliveryBoy === userId);

        // Filter by status
        if (status) {
            filteredOrders = filteredOrders.filter(order => order.status.toLowerCase() === status.toLowerCase());
        }

        // Filter by keyword in challanNo or vendorId
        if (keyword) {
            filteredOrders = filteredOrders.filter(order =>
                order.challanNo.includes(keyword) ||
                order.vendorsData.id.includes(keyword)
            );
        }

        // Pagination logic
        const totalDocs = filteredOrders.length;
        const totalPages = Math.ceil(totalDocs / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

        res.json({
            status: 200,
            message: "Orders fetched successfully",
            data: {
                docs: paginatedOrders,
                totalDocs,
                limit: parseInt(limit),
                page: parseInt(page),
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                nextPage: page < totalPages ? page + 1 : null,
                prevPage: page > 1 ? page - 1 : null
            }
        });

    } catch (error) {
        console.error("Error reading orders file:", error);
        res.status(500).json({ status: 500, message: "Error fetching orders", error: error.message });
    }
};


const markAsDelivered = (req, res) => {
    const userId = req.user.id;
    const { id } = req.params; // This should match the `orderId` in orders.json

    try {
        // Update COrders.json
        let cOrdersData = JSON.parse(fs.readFileSync(ordersFilePath, "utf8"));
        const orderIndex = cOrdersData.findIndex(order => order.id === id && order.deliveryBoy === userId);

        if (orderIndex === -1) {
            return res.status(404).json({ status: 404, message: "Order not found or unauthorized" });
        }

        cOrdersData[orderIndex].status = "Delivered";
        cOrdersData[orderIndex].updatedAt = new Date().toISOString();
        fs.writeFileSync(ordersFilePath, JSON.stringify(cOrdersData, null, 2));

        // Update orders.json
        let ordersData = JSON.parse(fs.readFileSync(ordersJsonPath, "utf8"));
        const orderJsonIndex = ordersData.findIndex(order => order.orderId === id);

        if (orderJsonIndex !== -1) {
            ordersData[orderJsonIndex].status = "Delivered";
            ordersData[orderJsonIndex].updatedAt = new Date().toISOString();
            fs.writeFileSync(ordersJsonPath, JSON.stringify(ordersData, null, 2));
        }

        res.json({
            status: 200,
            message: "Order marked as delivered successfully",
            data: { id }
        });

    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ status: 500, message: "Error marking order as delivered", error: error.message });
    }
};



module.exports = {
    loginDeliveryBoy,
    getDeliveryBoyProfile,
    getDeliveryBoyDashboard,
    getDeliveryBoyOrders,
    markAsDelivered
};
