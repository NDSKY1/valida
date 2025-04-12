const express = require("express");
const router = express.Router();

const categoriesController = require("../controllers/categoriesController");

// Get all categories (with optional search)
router.get("/all", categoriesController.getAllCategories);

module.exports = router;
