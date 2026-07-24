const User = require("../models/User");
const ReferralIncome = require("../models/ReferralIncome");

function getLevelPercentages() {
  const raw = process.env.LEVEL_INCOME_PERCENTAGES || "10,5,3,2,1";
  return raw.split(",").map((value) => Number(value.trim()));
}

/**
 * Walks up the referral chain starting from the investor and credits
 * level income to each ancestor based on the ROI amount just paid out.
 * Each (sourceRoiHistory, beneficiary) pair is unique-indexed on
 * ReferralIncome, so re-running this for the same ROI payout is a no-op.
 */
async function distributeLevelIncome({ investingUser, roiAmount, sourceInvestmentId, roiHistoryId }) {
  const levelPercentages = getLevelPercentages();

  let currentUser = investingUser;

  for (let level = 1; level <= levelPercentages.length; level += 1) {
    if (!currentUser.referredBy) {
      break;
    }

    const upline = await User.findById(currentUser.referredBy);
    if (!upline) {
      break;
    }

    const percentage = levelPercentages[level - 1];
    const incomeAmount = Number(((roiAmount * percentage) / 100).toFixed(2));

    if (incomeAmount > 0) {
      try {
        await ReferralIncome.create({
          beneficiary: upline._id,
          sourceUser: investingUser._id,
          sourceInvestment: sourceInvestmentId,
          sourceRoiHistory: roiHistoryId,
          referralLevel: level,
          incomeAmount,
        });

        await User.findByIdAndUpdate(upline._id, {
          $inc: {
            walletBalance: incomeAmount,
            totalLevelIncomeEarned: incomeAmount,
          },
        });
      } catch (error) {
        // duplicate key means this level income was already credited for this ROI payout
        if (error.code !== 11000) {
          throw error;
        }
      }
    }

    currentUser = upline;
  }
}

module.exports = { distributeLevelIncome, getLevelPercentages };
