    const fs = require("fs");
    const path = require("path");

    // Path to products.json file
    const productsFilePath = path.join(__dirname, "../models/products.json");
    const categoriesFilePath = path.join(__dirname, "../models/categories.json");


    // Read products.json safely
    const readProductsFile = () => {
        try {
            if (!fs.existsSync(productsFilePath)) {
                fs.writeFileSync(productsFilePath, "[]", "utf8"); // Create if missing
            }
            let data = fs.readFileSync(productsFilePath, "utf8");
            return JSON.parse(data || "[]"); // Ensure valid JSON
        } catch (error) {
            console.error("Error reading products.json:", error);
            return [];
        }
    };

    // Write products.json safely
    const writeProductsFile = (data) => {
        try {
            fs.writeFileSync(productsFilePath, JSON.stringify(data, null, 2), "utf8");
        } catch (error) {
            console.error("Error writing to products.json:", error);
        }
    };

    // Add a new product (with image upload)
    const addProduct = (req, res) => {
        try {
            const { productName, productDescription, availablePackSizes, status, slug } = req.body;

            if (!productName || !productDescription || !req.file) {
                return res.status(400).json({ status: 400, message: "Missing required fields" });
            }

            let products = readProductsFile();
            const newProduct = {
                id: products.length + 1,
                productName,
                productDescription,
                productMainImage: `/uploads/${req.file.filename}`, // Store main image URL
                productOtherImages: req.files?.productOtherImages?.map(file => `/uploads/${file.filename}`) || [], // Store multiple images
                availablePackSizes: availablePackSizes ? JSON.parse(availablePackSizes) : [], // Ensure array format
                status: status || "active",
                slug,
            };

            products.push(newProduct);
            writeProductsFile(products);

            res.status(201).json({ 
                status: 201, 
                message: "Product added successfully", 
                product: newProduct 
            });
        } catch (error) {
            console.error("Error in addProduct:", error);
            res.status(500).json({ status: 500, message: "Internal server error" });
        }
    };

    // Get all products
    const getAllProducts = (req, res) => {
        try {
            const { keyword } = req.query;
            let products = readProductsFile();

            // If keyword exists and is not empty, filter products
            if (keyword && keyword.trim() !== "") {
                const lowerKeyword = keyword.toLowerCase();
                products = products.filter(product =>
                    product.productName.toLowerCase().includes(lowerKeyword) ||
                    product.slug.toLowerCase().includes(lowerKeyword)
                );
            }

            res.status(201).json({
                status: 201,
                message: "Products fetched successfully",
                data: products
            });

        } catch (error) {
            console.error("Error in getAllProducts:", error);
            res.status(500).json({ status: 500, message: "Internal server error" });
        }
    };


    // Get a single product by ID
    const getProductById = (req, res) => {
        try {
            const { id } = req.params;
            const products = readProductsFile();
            const product = products.find((p) => p.id == id);

            if (!product) {
                return res.status(404).json({ status: 404, message: "Product not found" });
            }

            res.status(200).json({ status: 200, message: "Product fetched successfully", data: product });
        } catch (error) {
            console.error("Error in getProductById:", error);
            res.status(500).json({ status: 500, message: "Internal server error" });
        }
    };

    // Update a product
    const updateProduct = (req, res) => {
        try {
            const { id } = req.params;
            let products = readProductsFile();
            const productIndex = products.findIndex((p) => p.id == id);

            if (productIndex === -1) {
                return res.status(404).json({ status: 404, message: "Product not found" });
            }

            const updatedProduct = {
                ...products[productIndex],
                ...req.body,
                productMainImage: req.file ? `/uploads/${req.file.filename}` : products[productIndex].productMainImage,
                productOtherImages: req.files?.productOtherImages?.map(file => `/uploads/${file.filename}`) || products[productIndex].productOtherImages,
                availablePackSizes: req.body.availablePackSizes ? JSON.parse(req.body.availablePackSizes) : products[productIndex].availablePackSizes,
            };

            products[productIndex] = updatedProduct;
            writeProductsFile(products);

            res.status(200).json({ status: 200, message: "Product updated successfully", data: updatedProduct });
        } catch (error) {
            console.error("Error in updateProduct:", error);
            res.status(500).json({ status: 500, message: "Internal server error" });
        }
    };

    // Delete a product
    const deleteProduct = (req, res) => {
        try {
            const { id } = req.params;
            let products = readProductsFile();
            const updatedProducts = products.filter((p) => p.id != id);

            if (products.length === updatedProducts.length) {
                return res.status(404).json({ status: 404, message: "Product not found" });
            }

            writeProductsFile(updatedProducts);

            res.status(200).json({ status: 200, message: "Product deleted successfully" });
        } catch (error) {
            console.error("Error in deleteProduct:", error);
            res.status(500).json({ status: 500, message: "Internal server error" });
        }
    };


    // Get available products for sale (filtered by keyword, or all if no keyword)
    const getAvailableForSell = (req, res) => {
        try {
            const { keyword } = req.query;
            let products = readProductsFile();

            // Filter only active products
            let filteredProducts = products.filter(product => product.status === "active");

            // If keyword exists and is not empty, filter further
            if (keyword && keyword.trim() !== "") {
                const lowerKeyword = keyword.toLowerCase();
                filteredProducts = filteredProducts.filter(product =>
                    product.productName.toLowerCase().includes(lowerKeyword) ||
                    product.slug.toLowerCase().includes(lowerKeyword)
                );
            }

            // If no products are found, return a 404 error only when a keyword was searched
            if (filteredProducts.length === 0 && keyword && keyword.trim() !== "") {
                return res.status(404).json({ status: 404, message: "Product not found" });
            }

            // Return all active products if keyword is empty or undefined
            res.status(200).json({
                status: 200,
                message: "Available products fetched successfully",
                data: filteredProducts
            });
        } catch (error) {
            console.error("Error in getAvailableForSell:", error);
            res.status(500).json({ status: 500, message: "Internal server error" });
        }
    };

    // Get products by category ID
    const getProductsByCategory = (req, res) => {
        try {   
            const { categoryId } = req.params;
            const { keyword } = req.query;
    
            const products = readProductsFile();
    
            // Step 1: Filter by category ID and active status
            let filteredProducts = products.filter(product =>
                product.categories_id === categoryId && product.status === "active"
            );
    
            // Step 2: Further filter by keyword if provided
            if (keyword && keyword.trim() !== "") {
                const lowerKeyword = keyword.toLowerCase();
                filteredProducts = filteredProducts.filter(product =>
                    product.productName.toLowerCase().includes(lowerKeyword) ||
                    product.slug.toLowerCase().includes(lowerKeyword)
                );
            }
    
            // Step 3: Return data or 404
            if (filteredProducts.length === 0) {
                return res.status(404).json({
                    status: 404,
                    message: "No products found for this category"
                });
            }
    
            res.status(200).json({
                status: 200,
                message: "Products fetched successfully",
                data: filteredProducts
            });
    
        } catch (error) {
            console.error("Error in getProductsByCategory:", error);
            res.status(500).json({ status: 500, message: "Internal server error" });
        }
    };
    








module.exports = {
    addProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getAvailableForSell,
    getProductsByCategory ,
    
};

