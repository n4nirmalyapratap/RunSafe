import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { eq, and, desc, isNotNull, sql } from "drizzle-orm";
import { db, complianceItemsTable, complianceCompletionsTable, workspacesTable } from "@workspace/db";
import { sendEmail } from "../lib/email";
import {
  GetComplianceItemsQueryParams,
  GetComplianceItemsResponse,
  CreateComplianceItemBody,
  UpdateComplianceItemParams,
  UpdateComplianceItemBody,
  UpdateComplianceItemResponse,
  DeleteComplianceItemParams,
  CompleteComplianceItemParams,
  CompleteComplianceItemBody,
  GetComplianceAuditLogResponse,
} from "@workspace/api-zod";
import { requireAuth, getClerkUserId } from "../middlewares/requireAuth";
import { getWorkspaceContext } from "../lib/workspaceContext";
import { createClerkClient } from "@clerk/express";
import { runComplianceReminderScan } from "../lib/complianceReminders";
import { resolveComplianceTemplates } from "../lib/complianceCatalog";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const router: IRouter = Router();

function computeStatus(
  dueDate: string | null,
  lastCompletedAt: Date | null,
  persistedStatus?: string | null,
): string {
  // Trust the persisted "completed" status — the complete endpoint sets it
  // explicitly for one-time items, and resets recurring items to "pending"
  // with a fresh dueDate. This prevents one-time completed items from
  // being recomputed as overdue/upcoming.
  if (persistedStatus === "completed") return "completed";
  if (!dueDate) {
    return lastCompletedAt ? "completed" : "pending";
  }
  const due = new Date(dueDate);
  const now = new Date();
  const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return "overdue";
  if (diffDays <= 30) return "upcoming";
  return "pending";
}

function advanceDueDate(currentDueDate: string | null, recurrence: string): string | null {
  const base = currentDueDate ? new Date(currentDueDate) : new Date();
  const d = new Date(base);
  switch (recurrence) {
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "quarterly":
      d.setMonth(d.getMonth() + 3);
      break;
    case "annually":
      d.setFullYear(d.getFullYear() + 1);
      break;
    default:
      return null;
  }
  // Roll forward until in the future, in case the original due date was old
  const today = new Date();
  while (d < today) {
    switch (recurrence) {
      case "monthly":
        d.setMonth(d.getMonth() + 1);
        break;
      case "quarterly":
        d.setMonth(d.getMonth() + 3);
        break;
      case "annually":
        d.setFullYear(d.getFullYear() + 1);
        break;
    }
  }
  return d.toISOString().split("T")[0];
}

function requireOwnerWithPlan(
  ctx: { role: string; plan: string } | null,
  requiredPlan: "growth" | "pro" = "growth",
): string | null {
  if (!ctx) return "Workspace not found";
  if (ctx.role !== "owner") return "Only workspace owners can access compliance features";
  const planRank: Record<string, number> = { starter: 0, growth: 1, pro: 2 };
  if ((planRank[ctx.plan] ?? 0) < (planRank[requiredPlan] ?? 1)) {
    return `This feature requires the ${requiredPlan} plan or higher`;
  }
  return null;
}


router.post("/compliance/initialize", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  const authErr = requireOwnerWithPlan(ctx);
  if (authErr) {
    res.status(ctx ? 403 : 404).json({ error: authErr });
    return;
  }

  const existing = await db
    .select()
    .from(complianceItemsTable)
    .where(eq(complianceItemsTable.workspaceId, ctx!.workspaceId));

  if (existing.length > 0) {
    res.status(409).json({ error: "Compliance items already initialized" });
    return;
  }

  // Resolve templates for this workspace's jurisdiction + industry
  const [ws] = await db
    .select()
    .from(workspacesTable)
    .where(eq(workspacesTable.id, ctx!.workspaceId));

  const templates = resolveComplianceTemplates({
    country: ws?.country ?? null,
    state: ws?.state ?? null,
    industry: ws?.industry ?? null,
  });

  if (templates.length === 0) {
    res.status(500).json({ error: "Compliance catalog returned no items" });
    return;
  }

  const inserted = await db
    .insert(complianceItemsTable)
    .values(
      templates.map((t) => ({
        title: t.title,
        description: t.description,
        category: t.category,
        recurrence: t.recurrence,
        dueDate: t.dueDate ?? undefined,
        workspaceId: ctx!.workspaceId,
        status: "pending",
      })),
    )
    .returning();

  res.status(201).json(
    inserted.map((item) => ({
      ...item,
      status: computeStatus(item.dueDate, item.lastCompletedAt, item.status),
    })),
  );
});

router.get("/compliance/items", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  const authErr = requireOwnerWithPlan(ctx);
  if (authErr) {
    res.status(ctx ? 403 : 404).json({ error: authErr });
    return;
  }

  const params = GetComplianceItemsQueryParams.safeParse(req.query);

  const items = await db
    .select()
    .from(complianceItemsTable)
    .where(
      params.success && params.data.category
        ? and(
            eq(complianceItemsTable.workspaceId, ctx!.workspaceId),
            eq(complianceItemsTable.category, params.data.category),
          )
        : eq(complianceItemsTable.workspaceId, ctx!.workspaceId),
    );

  const enriched = items.map((item) => ({
    ...item,
    status: computeStatus(item.dueDate, item.lastCompletedAt, item.status),
  }));

  res.json(GetComplianceItemsResponse.parse(enriched));
});

router.post("/compliance/items", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  const authErr = requireOwnerWithPlan(ctx);
  if (authErr) {
    res.status(ctx ? 403 : 404).json({ error: authErr });
    return;
  }

  const parsed = CreateComplianceItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { dueDate: dueDateRaw, ...complianceRest } = parsed.data;
  const [item] = await db
    .insert(complianceItemsTable)
    .values({
      ...complianceRest,
      workspaceId: ctx!.workspaceId,
      status: "pending",
      dueDate: dueDateRaw ? (dueDateRaw as Date).toISOString().split("T")[0] : undefined,
    })
    .returning();

  res.status(201).json({
    ...item,
    status: computeStatus(item.dueDate, null, item.status),
  });
});

router.patch("/compliance/items/:itemId", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  const authErr = requireOwnerWithPlan(ctx);
  if (authErr) {
    res.status(ctx ? 403 : 404).json({ error: authErr });
    return;
  }

  const params = UpdateComplianceItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateComplianceItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { dueDate: updateDueDateRaw, ...updateRest } = parsed.data;
  const updatePayload = {
    ...updateRest,
    ...(updateDueDateRaw !== undefined
      ? { dueDate: updateDueDateRaw ? (updateDueDateRaw as Date).toISOString().split("T")[0] : null }
      : {}),
  };
  const [item] = await db
    .update(complianceItemsTable)
    .set(updatePayload)
    .where(
      and(
        eq(complianceItemsTable.id, params.data.itemId),
        eq(complianceItemsTable.workspaceId, ctx!.workspaceId),
      ),
    )
    .returning();

  if (!item) {
    res.status(404).json({ error: "Compliance item not found" });
    return;
  }

  res.json(
    UpdateComplianceItemResponse.parse({
      ...item,
      status: computeStatus(item.dueDate, item.lastCompletedAt, item.status),
    }),
  );
});

router.delete("/compliance/items/:itemId", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  const authErr = requireOwnerWithPlan(ctx);
  if (authErr) {
    res.status(ctx ? 403 : 404).json({ error: authErr });
    return;
  }

  const params = DeleteComplianceItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db
    .delete(complianceItemsTable)
    .where(
      and(
        eq(complianceItemsTable.id, params.data.itemId),
        eq(complianceItemsTable.workspaceId, ctx!.workspaceId),
      ),
    );

  res.sendStatus(204);
});

router.post("/compliance/items/:itemId/complete", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  const authErr = requireOwnerWithPlan(ctx);
  if (authErr) {
    res.status(ctx ? 403 : 404).json({ error: authErr });
    return;
  }

  const params = CompleteComplianceItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CompleteComplianceItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existingItem] = await db
    .select()
    .from(complianceItemsTable)
    .where(
      and(
        eq(complianceItemsTable.id, params.data.itemId),
        eq(complianceItemsTable.workspaceId, ctx!.workspaceId),
      ),
    );

  if (!existingItem) {
    res.status(404).json({ error: "Compliance item not found" });
    return;
  }

  const completedAt = parsed.data.completedAt ? new Date(parsed.data.completedAt) : new Date();

  let completedByName = "Team Member";
  try {
    const clerkUser = await clerk.users.getUser(clerkId);
    const firstName = clerkUser.firstName ?? "";
    const lastName = clerkUser.lastName ?? "";
    const fullName = `${firstName} ${lastName}`.trim();
    if (fullName) completedByName = fullName;
  } catch {
    // non-fatal — fall back to default
  }

  // For recurring items, advance the due date and reset reminder tracking + status
  const nextDueDate =
    existingItem.recurrence !== "one_time"
      ? advanceDueDate(existingItem.dueDate, existingItem.recurrence)
      : null;

  const updatePayload: Record<string, unknown> = {
    lastCompletedAt: completedAt,
  };
  if (nextDueDate) {
    updatePayload.dueDate = nextDueDate;
    updatePayload.status = "pending";
    updatePayload.reminder7SentForDueDate = null;
    updatePayload.reminder1SentForDueDate = null;
  } else {
    updatePayload.status = "completed";
  }

  await db
    .update(complianceItemsTable)
    .set(updatePayload)
    .where(
      and(
        eq(complianceItemsTable.id, params.data.itemId),
        eq(complianceItemsTable.workspaceId, ctx!.workspaceId),
      ),
    );

  const [updatedItem] = await db
    .select()
    .from(complianceItemsTable)
    .where(eq(complianceItemsTable.id, params.data.itemId));

  const [completion] = await db
    .insert(complianceCompletionsTable)
    .values({
      complianceItemId: params.data.itemId,
      completedByClerkId: clerkId,
      completedByName,
      notes: parsed.data.notes ?? null,
      completedAt,
    })
    .returning();

  res.status(201).json({
    ...completion,
    complianceItemTitle: updatedItem?.title ?? "",
  });
});

router.get("/compliance/audit-log", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  const authErr = requireOwnerWithPlan(ctx);
  if (authErr) {
    res.status(ctx ? 403 : 404).json({ error: authErr });
    return;
  }

  const entries = await db
    .select({
      id: complianceCompletionsTable.id,
      complianceItemId: complianceCompletionsTable.complianceItemId,
      complianceItemTitle: complianceItemsTable.title,
      completedByClerkId: complianceCompletionsTable.completedByClerkId,
      completedByName: complianceCompletionsTable.completedByName,
      notes: complianceCompletionsTable.notes,
      completedAt: complianceCompletionsTable.completedAt,
    })
    .from(complianceCompletionsTable)
    .innerJoin(
      complianceItemsTable,
      eq(complianceItemsTable.id, complianceCompletionsTable.complianceItemId),
    )
    .where(eq(complianceItemsTable.workspaceId, ctx!.workspaceId))
    .orderBy(desc(complianceCompletionsTable.completedAt));

  res.json(GetComplianceAuditLogResponse.parse(entries));
});

// Manual trigger so an owner can run a reminder scan on demand
// (useful for testing and immediate notifications). Owner-only.
router.post("/compliance/reminders/run", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  const authErr = requireOwnerWithPlan(ctx);
  if (authErr) {
    res.status(ctx ? 403 : 404).json({ error: authErr });
    return;
  }
  const result = await runComplianceReminderScan();
  res.json(result);
});

// ─── Compliance reminder cron endpoint ─────────────────────────
// Auth via shared bearer token (REMINDER_CRON_TOKEN). Designed to be invoked
// by a Replit Scheduled Deployment / external cron once a day.
function requireCronToken(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env.REMINDER_CRON_TOKEN;
  if (!expected) {
    res.status(500).json({ error: "REMINDER_CRON_TOKEN not configured" });
    return;
  }
  const header = req.header("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : header;
  if (provided !== expected) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

router.post("/compliance/send-reminders", requireCronToken, async (_req, res): Promise<void> => {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const sevenDaysOut = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const oneDayOut = new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // Fetch candidate items (have a due date, not completed-and-non-recurring already past).
  const items = await db
    .select({
      id: complianceItemsTable.id,
      workspaceId: complianceItemsTable.workspaceId,
      title: complianceItemsTable.title,
      dueDate: complianceItemsTable.dueDate,
      reminder7SentForDueDate: complianceItemsTable.reminder7SentForDueDate,
      reminder1SentForDueDate: complianceItemsTable.reminder1SentForDueDate,
      ownerClerkId: workspacesTable.ownerClerkId,
      workspaceName: workspacesTable.name,
    })
    .from(complianceItemsTable)
    .innerJoin(workspacesTable, eq(workspacesTable.id, complianceItemsTable.workspaceId))
    .where(
      and(
        isNotNull(complianceItemsTable.dueDate),
        sql`${complianceItemsTable.status} != 'completed'`,
      ),
    );

  let sent = 0;
  let skipped = 0;
  const ownerEmailCache = new Map<string, string | null>();

  async function getOwnerEmail(clerkId: string): Promise<string | null> {
    if (ownerEmailCache.has(clerkId)) return ownerEmailCache.get(clerkId)!;
    try {
      const user = await clerk.users.getUser(clerkId);
      const email =
        user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ?? null;
      ownerEmailCache.set(clerkId, email);
      return email;
    } catch {
      ownerEmailCache.set(clerkId, null);
      return null;
    }
  }

  for (const item of items) {
    if (!item.dueDate) continue;

    const isSevenDayWindow = item.dueDate === sevenDaysOut;
    const isOneDayWindow = item.dueDate === oneDayOut || item.dueDate === todayStr;
    if (!isSevenDayWindow && !isOneDayWindow) continue;

    const alreadySent =
      (isSevenDayWindow && item.reminder7SentForDueDate === item.dueDate) ||
      (isOneDayWindow && item.reminder1SentForDueDate === item.dueDate);
    if (alreadySent) {
      skipped++;
      continue;
    }

    const email = await getOwnerEmail(item.ownerClerkId);
    if (!email) {
      skipped++;
      continue;
    }

    const window = isSevenDayWindow ? "7 days" : "1 day";
    const subject = `RunSafe reminder: "${item.title}" is due in ${window}`;
    const html = `
      <p>Hi there,</p>
      <p>This is a friendly reminder from <strong>RunSafe</strong> for <strong>${item.workspaceName}</strong>.</p>
      <p>The compliance item <strong>${item.title}</strong> is due on <strong>${item.dueDate}</strong> (${window} from today).</p>
      <p>Open RunSafe to mark it complete or update the due date.</p>
    `;
    const text = `Reminder: "${item.title}" is due on ${item.dueDate} (${window} from today). Open RunSafe to take action.`;

    const result = await sendEmail({ to: email, subject, html, text });
    if (!result.ok) {
      skipped++;
      continue;
    }

    const updatePayload: Record<string, unknown> = {};
    if (isSevenDayWindow) updatePayload.reminder7SentForDueDate = item.dueDate;
    if (isOneDayWindow) updatePayload.reminder1SentForDueDate = item.dueDate;

    await db
      .update(complianceItemsTable)
      .set(updatePayload)
      .where(eq(complianceItemsTable.id, item.id));

    sent++;
  }

  res.json({ sent, skipped, scanned: items.length });
});

export default router;
