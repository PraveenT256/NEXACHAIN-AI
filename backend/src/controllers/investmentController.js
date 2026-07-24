const Investment = require("../models/Investment");
const AppError = require("../utils/AppError");

async function createInvestment(req, res, next) {
  try {
    const { investmentAmount, planName, planDurationInDays, dailyRoiPercentage } = req.body;

    if (!investmentAmount || !planName || !planDurationInDays || dailyRoiPercentage === undefined) {
      throw new AppError(
        "investmentAmount, planName, planDurationInDays and dailyRoiPercentage are required",
        400
      );
    }

    if (investmentAmount <= 0) {
      throw new AppError("investmentAmount must be greater than zero", 400);
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Number(planDurationInDays));

    const investment = await Investment.create({
      user: req.user._id,
      investmentAmount,
      planName,
      planDurationInDays,
      startDate,
      endDate,
      dailyRoiPercentage,
    });

    res.status(201).json({ success: true, message: "Investment created", data: investment });
  } catch (error) {
    next(error);
  }
}

async function getUserInvestments(req, res, next) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const [investments, totalCount] = await Promise.all([
      Investment.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Investment.countDocuments({ user: req.user._id }),
    ]);

    res.status(200).json({
      success: true,
      data: investments,
      pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { createInvestment, getUserInvestments };
