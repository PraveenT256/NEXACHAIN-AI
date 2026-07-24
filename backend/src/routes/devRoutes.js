const express = require("express");
const { processDailyRoiForAllInvestments } = require("../services/roiService");
const protectRoute = require("../middleware/authMiddleware");

const router = express.Router();

// Manual trigger for the ROI cron job, useful for local testing without
// waiting for the scheduled midnight run. Same idempotent service is used,
// so calling it repeatedly the same day is safe.
router.post("/run-roi-cron", protectRoute, async (req, res, next) => {
  try {
    const summary = await processDailyRoiForAllInvestments();
    res.status(200).json({ success: true, message: "ROI cron executed", data: summary });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
