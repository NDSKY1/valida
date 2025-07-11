const path = require("path");
const { readFileSafely, writeFileSafely } = require("../utils/fileUtils");

const cartFilePath = path.join(__dirname, "../models/cart.json");
const orderFilePath = path.join(__dirname, "../models/orders.json");
const usersFilePath = path.join(__dirname, "../models/users.json");
const cancelledOrderFilePath = path.join(__dirname, '../models/cancelled_orders.json');


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

// ✅ Get All Orders for Admin
exports.getAllOrdersForAdmin = (req, res) => {
    try {
        const { keyword = "", page = 1, limit = 10, status = "" } = req.query;

        let orders = readFileSafely(orderFilePath);
        let users = readFileSafely(usersFilePath);
        
        // ✅ Filter by status if provided (no hardcoded pending anymore)
        if (status) {
            orders = orders.filter(order => order.status?.toLowerCase() === status.toLowerCase());
        }

        // ✅ Filter by keyword in orderId or productName
        if (keyword) {
            orders = orders.filter(order =>
                order.orderId.includes(keyword) ||
                order.products.some(product =>
                    product.productName?.toLowerCase().includes(keyword.toLowerCase())
                )
            );
        }

        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const paginatedOrders = orders.slice(startIndex, startIndex + parseInt(limit));

        const formattedOrders = paginatedOrders.map(order => {
            const user = users.find(u => u.mobile === order.mobile);
            return {
                id: order.orderId,
                mobile: order.mobile,
                userName: user ? user.name : "Unknown",
                total: order.total,
                remark: order.remark || "",
                status: order.status,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt || order.createdAt,
                productList: order.products.map(product => ({
                    productId: product._id,
                    productName: product.productName,
                    productMainImage: product.productMainImage,
                    qty: product.qty,
                    price: product.price,
                    size: product.size,
                    subtotal: product.subtotal
                }))
            };
        });

        return res.status(200).json({
            status: 200,
            message: "All orders fetched successfully",
            data: {
                docs: formattedOrders,
                totalDocs: orders.length,
                limit: parseInt(limit),
                page: parseInt(page),
                totalPages: Math.ceil(orders.length / parseInt(limit)),
                pagingCounter: startIndex + 1,
                hasPrevPage: parseInt(page) > 1,
                hasNextPage: startIndex + parseInt(limit) < orders.length,
                prevPage: parseInt(page) > 1 ? parseInt(page) - 1 : null,
                nextPage: startIndex + parseInt(limit) < orders.length ? parseInt(page) + 1 : null
            }
        });

    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

exports.updateOrderStatus = (req, res) => {
  try {
    const { orderId, status } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({
        status: 400,
        message: 'orderId and status are required.',
      });
    }

    let orders = readFileSafely(orderFilePath);
    const index = orders.findIndex((order) => order.orderId === orderId);

    if (index === -1) {
      return res.status(404).json({
        status: 404,
        message: 'Order not found.',
      });
    }

    const order = orders[index];

    if (status === 'Cancelled') {
      // Move to cancelled_orders.json
      let cancelledOrders = readFileSafely(cancelledOrderFilePath);
      order.status = 'Cancelled';
      order.updatedAt = new Date().toISOString();
      cancelledOrders.push(order);

      // Save to cancelled_orders.json
      writeFileSafely(cancelledOrderFilePath, cancelledOrders);

      // Remove from original list
      orders.splice(index, 1);
      writeFileSafely(orderFilePath, orders);

      return res.status(200).json({
        status: 200,
        message: 'Order cancelled and moved to cancelled_orders.json',
      });
    }

    // If Accepted, update in place
    orders[index].status = status;
    orders[index].updatedAt = new Date().toISOString();
    writeFileSafely(orderFilePath, orders);

    return res.status(200).json({
      status: 200,
      message: `Order status updated to ${status}`,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

// ✅ Get All Cancelled Orders
exports.getAllCancelledOrders = (req, res) => {
  try {
    const { keyword = "", page = 1, limit = 10 } = req.query;

    let cancelledOrders = readFileSafely(cancelledOrderFilePath);
    let users = readFileSafely(usersFilePath);

    // ✅ Filter by keyword in orderId or mobile only
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      cancelledOrders = cancelledOrders.filter(order =>
        order.orderId.toLowerCase().includes(lowerKeyword) ||
        order.mobile.includes(keyword)
      );
    }

    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const paginatedOrders = cancelledOrders.slice(startIndex, startIndex + parseInt(limit));

    const formattedOrders = paginatedOrders.map(order => {
      const user = users.find(u => u.mobile === order.mobile);
      return {
        id: order.orderId,
        mobile: order.mobile,
        userName: user ? user.name : "Unknown",
        total: order.total,
        remark: order.remark || "",
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt || order.createdAt,
        productList: order.products.map(product => ({
          productId: product.productId,
          productName: product.productName,
          productMainImage: product.productMainImage,
          qty: product.qty,
          price: product.price,
          size: product.size,
          subtotal: product.subtotal
        }))
      };
    });

    return res.status(200).json({
      status: 200,
      message: "Cancelled orders fetched successfully",
      data: {
        docs: formattedOrders,
        totalDocs: cancelledOrders.length,
        limit: parseInt(limit),
        page: parseInt(page),
        totalPages: Math.ceil(cancelledOrders.length / parseInt(limit)),
        pagingCounter: startIndex + 1,
        hasPrevPage: parseInt(page) > 1,
        hasNextPage: startIndex + parseInt(limit) < cancelledOrders.length,
        prevPage: parseInt(page) > 1 ? parseInt(page) - 1 : null,
        nextPage: startIndex + parseInt(limit) < cancelledOrders.length ? parseInt(page) + 1 : null
      }
    });

  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      error: error.message
    });
  }
};
