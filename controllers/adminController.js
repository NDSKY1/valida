const path = require("path");
const { readFileSafely, writeFileSafely } = require("../utils/fileUtils");

const orderFilePath = path.join(__dirname, "../models/orders.json");
const corderFilePath = path.join(__dirname, "../models/COrders.json");
const deliveryBoyFilePath = path.join(__dirname, "../models/deliveryBoy.json");
const userFilePath = path.join(__dirname, "../models/users.json"); // Vendor/Customer data

const assignDeliveryBoy = async (req, res) => {
    try {
        const { orderId, deliveryBoyId } = req.body;
        if (!orderId || !deliveryBoyId) {
            return res.status(400).json({ message: "Order ID and Delivery Boy ID are required" });
        }

        // Read data from files
        let orders = readFileSafely(orderFilePath);
        let deliveryBoys = readFileSafely(deliveryBoyFilePath);
        let users = readFileSafely(userFilePath); // Read vendor/customer data from user.json

        // Find order
        let orderIndex = orders.findIndex(order => order.orderId === orderId);
        if (orderIndex === -1) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Find delivery boy
        let deliveryBoyIndex = deliveryBoys.findIndex(boy => boy.id === deliveryBoyId);
        if (deliveryBoyIndex === -1) {
            return res.status(404).json({ message: "Delivery Boy not found" });
        }

        // Increment activeOrders for the delivery boy
        deliveryBoys[deliveryBoyIndex].activeOrders = 
            (deliveryBoys[deliveryBoyIndex].activeOrders || 0) + 1;

        // Save updated delivery boys data
        writeFileSafely(deliveryBoyFilePath, deliveryBoys);

        // Get mobile number from orders.json
        let mobileNumber = orders[orderIndex].mobile; 

        // Find user (vendor/customer) from user.json using mobile number
        let user = users.find(u => u.mobile === mobileNumber);

        // Format vendorsData based on required fields
        let vendorsData = user
            ? {
                id: user.id.toString(), // Convert ID to string if it's numeric
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
            : null; // If no user found, keep it null

        // Update order status to 'Accepted'
        orders[orderIndex].status = "out of delivery";

        // Save the updated orders.json
        writeFileSafely(orderFilePath, orders);

        // Prepare new order data for COrders.json
        let newOrder = {
            id: orderId,
            challanNo: orderId,
            total: orders[orderIndex].total,
            productList: orders[orderIndex].products,
            remark: orders[orderIndex].remark || "N/A",
            status: "out of delivery", // Set status to Accepted
            deliveryBoy: deliveryBoyId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            mobile: mobileNumber, // Keep mobile number from orders.json
            vendorsData: vendorsData // Store formatted vendor data
        };

        // Read and update COrders.json
        let corders = readFileSafely(corderFilePath);
        corders.push(newOrder);
        writeFileSafely(corderFilePath, corders);

        return res.status(200).json({
            message: "Delivery Boy assigned successfully, order status updated to 'Accepted', and active orders updated",
            order: newOrder
        });
    } catch (error) {
        console.error("Error assigning delivery boy:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = { assignDeliveryBoy };
