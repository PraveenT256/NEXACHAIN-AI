const Investment = require("../models/Investment");
const RoiHistory = require("../models/RoiHistory");
const User = require("../models/User");
const { distributeLevelIncome } = require("./referralService");

function getRoiDateKey(date) {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

/**
 * Processes daily ROI for every active investment. Safe to call more than
 * once for the same day: RoiHistory has a unique index on
 * (investment, roiDate), so a duplicate run hits a 11000 error on the
 * insert and that investment is simply skipped instead of double-crediting.
 */
async function processDailyRoiForAllInvestments(referenceDate = new Date()) {
  const roiDate = getRoiDateKey(referenceDate);
  const activeInvestments = await Investment.find({ investmentStatus: "Active" });

  const summary = { processed: 0, skipped: 0, completed: 0, failed: 0 };

  for (const investment of activeInvestments) {
    try {
      const roiAmount = Number(
        ((investment.investmentAmount * investment.dailyRoiPercentage) / 100).toFixed(2)
      );

      const roiHistoryRecord = await RoiHistory.create({
        user: investment.user,
        investment: investment._id,
        roiAmount,
        date: referenceDate,
        roiDate,
        status: "Credited",
      });

      await User.findByIdAndUpdate(investment.user, {
        $inc: { walletBalance: roiAmount, totalRoiEarned: roiAmount },
      });

      const investingUser = await User.findById(investment.user);
      await distributeLevelIncome({
        investingUser,
        roiAmount,
        sourceInvestmentId: investment._id,
        roiHistoryId: roiHistoryRecord._id,
      });

      if (referenceDate >= investment.endDate) {
        investment.investmentStatus = "Completed";
        await investment.save();
        summary.completed += 1;
      }

      summary.processed += 1;
    } catch (error) {
      if (error.code === 11000) {
        // ROI for this investment/day already recorded, skip silently
        summary.skipped += 1;
      } else {
        summary.failed += 1;
        console.error(`ROI processing failed for investment ${investment._id}:`, error.message);
      }
    }
  }

  return summary;
}

module.exports = { processDailyRoiForAllInvestments, getRoiDateKey };
