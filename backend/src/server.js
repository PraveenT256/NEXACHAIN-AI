require("dotenv").config();

const app = require("./app");
const connectDatabase = require("./config/db");
const scheduleDailyRoiJob = require("./cron/roiCron");

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDatabase();
  scheduleDailyRoiJob();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
