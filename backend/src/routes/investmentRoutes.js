const express = require("express");
const { createInvestment, getUserInvestments } = require("../controllers/investmentController");
const protectRoute = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protectRoute);
router.post("/", createInvestment);
router.get("/", getUserInvestments);

module.exports = router;
