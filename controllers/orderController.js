const path = require("path");
const { readFileSafely, writeFileSafely } = require("../utils/fileUtils");

const cartFilePath = path.join(__dirname, "../models/cart.json");
const orderFilePath = path.join(__dirname, "../models/orders.json");
const usersFilePath = path.join(__dirname, "../models/users.json");


// ✅ Create Order
// ✅ Create Order
exports.createOrder = (req, res) => {   
    try {
        const mobile = req.user.mobile;
        const { remark } = req.body;

        let cartData = readFileSafely(cartFilePath);
        let userCart = cartData.find(cart => cart.mobile === mobile);
        created = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });



        if (!userCart || userCart.productlist.length === 0) {
            return res.status(400).json({ status: 400, message: "Cart is empty. Cannot create order." });
        }

        const total = userCart.productlist.reduce((sum, item) => sum + item.subtotal, 0);
        const newOrder = {
            orderId: `${Date.now()}${Math.floor(Math.random() * 1000)}`,
            mobile,
            products: userCart.productlist,
            total,
            remark: remark || "N/A",
            status: "Pending",
            createdAt :new Date(created).toISOString()
        };

        let orderData = readFileSafely(orderFilePath);
        orderData.push(newOrder);
        writeFileSafely(orderFilePath, orderData);

        cartData = cartData.filter(cart => cart.mobile !== mobile);
        writeFileSafely(cartFilePath, cartData);

        // Read user data and update pendingOrders count
        let usersData = readFileSafely(usersFilePath);
        let userIndex = usersData.findIndex(user => user.mobile === mobile);

        if (userIndex !== -1) {
            usersData[userIndex].pendingOrders += 1;  // Increment pendingOrders
            writeFileSafely(usersFilePath, usersData);  // FIXED variable name here
        }

        return res.status(201).json({ status: 201, message: "Order created successfully", data: newOrder });

    } catch (error) {
        return res.status(500).json({ status: 500, message: "Internal Server Error", error: error.message });
    }
};


// ✅ Get User Orders
exports.getUserOrders = (req, res) => {
    try {
        const mobile = req.user.mobile;
        const { keyword = "", page = 1, limit = 10, status = "" } = req.query;

        let orderData = readFileSafely(orderFilePath);
        let userOrders = orderData.filter(order => order.mobile === mobile);

        if (status) {
            userOrders = userOrders.filter(order => order.status.toLowerCase() === status.toLowerCase());
        }

        if (keyword) {
            userOrders = userOrders.filter(order =>
                order.orderId.includes(keyword) ||
                order.products.some(product => product.productName.toLowerCase().includes(keyword.toLowerCase()))
            );
        }

        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const paginatedOrders = userOrders.slice(startIndex, startIndex + parseInt(limit));

        const formattedOrders = paginatedOrders.map(order => ({
            id: order.orderId,
            vendorId:  req.user.name,  // If applicable, otherwise remove
            challanNo: order.orderId,  // If applicable, otherwise remove
            total: order.total,
            productList: order.products.map(product => ({
                productId: product._id,
                productName: product.productName,
                productMainImage: product.productMainImage,
                qty: product.qty,
                price: product.price,
                size: product.size,
                subtotal: product.subtotal,
                id: product.cartProductNumber || null
            })),
            remark: order.remark || "",
            status: order.status,
            deliveryBoy: null, // If applicable
            createdAt: order.createdAt,
            updatedAt: order.updatedAt || order.createdAt
        }));

        return res.status(200).json({
            status: 200,
            message: "User orders fetched successfully",
            data: {
                docs: formattedOrders,
                totalDocs: userOrders.length,
                limit: parseInt(limit),
                page: parseInt(page),
                totalPages: Math.ceil(userOrders.length / parseInt(limit)),
                pagingCounter: startIndex + 1,
                hasPrevPage: parseInt(page) > 1,
                hasNextPage: startIndex + parseInt(limit) < userOrders.length,
                prevPage: parseInt(page) > 1 ? parseInt(page) - 1 : null,
                nextPage: startIndex + parseInt(limit) < userOrders.length ? parseInt(page) + 1 : null
            }
        });
    } catch (error) {
        return res.status(500).json({ status: 500, message: "Internal Server Error", error: error.message });
    }
};
