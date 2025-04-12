const fs = require("fs");
const path = require("path");
const categoriesFilePath = path.join(__dirname, "../models/categories.json");

// GET /categories/all?keyword=something
const getAllCategories = (req, res) => {
    try {
        const { keyword } = req.query;
        let categories = JSON.parse(fs.readFileSync(categoriesFilePath, "utf8") || "[]");

        if (keyword && keyword.trim() !== "") {
            const lowerKeyword = keyword.toLowerCase();
            categories = categories.filter(cat =>
                cat.name.toLowerCase().includes(lowerKeyword)
            );
        }

        res.status(200).json({
            status: 200,
            message: "Categories fetched successfully",
            data: categories
        });
    } catch (error) {
        console.error("Error in getAllCategories:", error);
        res.status(500).json({ status: 500, message: "Internal server error" });
    }
};



module.exports = {
    getAllCategories
};
