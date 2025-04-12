const fs = require("fs");
const path = require("path");

// Paths to JSON files
const cartFilePath = path.join(__dirname, "../models/cart.json");
const productFilePath = path.join(__dirname, "../models/products.json");
const userFilePath = path.join(__dirname, "../models/users.json");

// Read JSON data safely
const readFileSafely = (filePath) => {
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, "[]", "utf8"); // Ensure file exists
        }
        let data = fs.readFileSync(filePath, "utf8");
        return JSON.parse(data || "[]");
    } catch (error) {
        console.error(`Error reading file: ${filePath}`, error);
        return [];
    }
};

// Write cart data safely
const writeCartFile = (data) => {
    try {
        fs.writeFileSync(cartFilePath, JSON.stringify(data, null, 2), "utf8");
    } catch (error) {
        console.error("Error writing to cart.json:", error);
    }
};


// ✅ Add Product to Cart

exports.addProductToCart = (req, res) => {
    try {
        const { productId, sizeId } = req.body;
        const mobile = req.user.mobile; 

        if (!productId || !sizeId) {
            return res.status(400).json({ status: 400, message: "Product ID and Size ID are required" });
        }

        let cart = readFileSafely(cartFilePath);
        let products = readFileSafely(productFilePath);
        let users = readFileSafely(userFilePath);

        const user = users.find((u) => u.mobile === mobile);
        if (!user) return res.status(404).json({ status: 404, message: "User not found" });

        const userType = user.salesman ? "wholesaler" : "retailer";
        const product = products.find((p) => p._id === productId);
        if (!product) return res.status(404).json({ status: 404, message: "Product not found" });

        const sizeDetails = product.availablePackSizes.find((s) => s._id === sizeId);
        if (!sizeDetails) return res.status(404).json({ status: 404, message: "Size not found" });

        const price = userType === "wholesaler" ? sizeDetails.priceForWholesaler : sizeDetails.priceForRetailer;

        let userCart = cart.find((c) => c.mobile === mobile);
        if (!userCart) {
            userCart = { mobile, total: 0, productlist: [] };
            cart.push(userCart);
        }

        let existingProduct = userCart.productlist.find((item) => item.productId === productId && item.sizeId === sizeId);

        if (existingProduct) {
            existingProduct.qty += 1;
            existingProduct.subtotal = existingProduct.qty * price;
        } else {
            userCart.productlist.push({
                _id: `${Date.now()}${Math.floor(Math.random() * 1000)}`,
                productId: product._id,
                productName: product.productName,
                productMainImage: product.productMainImage,
                sizeId: sizeDetails._id,
                size: sizeDetails.size,
                qty: 1,
                price,
                subtotal: price,
            });
        }

        userCart.total = userCart.productlist.reduce((sum, item) => sum + item.subtotal, 0);
        writeCartFile(cart);

        return res.status(200).json({ status: 200, message: "Product added to cart", data: userCart });
    } catch (error) {
        return res.status(500).json({ status: 500, message: "Internal Server Error", error: error.message });
    }
};


// ✅ **Show cart contents**
exports.showMyCart = (req, res) => {
    try {
        const mobile = req.user.mobile; // Extract authenticated user's mobile

        let cartData = readFileSafely(cartFilePath);

        // Find the cart for the logged-in user
        let userCart = cartData.find(cart => cart.mobile === mobile);

        if (!userCart || userCart.productlist.length === 0) {
            return res.status(200).json({
                status: 200,
                message: "Cart is empty",
                data: { total: 0, productlist: [] }
            });
        }

        // Calculate the total amount
        const total = userCart.productlist.reduce((sum, item) => sum + item.subtotal, 0);
        userCart.total = total;

        return res.status(200).json({
            status: 200,
            message: "Cart retrieved successfully",
            data: userCart
        });

    } catch (error) {
        console.error("Error fetching cart:", error);
        return res.status(500).json({
            status: 500,
            message: "Internal Server Error",
            error: error.message
        });
    }
};




// ✅ Update quantity of a product in the cart

exports.updateCartProduct = (req, res) => {
  try {
    const { productId, sizeId, qty } = req.body;

    // ✅ Validation Check
    if (!productId || !sizeId || qty === undefined || qty <= 0) {
      return res.status(400).json({
        status: 400,
        message: "Invalid input. Product ID, Size ID, and Quantity must be provided, and Quantity must be greater than 0.",
      });
    }

    let cartData = readFileSafely(cartFilePath);

    if (!cartData || cartData.length === 0 || !cartData[0].productlist) {
      return res.status(404).json({ status: 404, message: "Cart not found" });
    }

    let cart = cartData[0].productlist;
    let productIndex = cart.findIndex(item => item.productId === productId && item.sizeId === sizeId);

    if (productIndex === -1) {
      return res.status(404).json({ status: 404, message: "Product not found in cart" });
    }

    // ✅ Convert qty to an integer
    const newQty = parseInt(qty, 10);

    // ✅ Update quantity & subtotal
    cart[productIndex].qty = newQty;
    cart[productIndex].subtotal = newQty * cart[productIndex].price;
    cart[productIndex].updatedAt = new Date().toISOString();

    // ✅ Ensure all qty values are stored as integers
    cartData[0].productlist = cart.map(item => ({
      ...item,
      qty: parseInt(item.qty, 10),
      subtotal: parseInt(item.subtotal, 10),
      price: parseInt(item.price, 10)
    }));

    // ✅ Update total cart amount
    cartData[0].total = cartData[0].productlist.reduce((sum, item) => sum + item.subtotal, 0);
    writeCartFile(cartData);

    return res.status(200).json({
      status: 200,
      message: "Cart updated successfully",
      data: cartData[0]
    });
  } catch (error) {
    console.error("Error updating cart:", error);
    return res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      error: error.message
    });
  }
};




// ✅ **Remove single quantity of product from cart**
exports.removeCartProduct = (req, res) => {
    try {
        const { id } = req.params; // Extract _id from request parameters
        let cartData = readFileSafely(cartFilePath);

        if (!cartData || cartData.length === 0 || !cartData[0].productlist) {
            return res.status(200).json({
                status: 200,
                message: "Cart is empty",
                data: { total: 0, productlist: [] }
            });
        }

        let cart = cartData[0].productlist;
        let productIndex = cart.findIndex(item => item._id === id);  // Fix here

        if (productIndex === -1) {
            return res.status(404).json({ status: 404, message: "Product not found in cart" });
        }

        // Decrease quantity by 1
        if (cart[productIndex].qty > 1) {
            cart[productIndex].qty -= 1;
            cart[productIndex].subtotal = cart[productIndex].qty * cart[productIndex].price;
        } else {
            // Remove product if quantity reaches 0
            cart.splice(productIndex, 1);
        }

        // Recalculate total cart amount
        let total = cart.reduce((sum, item) => sum + item.subtotal, 0);
        cartData[0].total = total;
        cartData[0].productlist = cart;

        writeCartFile(cartData);

        return res.status(200).json({
            status: 200,
            message: "Product quantity decreased",
            data: { total, productlist: cart }
        });

    } catch (error) {
        console.error("Error decreasing product quantity:", error);
        return res.status(500).json({
            status: 500,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

// ✅ **Increase single quantity of product in cart**
exports.increaseCartProduct = (req, res) => {
    try {
        const { id } = req.params; // Extract _id from request parameters
        let cartData = readFileSafely(cartFilePath);

        if (!cartData || cartData.length === 0 || !cartData[0].productlist) {
            return res.status(200).json({
                status: 200,
                message: "Cart is empty",
                data: { total: 0, productlist: [] }
            });
        }

        let cart = cartData[0].productlist;
        let productIndex = cart.findIndex(item => item._id === id);

        if (productIndex === -1) {
            return res.status(404).json({ status: 404, message: "Product not found in cart" });
        }

        // Increase quantity by 1
        cart[productIndex].qty += 1;
        cart[productIndex].subtotal = cart[productIndex].qty * cart[productIndex].price;

        // Recalculate total cart amount
        let total = cart.reduce((sum, item) => sum + item.subtotal, 0);
        cartData[0].total = total;
        cartData[0].productlist = cart;

        writeCartFile(cartData);

        return res.status(200).json({
            status: 200,
            message: "Product quantity increased",
            data: { total, productlist: cart }
        });

    } catch (error) {
        console.error("Error increasing product quantity:", error);
        return res.status(500).json({
            status: 500,
            message: "Internal Server Error",
            error: error.message
        });
    }
};


// ✅ **Remove a product from cart completely using _id**
exports.removeParticularCartProduct = (req, res) => {
    try {
        let cartData = readFileSafely(cartFilePath);

        if (!cartData || cartData.length === 0 || !cartData[0].productlist) {
            return res.status(200).json({
                status: 200,
                message: "Cart is empty",
                data: { total: 0, productlist: [] }
            });
        }

        let cart = cartData[0].productlist;
        let updatedCart = cart.filter(item => item._id !== req.params.id);  // Filtering by _id

        if (cart.length === updatedCart.length) {
            return res.status(404).json({ status: 404, message: "Product not found in cart" });
        }

        // Recalculate total cart amount
        let total = updatedCart.reduce((sum, item) => sum + item.subtotal, 0);
        cartData[0].total = total;
        cartData[0].productlist = updatedCart;

        writeCartFile(cartData);

        return res.status(200).json({
            status: 200,
            message: "Product removed from cart",
            data: { total, productlist: updatedCart }
        });

    } catch (error) {
        console.error("Error removing product from cart:", error);
        return res.status(500).json({
            status: 500,
            message: "Internal Server Error",
            error: error.message
        });
    }
};
	