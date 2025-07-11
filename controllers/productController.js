const fs = require("fs");
const path = require("path");

// Paths to JSON files
const productsFilePath = path.join(__dirname, "../models/products.json");
const categoriesFilePath = path.join(__dirname, "../models/categories.json");

// Read and Write Helpers
const readProductsFile = () => {
  try {
    if (!fs.existsSync(productsFilePath)) fs.writeFileSync(productsFilePath, "[]", "utf8");
    const data = fs.readFileSync(productsFilePath, "utf8");
    return JSON.parse(data || "[]");
  } catch (err) {
    console.error("Error reading products.json:", err);
    return [];
  }
};

const writeProductsFile = (data) => {
  try {
    fs.writeFileSync(productsFilePath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing products.json:", err);
  }
};

const readCategoriesFile = () => {
  try {
    if (!fs.existsSync(categoriesFilePath)) fs.writeFileSync(categoriesFilePath, "[]", "utf8");
    const data = fs.readFileSync(categoriesFilePath, "utf8");
    return JSON.parse(data || "[]");
  } catch (err) {
    console.error("Error reading categories.json:", err);
    return [];
  }
};

const writeCategoriesFile = (data) => {
  try {
    fs.writeFileSync(categoriesFilePath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing categories.json:", err);
  }
};



const addProduct = (req, res) => {
  try {
    const {
      productName,
      productDescription,
      categories_id,
      status,
      slug,
      availablePackSizes,
    } = req.body;

    if (!productName || !productDescription || !req.files?.productMainImage) {
      return res.status(400).json({ status: 400, message: "Missing required fields" });
    }

    const mainImage = req.files.productMainImage[0];
    const otherImages = req.files.productOtherImages || [];

    const products = readProductsFile();

    // 🆕 Parse and format pack sizes with _id and proper keys
    const formattedPackSizes = availablePackSizes
  ? JSON.parse(availablePackSizes).map((pack, index) => ({
      _id: `p${index + 1}`,
      size: pack.size,
      priceForWholesaler: Number(pack.wholesalerPrice || pack.priceForWholesaler || 0),
      priceForRetailer: Number(pack.retailerPrice || pack.priceForRetailer || 0),
    }))
  : [];


    const newProduct = {
      _id: (products.length + 1).toString(),
      categories_id,
      productName,
      productDescription,
      productMainImage: `uploads/${path.basename(mainImage.path)}`,
      productOtherImages: otherImages.map((file, i) => ({
        _id: `img${i + 1}`,
        url: `uploads/${path.basename(file.path)}`,
      })),
      availablePackSizes: formattedPackSizes,
      status: status || "active",
      slug,
    };

    products.push(newProduct);
    writeProductsFile(products);

    // ✅ Update total_products count in categories.json
    const categories = readCategoriesFile();
    const categoryIndex = categories.findIndex(
      (cat) => String(cat.id) === String(categories_id)
    );

    if (categoryIndex !== -1) {
      categories[categoryIndex].total_products =
        (categories[categoryIndex].total_products || 0) + 1;
      writeCategoriesFile(categories);
    } else {
      console.warn(`Category with ID ${categories_id} not found. total_products not updated.`);
    }

    return res.status(201).json({
      status: 201,
      message: "Product added successfully",
      product: newProduct,
    });
  } catch (error) {
    console.error("Error adding product:", error);
    return res.status(500).json({ status: 500, message: "Internal server error" });
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

    // 📁 Continue inside productController.js
const updateProduct = (req, res) => {
  try {
    const { id } = req.params;
    const {
      productName,
      productDescription,
      categories_id,
      status,
      slug,
      availablePackSizes,
    } = req.body;

    const products = readProductsFile();
    const productIndex = products.findIndex((p) => p._id === id);

    if (productIndex === -1) {
      return res.status(404).json({ status: 404, message: "Product not found" });
    }

    const product = products[productIndex];

    // ✅ Update fields if provided
    if (productName) product.productName = productName;
    if (productDescription) product.productDescription = productDescription;
    if (categories_id) product.categories_id = categories_id;
    if (slug) product.slug = slug;
    if (status) product.status = status;

    if (availablePackSizes) {
      product.availablePackSizes = JSON.parse(availablePackSizes).map((pack, index) => ({
        _id: `p${index + 1}`,
        size: pack.size,
        priceForWholesaler: Number(pack.wholesalerPrice || pack.priceForWholesaler || 0),
        priceForRetailer: Number(pack.retailerPrice || pack.priceForRetailer || 0),
      }));
    }

    // ✅ Update main image if available
    if (req.files?.productMainImage?.length) {
      product.productMainImage = `uploads/${path.basename(req.files.productMainImage[0].path)}`;
    }

    // ✅ Update other images if provided
    if (req.files?.productOtherImages?.length) {
      product.productOtherImages = req.files.productOtherImages.map((file, i) => ({
        _id: `img${i + 1}`,
        url: `uploads/${path.basename(file.path)}`,
      }));
    }

    // ✅ Save updated product
    products[productIndex] = product;
    writeProductsFile(products);

    return res.status(200).json({
      status: 200,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({ status: 500, message: "Internal server error" });
  }
};


const deleteProduct = (req, res) => {
  try {
    const { id } = req.params;

    const products = readProductsFile();
    const productIndex = products.findIndex((p) => p._id === id);

    if (productIndex === -1) {
      return res.status(404).json({ status: 404, message: "Product not found" });
    }

    const product = products[productIndex];
    const categoryId = product.categories_id;

    products.splice(productIndex, 1);
    writeProductsFile(products);

    // 🧮 Update category product count
    const categories = readCategoriesFile();
    const categoryIndex = categories.findIndex((c) => String(c.id) === String(categoryId));
    if (categoryIndex !== -1) {
      categories[categoryIndex].total_products =
        (categories[categoryIndex].total_products || 1) - 1;
      writeCategoriesFile(categories);
    }

    return res.status(200).json({
      status: 200,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ status: 500, message: "Internal server error" });
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
    getProductsByCategory,
    
};

