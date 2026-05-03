import { eq, and, lte, isNull, or, sql } from "drizzle-orm";
import {
  db,
  complianceItemsTable,
  workspacesTable,
} from "@workspace/db";
import { createClerkClient } from "@clerk/express";
import { logger } from "./logger";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const REMINDER_WINDOW_DAYS = 7;
const REMINDER_COOLDOWN_HOURS = 24;

export interface ReminderResult {
  scanned: number;
  emailed: number;
  skippedNoOwner: number;
  skippedRecent: number;
  failures: number;
}

/**
 * Send a transactional email via Resend if RESEND_API_KEY is configured.
 * Falls back to a structured log line otherwise so reminders are at least
 * traceable without external service setup.
 */
async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.RUNSAFE_REMINDER_FROM ||
    "RunSafe Compliance <reminders@runsafe.app>";

  if (!apiKey) {
    logger.info(
      { to: args.to, subject: args.subject },
      "[compliance-reminder] RESEND_API_KEY not set; logging instead of sending",
    );
    return true; // treat as "sent" so cooldown still applies
  }

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [args.to],
        subject: args.subject,
        html: args.html,
        text: args.text,
      }),
    });
    if (!resp.ok) {
      const body = await resp.text();
      logger.warn(
        { status: resp.status, body, to: args.to },
        "[compliance-reminder] Resend API rejected message",
      );
      return false;
    }
    return true;
  } catch (err) {
    logger.warn(
      { err: err instanceof Error ? err.message : String(err), to: args.to },
      "[compliance-reminder] Resend request failed",
    );
    return false;
  }
}

function buildEmail(
  workspaceName: string,
  items: Array<{ title: string; dueDate: string; daysUntilDue: number; status: "overdue" | "upcoming" }>,
): { subject: string; html: string; text: string } {
  const overdue = items.filter((i) => i.status === "overdue");
  const upcoming = items.filter((i) => i.status === "upcoming");

  const subject = overdue.length
    ? `[RunSafe] ${overdue.length} overdue compliance item${overdue.length > 1 ? "s" : ""}`
    : `[RunSafe] ${upcoming.length} compliance deadline${upcoming.length > 1 ? "s" : ""} this week`;

  const lines: string[] = [
    `Compliance reminder for ${workspaceName}:`,
    "",
  ];
  if (overdue.length) {
    lines.push("OVERDUE:");
    for (const it of overdue) {
      lines.push(`  - ${it.title} (was due ${it.dueDate}, ${Math.abs(it.daysUntilDue)} day(s) ago)`);
    }
    lines.push("");
  }
  if (upcoming.length) {
    lines.push("UPCOMING (next 7 days):");
    for (const it of upcoming) {
      lines.push(`  - ${it.title} (due ${it.dueDate}, in ${it.daysUntilDue} day(s))`);
    }
    lines.push("");
  }
  lines.push("Sign in to RunSafe to mark items complete.");
  const text = lines.join("\n");

  const overdueHtml = overdue.length
    ? `<h3 style="color:#b91c1c;margin:16px 0 8px">Overdue</h3><ul>${overdue
        .map(
          (i) =>
            `<li><strong>${i.title}</strong> — was due ${i.dueDate} (${Math.abs(i.daysUntilDue)} day(s) ago)</li>`,
        )
        .join("")}</ul>`
    : "";
  const upcomingHtml = upcoming.length
    ? `<h3 style="margin:16px 0 8px">Upcoming (next 7 days)</h3><ul>${upcoming
        .map(
          (i) =>
            `<li><strong>${i.title}</strong> — due ${i.dueDate} (in ${i.daysUntilDue} day(s))</li>`,
        )
        .join("")}</ul>`
    : "";

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px">
      <h2>Compliance reminder</h2>
      <p>Workspace: <strong>${workspaceName}</strong></p>
      ${overdueHtml}
      ${upcomingHtml}
      <p style="margin-top:24px;color:#666;font-size:13px">
        Sign in to RunSafe to mark items complete.
      </p>
    </div>
  `.trim();

  return { subject, html, text };
}

/**
 * Scan all compliance items, find ones that are overdue OR due within
 * REMINDER_WINDOW_DAYS, group by workspace, and email the workspace owner.
 * Honors a per-item cooldown via lastReminderSentAt.
 */
export async function runComplianceReminderScan(): Promise<ReminderResult> {
  const result: ReminderResult = {
    scanned: 0,
    emailed: 0,
    skippedNoOwner: 0,
    skippedRecent: 0,
    failures: 0,
  };

  const now = new Date();
  const window = new Date(now.getTime() + REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const cooldownCutoff = new Date(now.getTime() - REMINDER_COOLDOWN_HOURS * 60 * 60 * 1000);

  const dueIso = window.toISOString().split("T")[0];

  const candidates = await db
    .select({
      id: complianceItemsTable.id,
      workspaceId: complianceItemsTable.workspaceId,
      title: complianceItemsTable.title,
      dueDate: complianceItemsTable.dueDate,
      lastCompletedAt: complianceItemsTable.lastCompletedAt,
      lastReminderSentAt: complianceItemsTable.lastReminderSentAt,
    })
    .from(complianceItemsTable)
    .where(
      and(
        sql`${complianceItemsTable.dueDate} IS NOT NULL`,
        lte(complianceItemsTable.dueDate, dueIso),
        isNull(complianceItemsTable.lastCompletedAt),
      ),
    );

  result.scanned = candidates.length;
  if (candidates.length === 0) return result;

  // Group by workspace, applying cooldown filter
  const byWorkspace = new Map<
    number,
    Array<{
      id: number;
      title: string;
      dueDate: string;
      daysUntilDue: number;
      status: "overdue" | "upcoming";
    }>
  >();

  for (const c of candidates) {
    if (!c.dueDate) continue;
    if (c.lastReminderSentAt && c.lastReminderSentAt > cooldownCutoff) {
      result.skippedRecent++;
      continue;
    }
    const due = new Date(c.dueDate);
    const days = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const status: "overdue" | "upcoming" = days < 0 ? "overdue" : "upcoming";
    const list = byWorkspace.get(c.workspaceId) ?? [];
    list.push({ id: c.id, title: c.title, dueDate: c.dueDate, daysUntilDue: days, status });
    byWorkspace.set(c.workspaceId, list);
  }

  for (const [workspaceId, items] of byWorkspace) {
    const [ws] = await db
      .select()
      .from(workspacesTable)
      .where(eq(workspacesTable.id, workspaceId));
    if (!ws) {
      result.skippedNoOwner += items.length;
      continue;
    }
    let ownerEmail: string | null = null;
    try {
      const u = await clerk.users.getUser(ws.ownerClerkId);
      ownerEmail =
        u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ?? null;
    } catch {
      ownerEmail = null;
    }
    if (!ownerEmail) {
      result.skippedNoOwner += items.length;
      continue;
    }

    const { subject, html, text } = buildEmail(ws.name, items);
    const ok = await sendEmail({ to: ownerEmail, subject, html, text });

    if (ok) {
      const ids = items.map((i) => i.id);
      await db
        .update(complianceItemsTable)
        .set({ lastReminderSentAt: now })
        .where(
          and(
            eq(complianceItemsTable.workspaceId, workspaceId),
            or(...ids.map((id) => eq(complianceItemsTable.id, id))),
          ),
        );
      result.emailed += items.length;
    } else {
      result.failures += items.length;
    }
  }

  return result;
}

let timer: NodeJS.Timeout | null = null;

export function startComplianceReminderScheduler(): void {
  if (timer) return;
  const intervalMs = 6 * 60 * 60 * 1000; // every 6 hours

  const tick = async () => {
    try {
      const r = await runComplianceReminderScan();
      logger.info(r, "[compliance-reminder] scan complete");
    } catch (err) {
      logger.error(
        { err: err instanceof Error ? err.message : String(err) },
        "[compliance-reminder] scan failed",
      );
    }
  };

  // First run shortly after startup, then on interval
  setTimeout(tick, 30_000).unref();
  timer = setInterval(tick, intervalMs);
  timer.unref();
  logger.info({ intervalHours: 6 }, "[compliance-reminder] scheduler started");
}
