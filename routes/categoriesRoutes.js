const express = require("express");
const router = express.Router();
const uploadMiddleware = require("../middlewares/uploadMiddleware");


const categoriesController = require("../controllers/categoriesController");

// Get all categories (with optional search)
router.get("/all", categoriesController.getAllCategories);

// router.post("/addCategory" ,addCategory);
router.post(
  "/addCategory",
  uploadMiddleware.single("img"), // 👈 image file input name is "img"
  categoriesController.addCategory
);
router.put(
  "/updatecategories/:id",
  uploadMiddleware.single("img"),
  categoriesController.editCategory
);
router.delete("/deletecategories/:id", categoriesController.deleteCategory); // 👈 DELETE route







module.exports = router;
