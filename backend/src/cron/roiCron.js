const cron = require("node-cron");
const { processDailyRoiForAllInvestments } = require("../services/roiService");

function scheduleDailyRoiJob() {
  // runs every day at 12:00 AM server time
  cron.schedule("0 0 * * *", async () => {
    console.log(`[ROI Cron] Starting daily ROI run at ${new Date().toISOString()}`);
    try {
      const summary = await processDailyRoiForAllInvestments();
      console.log("[ROI Cron] Completed:", summary);
    } catch (error) {
      console.error("[ROI Cron] Failed:", error.message);
    }
  });
}

module.exports = scheduleDailyRoiJob;
