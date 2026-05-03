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

const PREBUILT_ITEMS = [
  {
    title: "Workers' Compensation Insurance",
    description: "Verify workers' compensation insurance is current and covers all employees.",
    category: "employment",
    recurrence: "annually",
    dueDate: null as string | null,
  },
  {
    title: "Wage & Hour Compliance Audit",
    description: "Review pay rates, overtime, and break policies comply with state labor law.",
    category: "employment",
    recurrence: "annually",
    dueDate: null as string | null,
  },
  {
    title: "Fire Extinguisher Inspection",
    description: "Ensure all fire extinguishers are inspected, tagged, and within service date.",
    category: "health_safety",
    recurrence: "annually",
    dueDate: null as string | null,
  },
  {
    title: "First Aid Kit Restocking",
    description: "Check and restock all first aid kits in the workplace.",
    category: "health_safety",
    recurrence: "quarterly",
    dueDate: null as string | null,
  },
  {
    title: "Business License Renewal",
    description: "Renew the local business operating license before expiration.",
    category: "licensing",
    recurrence: "annually",
    dueDate: null as string | null,
  },
  {
    title: "Food Handler Certifications",
    description: "Ensure all applicable staff hold valid food handler or food manager certifications.",
    category: "licensing",
    recurrence: "annually",
    dueDate: null as string | null,
  },
  {
    title: "Customer Data Review",
    description: "Audit what personal customer data is collected, stored, and who has access.",
    category: "data_privacy",
    recurrence: "annually",
    dueDate: null as string | null,
  },
];

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

  const inserted = await db
    .insert(complianceItemsTable)
    .values(
      PREBUILT_ITEMS.map((item) => ({
        ...item,
        workspaceId: ctx!.workspaceId,
        status: "pending",
      })),
    )
    .returning();

  res.status(201).json(
    inserted.map((item) => ({ ...item, status: computeStatus(item.dueDate, item.lastCompletedAt) })),
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
    status: computeStatus(item.dueDate, item.lastCompletedAt),
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

  res.status(201).json({ ...item, status: computeStatus(item.dueDate, null) });
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
      status: computeStatus(item.dueDate, item.lastCompletedAt),
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

  await db
    .update(complianceItemsTable)
    .set({ lastCompletedAt: completedAt, status: "completed" })
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

export default router;
