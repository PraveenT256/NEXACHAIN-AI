const express = require("express");
const { registerUser, loginUser, getCurrentUser } = require("../controllers/authController");
const protectRoute = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protectRoute, getCurrentUser);

module.exports = router;
