import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

// Set up cron jobs
const crons = cronJobs();

// Run sendSpendingSummary every day at 7pm Philippine time (UTC+8)
// 11am UTC = 7pm Philippine time
crons.cron("send-daily-spending-summary", "0 11 * * *", internal.telegramBot.sendSpendingSummary, {});

export default crons; 