import { Router, type IRouter } from "express";
import { eq, and, asc, sql } from "drizzle-orm";
import { db, sopsTable, sopStepsTable, teamMembersTable, taskAssignmentsTable } from "@workspace/db";
import {
  GetSopsQueryParams,
  GetSopsResponse,
  GetSopParams,
  GetSopResponse,
  CreateSopBody,
  UpdateSopParams,
  UpdateSopBody,
  UpdateSopResponse,
  DeleteSopParams,
  AddSopStepParams,
  AddSopStepBody,
  ReorderSopStepsParams,
  ReorderSopStepsBody,
  UpdateSopStepParams,
  UpdateSopStepBody,
  UpdateSopStepResponse,
  DeleteSopStepParams,
  AssignSopParams,
  AssignSopBody,
} from "@workspace/api-zod";
import { requireAuth, getClerkUserId } from "../middlewares/requireAuth";
import { getWorkspaceContext } from "../lib/workspaceContext";

const router: IRouter = Router();

router.get("/sops", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx) {
    res.json([]);
    return;
  }

  const params = GetSopsQueryParams.safeParse(req.query);

  const query = db
    .select({
      id: sopsTable.id,
      workspaceId: sopsTable.workspaceId,
      title: sopsTable.title,
      description: sopsTable.description,
      category: sopsTable.category,
      createdByClerkId: sopsTable.createdByClerkId,
      createdAt: sopsTable.createdAt,
      updatedAt: sopsTable.updatedAt,
      stepCount: sql<number>`count(${sopStepsTable.id})::int`,
    })
    .from(sopsTable)
    .leftJoin(sopStepsTable, eq(sopStepsTable.sopId, sopsTable.id))
    .where(
      params.success && params.data.category
        ? and(eq(sopsTable.workspaceId, ctx.workspaceId), eq(sopsTable.category, params.data.category))
        : eq(sopsTable.workspaceId, ctx.workspaceId),
    )
    .groupBy(sopsTable.id)
    .orderBy(asc(sopsTable.createdAt));

  const sops = await query;
  res.json(GetSopsResponse.parse(sops));
});

router.post("/sops", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }

  if (ctx.role !== "owner") {
    res.status(403).json({ error: "Only workspace owners can create SOPs" });
    return;
  }

  const parsed = CreateSopBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [sop] = await db
    .insert(sopsTable)
    .values({ ...parsed.data, workspaceId: ctx.workspaceId, createdByClerkId: clerkId })
    .returning();

  res.status(201).json({ ...sop, stepCount: 0 });
});

router.get("/sops/:sopId", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }

  const params = GetSopParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [sop] = await db
    .select()
    .from(sopsTable)
    .where(and(eq(sopsTable.id, params.data.sopId), eq(sopsTable.workspaceId, ctx.workspaceId)));

  if (!sop) {
    res.status(404).json({ error: "SOP not found" });
    return;
  }

  const steps = await db
    .select()
    .from(sopStepsTable)
    .where(eq(sopStepsTable.sopId, sop.id))
    .orderBy(asc(sopStepsTable.orderIndex));

  const assignments = await db
    .select({
      id: taskAssignmentsTable.id,
      assigneeName: teamMembersTable.name,
      assigneeEmail: teamMembersTable.email,
      status: taskAssignmentsTable.status,
      dueDate: taskAssignmentsTable.dueDate,
      createdAt: taskAssignmentsTable.createdAt,
    })
    .from(taskAssignmentsTable)
    .innerJoin(teamMembersTable, eq(teamMembersTable.id, taskAssignmentsTable.assigneeId))
    .where(eq(taskAssignmentsTable.sopId, sop.id))
    .orderBy(asc(taskAssignmentsTable.createdAt));

  res.json(GetSopResponse.parse({ ...sop, steps, assignments }));
});

router.patch("/sops/:sopId", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }

  if (ctx.role !== "owner") {
    res.status(403).json({ error: "Only workspace owners can update SOPs" });
    return;
  }

  const params = UpdateSopParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateSopBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [sop] = await db
    .update(sopsTable)
    .set(parsed.data)
    .where(and(eq(sopsTable.id, params.data.sopId), eq(sopsTable.workspaceId, ctx.workspaceId)))
    .returning();

  if (!sop) {
    res.status(404).json({ error: "SOP not found" });
    return;
  }

  const stepCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sopStepsTable)
    .where(eq(sopStepsTable.sopId, sop.id));

  res.json(UpdateSopResponse.parse({ ...sop, stepCount: stepCount[0]?.count ?? 0 }));
});

router.delete("/sops/:sopId", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }

  if (ctx.role !== "owner") {
    res.status(403).json({ error: "Only workspace owners can delete SOPs" });
    return;
  }

  const params = DeleteSopParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db
    .delete(sopsTable)
    .where(and(eq(sopsTable.id, params.data.sopId), eq(sopsTable.workspaceId, ctx.workspaceId)));

  res.sendStatus(204);
});

router.post("/sops/:sopId/steps", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }

  if (ctx.role !== "owner") {
    res.status(403).json({ error: "Only workspace owners can add SOP steps" });
    return;
  }

  const params = AddSopStepParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [sop] = await db
    .select()
    .from(sopsTable)
    .where(and(eq(sopsTable.id, params.data.sopId), eq(sopsTable.workspaceId, ctx.workspaceId)));

  if (!sop) {
    res.status(404).json({ error: "SOP not found" });
    return;
  }

  const parsed = AddSopStepBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existingSteps = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sopStepsTable)
    .where(eq(sopStepsTable.sopId, params.data.sopId));

  const orderIndex = parsed.data.orderIndex ?? (existingSteps[0]?.count ?? 0);

  const [step] = await db
    .insert(sopStepsTable)
    .values({ ...parsed.data, sopId: params.data.sopId, orderIndex })
    .returning();

  res.status(201).json(step);
});

router.put("/sops/:sopId/steps", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }

  if (ctx.role !== "owner") {
    res.status(403).json({ error: "Only workspace owners can reorder SOP steps" });
    return;
  }

  const params = ReorderSopStepsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [sop] = await db
    .select()
    .from(sopsTable)
    .where(and(eq(sopsTable.id, params.data.sopId), eq(sopsTable.workspaceId, ctx.workspaceId)));

  if (!sop) {
    res.status(404).json({ error: "SOP not found" });
    return;
  }

  const parsed = ReorderSopStepsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates = parsed.data.stepIds.map((stepId, index) =>
    db
      .update(sopStepsTable)
      .set({ orderIndex: index })
      .where(and(eq(sopStepsTable.id, stepId), eq(sopStepsTable.sopId, params.data.sopId)))
      .returning(),
  );

  const results = await Promise.all(updates);
  const steps = results.flatMap((r) => r);

  res.json(steps.sort((a, b) => a.orderIndex - b.orderIndex));
});

router.patch("/sops/:sopId/steps/:stepId", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }

  if (ctx.role !== "owner") {
    res.status(403).json({ error: "Only workspace owners can update SOP steps" });
    return;
  }

  const params = UpdateSopStepParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [sop] = await db
    .select()
    .from(sopsTable)
    .where(and(eq(sopsTable.id, params.data.sopId), eq(sopsTable.workspaceId, ctx.workspaceId)));

  if (!sop) {
    res.status(404).json({ error: "SOP not found" });
    return;
  }

  const parsed = UpdateSopStepBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [step] = await db
    .update(sopStepsTable)
    .set(parsed.data)
    .where(and(eq(sopStepsTable.id, params.data.stepId), eq(sopStepsTable.sopId, params.data.sopId)))
    .returning();

  if (!step) {
    res.status(404).json({ error: "Step not found" });
    return;
  }

  res.json(UpdateSopStepResponse.parse(step));
});

router.delete("/sops/:sopId/steps/:stepId", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }

  if (ctx.role !== "owner") {
    res.status(403).json({ error: "Only workspace owners can delete SOP steps" });
    return;
  }

  const params = DeleteSopStepParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [sop] = await db
    .select()
    .from(sopsTable)
    .where(and(eq(sopsTable.id, params.data.sopId), eq(sopsTable.workspaceId, ctx.workspaceId)));

  if (!sop) {
    res.status(404).json({ error: "SOP not found" });
    return;
  }

  await db
    .delete(sopStepsTable)
    .where(and(eq(sopStepsTable.id, params.data.stepId), eq(sopStepsTable.sopId, params.data.sopId)));

  res.sendStatus(204);
});

router.post("/sops/:sopId/assign", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }

  if (ctx.role !== "owner") {
    res.status(403).json({ error: "Only workspace owners can assign SOPs" });
    return;
  }

  const params = AssignSopParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AssignSopBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [sop] = await db
    .select()
    .from(sopsTable)
    .where(and(eq(sopsTable.id, params.data.sopId), eq(sopsTable.workspaceId, ctx.workspaceId)));

  if (!sop) {
    res.status(404).json({ error: "SOP not found" });
    return;
  }

  const [assignee] = await db
    .select()
    .from(teamMembersTable)
    .where(and(eq(teamMembersTable.id, parsed.data.assigneeId), eq(teamMembersTable.workspaceId, ctx.workspaceId)));

  if (!assignee) {
    res.status(404).json({ error: "Assignee not found" });
    return;
  }

  const stepCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sopStepsTable)
    .where(eq(sopStepsTable.sopId, params.data.sopId));

  const assignDueDate = parsed.data.dueDate
    ? (parsed.data.dueDate as Date).toISOString().split("T")[0]
    : null;
  const [assignment] = await db
    .insert(taskAssignmentsTable)
    .values({
      sopId: params.data.sopId,
      workspaceId: ctx.workspaceId,
      assigneeId: parsed.data.assigneeId,
      status: "pending",
      dueDate: assignDueDate,
      notes: parsed.data.notes ?? null,
    })
    .returning();

  res.status(201).json({
    ...assignment,
    sopTitle: sop.title,
    assigneeName: assignee.name,
    assigneeEmail: assignee.email,
    stepsTotal: stepCount[0]?.count ?? 0,
    stepsCompleted: 0,
  });
});

export default router;
