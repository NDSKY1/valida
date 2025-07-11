const fs = require("fs");
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config();

const SECRET_KEY = process.env.JWT_SECRET;
const ordersFilePath = path.join(__dirname, '../models/COrders.json');
// const ordersJsonPath = path.join(__dirname, '../models/orders.json');


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


// get all delivery for admin
const getAllDeliveryBoys = (req, res) => {
    try {
        const { keyword } = req.query;
        let deliveryBoys = loadDeliveryBoys();

        // Filter by name if keyword is provided
        if (keyword && keyword.trim() !== "") {
            const lowerKeyword = keyword.toLowerCase();
            deliveryBoys = deliveryBoys.filter(boy =>
                boy.name.toLowerCase().includes(lowerKeyword)
            );
        }

        res.status(200).json({
            status: 200,
            message: "All delivery boys fetched successfully",
            data: deliveryBoys
        });
    } catch (error) {
        console.error("Error reading deliveryBoy.json:", error);
        res.status(500).json({
            status: 500,
            message: "Failed to fetch delivery boys",
            error: error.message
        });
    }
};
const updateDeliveryBoyStatus = (req, res) => {
    const { id, status } = req.body; // Expecting: id = "1", status = "active" or "inactive"

    if (!id || !status) {
        return res.status(400).json({
            status: 400,
            message: "Both 'id' and 'status' fields are required"
        });
    }

    const filePath = path.join(__dirname, "../models/deliveryBoy.json");

    try {
        let deliveryBoys = loadDeliveryBoys();

        const index = deliveryBoys.findIndex(boy => boy.id === id);

        if (index === -1) {
            return res.status(404).json({
                status: 404,
                message: "Delivery boy not found"
            });
        }

        // Update isActive based on status string
        deliveryBoys[index].isActive = status.toLowerCase() === "active";

        // Save changes
        fs.writeFileSync(filePath, JSON.stringify(deliveryBoys, null, 2));

        return res.status(200).json({
            status: 200,
            message: `Delivery boy status updated to ${status}`,
        });

    } catch (error) {
        console.error("Error updating delivery boy status:", error);
        return res.status(500).json({
            status: 500,
            message: "Internal server error",
            error: error.message
        });
    }
};



// ✅ Assign Delivery Boy (no changes)
const assignDeliveryBoy = async (req, res) => {
  try {
    const { orderId, deliveryBoyId } = req.body;

    if (!orderId || !deliveryBoyId) {
      return res.status(400).json({ message: "Order ID and Delivery Boy ID are required" });
    }

    let orders = readFileSafely(orderFilePath);
    let deliveryBoys = readFileSafely(deliveryBoyFilePath);
    let users = readFileSafely(userFilePath);

    const orderIndex = orders.findIndex(order => order.orderId === orderId);
    if (orderIndex === -1) {
      return res.status(404).json({ message: "Order not found" });
    }

    const deliveryBoyIndex = deliveryBoys.findIndex(boy => boy.id === deliveryBoyId);
    if (deliveryBoyIndex === -1) {
      return res.status(404).json({ message: "Delivery Boy not found" });
    }

    deliveryBoys[deliveryBoyIndex].activeOrders =
      (deliveryBoys[deliveryBoyIndex].activeOrders || 0) + 1;

    writeFileSafely(deliveryBoyFilePath, deliveryBoys);

    const mobileNumber = orders[orderIndex].mobile;
    const user = users.find(u => u.mobile === mobileNumber);

    const vendorsData = user
      ? {
          id: user.id.toString(),
          vendorName: user.vendorName,
          shopName: user.shopName,
          mobile: user.mobile,
          gstNo: user.gstNo,
          shipment: {
            shopNo: user.shopNo,
            address: user.address,
            landmark: user.landmark,
            city: user.city,
            state: user.state,
            pinCode: user.pinCode
          }
        }
      : null;

    orders[orderIndex].status = "out of delivery";
    writeFileSafely(orderFilePath, orders);

    const newOrder = {
      id: orderId,
      challanNo: orderId,
      total: orders[orderIndex].total,
      productList: orders[orderIndex].products,
      remark: orders[orderIndex].remark || "N/A",
      status: "out of delivery",
      deliveryBoy: deliveryBoyId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mobile: mobileNumber,
      vendorsData: vendorsData
    };

    const corders = readFileSafely(corderFilePath);
    corders.push(newOrder);
    writeFileSafely(corderFilePath, corders);

    return res.status(200).json({
      message: "Delivery Boy assigned successfully, order status updated to 'out of delivery', and active orders updated",
      order: newOrder
    });
  } catch (error) {
    console.error("Error assigning delivery boy:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
// ✅ Get only active delivery boys
const getActiveDeliveryBoys = (req, res) => {
    try {
        const deliveryBoys = loadDeliveryBoys();

        // Filter only active boys
        const activeBoys = deliveryBoys.filter(boy => boy.isActive === true);

        res.status(200).json({
            status: 200,
            message: "Active delivery boys fetched successfully",
            data: activeBoys
        });
    } catch (error) {
        console.error("Error fetching active delivery boys:", error);
        res.status(500).json({
            status: 500,
            message: "Failed to fetch active delivery boys",
            error: error.message
        });
    }
};









module.exports = {
    loginDeliveryBoy,
    getDeliveryBoyProfile,
    getDeliveryBoyDashboard,
    getDeliveryBoyOrders,
    markAsDelivered,
    getAllDeliveryBoys,
    updateDeliveryBoyStatus,
    assignDeliveryBoy,
    getActiveDeliveryBoys 
};
