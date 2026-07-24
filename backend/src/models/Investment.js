const mongoose = require("mongoose");

const investmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    investmentAmount: {
      type: Number,
      required: [true, "Investment amount is required"],
      min: [1, "Investment amount must be greater than zero"],
    },
    planName: {
      type: String,
      required: true,
    },
    planDurationInDays: {
      type: Number,
      required: true,
      min: 1,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    dailyRoiPercentage: {
      type: Number,
      required: true,
      min: 0,
    },
    investmentStatus: {
      type: String,
      enum: ["Active", "Completed", "Cancelled"],
      default: "Active",
    },
  },
  { timestamps: true }
);

investmentSchema.index({ user: 1 });
investmentSchema.index({ investmentStatus: 1 });

module.exports = mongoose.model("Investment", investmentSchema);
