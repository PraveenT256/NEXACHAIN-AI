const mongoose = require("mongoose");

const roiHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    investment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Investment",
      required: true,
    },
    roiAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    // calendar day (YYYY-MM-DD) the ROI was generated for; combined with a
    // unique index on (investment, roiDate) this guarantees the daily cron
    // can run twice without ever double-crediting the same investment
    roiDate: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Credited", "Failed"],
      default: "Credited",
    },
  },
  { timestamps: true }
);

roiHistorySchema.index({ investment: 1, roiDate: 1 }, { unique: true });
roiHistorySchema.index({ user: 1, date: -1 });

module.exports = mongoose.model("RoiHistory", roiHistorySchema);
