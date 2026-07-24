const Investment = require("../models/Investment");
const RoiHistory = require("../models/RoiHistory");
const ReferralIncome = require("../models/ReferralIncome");

async function getDashboardSummary(req, res, next) {
  try {
    const userId = req.user._id;

    const [investmentAggregate, todayRoiAggregate] = await Promise.all([
      Investment.aggregate([
        { $match: { user: userId } },
        { $group: { _id: null, totalInvested: { $sum: "$investmentAmount" }, count: { $sum: 1 } } },
      ]),
      RoiHistory.aggregate([
        { $match: { user: userId, roiDate: new Date().toISOString().slice(0, 10) } },
        { $group: { _id: null, todayRoi: { $sum: "$roiAmount" } } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalInvestments: investmentAggregate[0]?.totalInvested || 0,
        totalInvestmentCount: investmentAggregate[0]?.count || 0,
        todayRoi: todayRoiAggregate[0]?.todayRoi || 0,
        totalRoiEarned: req.user.totalRoiEarned,
        totalLevelIncomeEarned: req.user.totalLevelIncomeEarned,
        walletBalance: req.user.walletBalance,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getRoiHistory(req, res, next) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const [roiHistory, totalCount] = await Promise.all([
      RoiHistory.find({ user: req.user._id })
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("investment", "planName investmentAmount")
        .lean(),
      RoiHistory.countDocuments({ user: req.user._id }),
    ]);

    res.status(200).json({
      success: true,
      data: roiHistory,
      pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) },
    });
  } catch (error) {
    next(error);
  }
}

async function getReferralIncomeHistory(req, res, next) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const [incomeHistory, totalCount] = await Promise.all([
      ReferralIncome.find({ beneficiary: req.user._id })
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("sourceUser", "fullName email")
        .lean(),
      ReferralIncome.countDocuments({ beneficiary: req.user._id }),
    ]);

    res.status(200).json({
      success: true,
      data: incomeHistory,
      pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getDashboardSummary, getRoiHistory, getReferralIncomeHistory };
