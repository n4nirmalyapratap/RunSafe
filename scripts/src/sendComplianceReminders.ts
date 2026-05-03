/**
 * Compliance reminder dispatcher — designed to be run on a daily cron
 * (e.g. a Replit Scheduled Deployment).
 *
 * Required environment variables:
 *   REMINDER_API_URL    — e.g. https://your-app.replit.app/api/compliance/send-reminders
 *   REMINDER_CRON_TOKEN — shared secret matching the API server's REMINDER_CRON_TOKEN
 *
 * The API server will look for items due in 7 days and 1 day, dedupe via
 * stored "reminder sent for due date" markers, and email the workspace owner.
 */

export {};

const url = process.env.REMINDER_API_URL;
const token = process.env.REMINDER_CRON_TOKEN;

if (!url) {
  console.error("REMINDER_API_URL is required");
  process.exit(1);
}
if (!token) {
  console.error("REMINDER_CRON_TOKEN is required");
  process.exit(1);
}

const res = await fetch(url, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});

const body = await res.text();

if (!res.ok) {
  console.error(`Reminder dispatch failed (${res.status}): ${body}`);
  process.exit(1);
}

console.log(`Reminder dispatch ok: ${body}`);
