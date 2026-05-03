import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, complianceItemsTable, complianceCompletionsTable } from "@workspace/db";
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

const router: IRouter = Router();

function computeStatus(dueDate: string | null, lastCompletedAt: Date | null): string {
  if (!dueDate) return "pending";
  const due = new Date(dueDate);
  const now = new Date();
  const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return "overdue";
  if (diffDays <= 30) return "upcoming";
  return "pending";
}

router.get("/compliance/items", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx) {
    res.json([]);
    return;
  }

  const params = GetComplianceItemsQueryParams.safeParse(req.query);

  const items = await db
    .select()
    .from(complianceItemsTable)
    .where(
      params.success && params.data.category
        ? and(
            eq(complianceItemsTable.workspaceId, ctx.workspaceId),
            eq(complianceItemsTable.category, params.data.category),
          )
        : eq(complianceItemsTable.workspaceId, ctx.workspaceId),
    );

  const enriched = items.map((item) => ({
    ...item,
    status: computeStatus(item.dueDate, item.lastCompletedAt),
  }));

  res.json(GetComplianceItemsResponse.parse(enriched));
});

router.post("/compliance/items", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }

  if (ctx.role !== "owner") {
    res.status(403).json({ error: "Only workspace owners can create compliance items" });
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
      workspaceId: ctx.workspaceId,
      status: "pending",
      dueDate: dueDateRaw ? (dueDateRaw as Date).toISOString().split("T")[0] : undefined,
    })
    .returning();

  res.status(201).json({ ...item, status: computeStatus(item.dueDate, null) });
});

router.patch("/compliance/items/:itemId", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }

  if (ctx.role !== "owner") {
    res.status(403).json({ error: "Only workspace owners can update compliance items" });
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
        eq(complianceItemsTable.workspaceId, ctx.workspaceId),
      ),
    )
    .returning();

  if (!item) {
    res.status(404).json({ error: "Compliance item not found" });
    return;
  }

  res.json(UpdateComplianceItemResponse.parse({ ...item, status: computeStatus(item.dueDate, item.lastCompletedAt) }));
});

router.delete("/compliance/items/:itemId", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }

  if (ctx.role !== "owner") {
    res.status(403).json({ error: "Only workspace owners can delete compliance items" });
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
        eq(complianceItemsTable.workspaceId, ctx.workspaceId),
      ),
    );

  res.sendStatus(204);
});

router.post("/compliance/items/:itemId/complete", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx) {
    res.status(404).json({ error: "Workspace not found" });
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
        eq(complianceItemsTable.workspaceId, ctx.workspaceId),
      ),
    );

  if (!existingItem) {
    res.status(404).json({ error: "Compliance item not found" });
    return;
  }

  const completedAt = parsed.data.completedAt ? new Date(parsed.data.completedAt) : new Date();

  await db
    .update(complianceItemsTable)
    .set({ lastCompletedAt: completedAt, status: "completed" })
    .where(
      and(
        eq(complianceItemsTable.id, params.data.itemId),
        eq(complianceItemsTable.workspaceId, ctx.workspaceId),
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
      completedByName: "Team Member",
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
  if (!ctx) {
    res.json([]);
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
    .innerJoin(complianceItemsTable, eq(complianceItemsTable.id, complianceCompletionsTable.complianceItemId))
    .where(eq(complianceItemsTable.workspaceId, ctx.workspaceId))
    .orderBy(desc(complianceCompletionsTable.completedAt));

  res.json(GetComplianceAuditLogResponse.parse(entries));
});

export default router;
