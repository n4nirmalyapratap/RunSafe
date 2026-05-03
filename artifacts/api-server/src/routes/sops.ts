import { Router, type IRouter } from "express";
import { eq, and, asc, sql } from "drizzle-orm";
import { db, workspacesTable, sopsTable, sopStepsTable, teamMembersTable, taskAssignmentsTable } from "@workspace/db";
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

const router: IRouter = Router();

async function getWorkspaceId(clerkId: string): Promise<number | null> {
  const [ws] = await db
    .select()
    .from(workspacesTable)
    .where(eq(workspacesTable.ownerClerkId, clerkId));
  return ws?.id ?? null;
}

router.get("/sops", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const workspaceId = await getWorkspaceId(clerkId);
  if (!workspaceId) {
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
        ? and(eq(sopsTable.workspaceId, workspaceId), eq(sopsTable.category, params.data.category))
        : eq(sopsTable.workspaceId, workspaceId),
    )
    .groupBy(sopsTable.id)
    .orderBy(asc(sopsTable.createdAt));

  const sops = await query;
  res.json(GetSopsResponse.parse(sops));
});

router.post("/sops", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const workspaceId = await getWorkspaceId(clerkId);
  if (!workspaceId) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }

  const parsed = CreateSopBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [sop] = await db
    .insert(sopsTable)
    .values({ ...parsed.data, workspaceId, createdByClerkId: clerkId })
    .returning();

  res.status(201).json({ ...sop, stepCount: 0 });
});

router.get("/sops/:sopId", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const workspaceId = await getWorkspaceId(clerkId);
  if (!workspaceId) {
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
    .where(and(eq(sopsTable.id, params.data.sopId), eq(sopsTable.workspaceId, workspaceId)));

  if (!sop) {
    res.status(404).json({ error: "SOP not found" });
    return;
  }

  const steps = await db
    .select()
    .from(sopStepsTable)
    .where(eq(sopStepsTable.sopId, sop.id))
    .orderBy(asc(sopStepsTable.orderIndex));

  res.json(GetSopResponse.parse({ ...sop, steps }));
});

router.patch("/sops/:sopId", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const workspaceId = await getWorkspaceId(clerkId);
  if (!workspaceId) {
    res.status(404).json({ error: "Workspace not found" });
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
    .where(and(eq(sopsTable.id, params.data.sopId), eq(sopsTable.workspaceId, workspaceId)))
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
  const workspaceId = await getWorkspaceId(clerkId);
  if (!workspaceId) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }

  const params = DeleteSopParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db
    .delete(sopsTable)
    .where(and(eq(sopsTable.id, params.data.sopId), eq(sopsTable.workspaceId, workspaceId)));

  res.sendStatus(204);
});

router.post("/sops/:sopId/steps", requireAuth, async (req, res): Promise<void> => {
  const params = AddSopStepParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
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
  const params = ReorderSopStepsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
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
  const params = UpdateSopStepParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
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
  const params = DeleteSopStepParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db
    .delete(sopStepsTable)
    .where(and(eq(sopStepsTable.id, params.data.stepId), eq(sopStepsTable.sopId, params.data.sopId)));

  res.sendStatus(204);
});

router.post("/sops/:sopId/assign", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const workspaceId = await getWorkspaceId(clerkId);
  if (!workspaceId) {
    res.status(404).json({ error: "Workspace not found" });
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

  const [sop] = await db.select().from(sopsTable).where(eq(sopsTable.id, params.data.sopId));
  if (!sop) {
    res.status(404).json({ error: "SOP not found" });
    return;
  }

  const [assignee] = await db
    .select()
    .from(teamMembersTable)
    .where(eq(teamMembersTable.id, parsed.data.assigneeId));

  if (!assignee) {
    res.status(404).json({ error: "Assignee not found" });
    return;
  }

  const stepCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sopStepsTable)
    .where(eq(sopStepsTable.sopId, params.data.sopId));

  const [assignment] = await db
    .insert(taskAssignmentsTable)
    .values({
      sopId: params.data.sopId,
      workspaceId,
      assigneeId: parsed.data.assigneeId,
      status: "pending",
      dueDate: parsed.data.dueDate ?? null,
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
