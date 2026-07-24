const mongoose = require("mongoose");

const referralIncomeSchema = new mongoose.Schema(
  {
    beneficiary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // user who receives the income
    },
    sourceUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // user whose investment/ROI generated the income
    },
    sourceInvestment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Investment",
      required: true,
    },
    sourceRoiHistory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoiHistory",
      required: true,
      // links back to the exact ROI payout that triggered this level income,
      // used as the idempotency key so a payout is never credited twice
    },
    referralLevel: {
      type: Number,
      required: true,
      min: 1,
    },
    incomeAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

referralIncomeSchema.index({ beneficiary: 1, date: -1 });
referralIncomeSchema.index(
  { sourceRoiHistory: 1, beneficiary: 1 },
  { unique: true }
);

module.exports = mongoose.model("ReferralIncome", referralIncomeSchema);
