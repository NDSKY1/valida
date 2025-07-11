const express = require("express");
const router = express.Router();
const uploadMiddleware = require("../middlewares/uploadMiddleware");
const upload = require("../middlewares/upload");


const {
  adminLogin,
} = require("../controllers/adminController");


router.post("/login", adminLogin);



module.exports = router;
