const express = require("express");
const {
  getDashboardSummary,
  getRoiHistory,
  getReferralIncomeHistory,
} = require("../controllers/dashboardController");
const protectRoute = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protectRoute);
router.get("/summary", getDashboardSummary);
router.get("/roi-history", getRoiHistory);
router.get("/referral-income-history", getReferralIncomeHistory);

module.exports = router;
