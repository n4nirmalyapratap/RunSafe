import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import {
  db,
  taskAssignmentsTable,
  teamMembersTable,
  sopsTable,
  taskStepCompletionsTable,
  sopStepsTable,
} from "@workspace/db";
import {
  GetTaskAssignmentsQueryParams,
  GetTaskAssignmentsResponse,
  GetTaskAssignmentParams,
  GetTaskAssignmentResponse,
  UpdateTaskAssignmentParams,
  UpdateTaskAssignmentBody,
  UpdateTaskAssignmentResponse,
  CompleteTaskStepParams,
  CompleteTaskStepResponse,
  UncompleteTaskStepParams,
} from "@workspace/api-zod";
import { asc } from "drizzle-orm";
import { requireAuth, getClerkUserId } from "../middlewares/requireAuth";
import { getWorkspaceContext } from "../lib/workspaceContext";

const router: IRouter = Router();

router.get("/tasks", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx) {
    res.json([]);
    return;
  }

  const params = GetTaskAssignmentsQueryParams.safeParse(req.query);

  const baseWhere = eq(taskAssignmentsTable.workspaceId, ctx.workspaceId);

  const memberFilter =
    ctx.role === "member" && ctx.memberId != null
      ? eq(taskAssignmentsTable.assigneeId, ctx.memberId)
      : undefined;

  const statusFilter =
    params.success && params.data.status
      ? eq(taskAssignmentsTable.status, params.data.status)
      : undefined;

  const assigneeFilter =
    params.success && params.data.assigneeId && ctx.role === "owner"
      ? eq(taskAssignmentsTable.assigneeId, params.data.assigneeId)
      : undefined;

  const whereClause = and(baseWhere, memberFilter, statusFilter, assigneeFilter);

  // Single query with LEFT JOINs + GROUP BY instead of correlated subqueries —
  // avoids N+1 on stepsTotal/stepsCompleted as the task list grows. We use
  // COUNT(DISTINCT ...) so the cross-product from joining both child tables
  // doesn't double-count.
  const rows = await db
    .select({
      id: taskAssignmentsTable.id,
      sopId: taskAssignmentsTable.sopId,
      sopTitle: sopsTable.title,
      workspaceId: taskAssignmentsTable.workspaceId,
      assigneeId: taskAssignmentsTable.assigneeId,
      assigneeName: teamMembersTable.name,
      assigneeEmail: teamMembersTable.email,
      status: taskAssignmentsTable.status,
      dueDate: taskAssignmentsTable.dueDate,
      completedAt: taskAssignmentsTable.completedAt,
      notes: taskAssignmentsTable.notes,
      createdAt: taskAssignmentsTable.createdAt,
      stepsTotal: sql<number>`count(distinct ${sopStepsTable.id})::int`,
      stepsCompleted: sql<number>`count(distinct ${taskStepCompletionsTable.id})::int`,
    })
    .from(taskAssignmentsTable)
    .innerJoin(sopsTable, eq(sopsTable.id, taskAssignmentsTable.sopId))
    .innerJoin(teamMembersTable, eq(teamMembersTable.id, taskAssignmentsTable.assigneeId))
    .leftJoin(sopStepsTable, eq(sopStepsTable.sopId, taskAssignmentsTable.sopId))
    .leftJoin(
      taskStepCompletionsTable,
      eq(taskStepCompletionsTable.taskAssignmentId, taskAssignmentsTable.id),
    )
    .where(whereClause)
    .groupBy(taskAssignmentsTable.id, sopsTable.id, teamMembersTable.id);

  res.json(GetTaskAssignmentsResponse.parse(rows));
});

router.get("/tasks/:taskId", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }

  const params = GetTaskAssignmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const taskWhere =
    ctx.role === "member" && ctx.memberId != null
      ? and(
          eq(taskAssignmentsTable.id, params.data.taskId),
          eq(taskAssignmentsTable.workspaceId, ctx.workspaceId),
          eq(taskAssignmentsTable.assigneeId, ctx.memberId),
        )
      : and(
          eq(taskAssignmentsTable.id, params.data.taskId),
          eq(taskAssignmentsTable.workspaceId, ctx.workspaceId),
        );

  const [row] = await db
    .select({
      id: taskAssignmentsTable.id,
      sopId: taskAssignmentsTable.sopId,
      sopTitle: sopsTable.title,
      sopDescription: sopsTable.description,
      workspaceId: taskAssignmentsTable.workspaceId,
      assigneeId: taskAssignmentsTable.assigneeId,
      assigneeName: teamMembersTable.name,
      assigneeEmail: teamMembersTable.email,
      status: taskAssignmentsTable.status,
      dueDate: taskAssignmentsTable.dueDate,
      completedAt: taskAssignmentsTable.completedAt,
      notes: taskAssignmentsTable.notes,
      createdAt: taskAssignmentsTable.createdAt,
    })
    .from(taskAssignmentsTable)
    .innerJoin(sopsTable, eq(sopsTable.id, taskAssignmentsTable.sopId))
    .innerJoin(teamMembersTable, eq(teamMembersTable.id, taskAssignmentsTable.assigneeId))
    .where(taskWhere);

  if (!row) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const steps = await db
    .select()
    .from(sopStepsTable)
    .where(eq(sopStepsTable.sopId, row.sopId))
    .orderBy(asc(sopStepsTable.orderIndex), asc(sopStepsTable.id));

  const completions = await db
    .select({ sopStepId: taskStepCompletionsTable.sopStepId })
    .from(taskStepCompletionsTable)
    .where(eq(taskStepCompletionsTable.taskAssignmentId, row.id));

  res.json(
    GetTaskAssignmentResponse.parse({
      ...row,
      steps,
      completedStepIds: completions.map((c) => c.sopStepId),
    }),
  );
});

router.patch("/tasks/:taskId", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }

  const params = UpdateTaskAssignmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTaskAssignmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const taskWhere =
    ctx.role === "member" && ctx.memberId != null
      ? and(
          eq(taskAssignmentsTable.id, params.data.taskId),
          eq(taskAssignmentsTable.workspaceId, ctx.workspaceId),
          eq(taskAssignmentsTable.assigneeId, ctx.memberId),
        )
      : and(
          eq(taskAssignmentsTable.id, params.data.taskId),
          eq(taskAssignmentsTable.workspaceId, ctx.workspaceId),
        );

  // Members may only update `status` on their own tasks — not dueDate or notes
  const updateData: Record<string, unknown> =
    ctx.role === "member"
      ? { status: parsed.data.status }
      : { ...parsed.data };
  if (parsed.data.status === "completed") {
    updateData.completedAt = new Date();
  }

  const [assignment] = await db
    .update(taskAssignmentsTable)
    .set(updateData)
    .where(taskWhere)
    .returning();

  if (!assignment) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const [sop] = await db.select().from(sopsTable).where(eq(sopsTable.id, assignment.sopId));
  const [assignee] = await db
    .select()
    .from(teamMembersTable)
    .where(eq(teamMembersTable.id, assignment.assigneeId));

  const stepsTotal = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sopStepsTable)
    .where(eq(sopStepsTable.sopId, assignment.sopId));

  const stepsCompleted = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(taskStepCompletionsTable)
    .where(eq(taskStepCompletionsTable.taskAssignmentId, assignment.id));

  res.json(
    UpdateTaskAssignmentResponse.parse({
      ...assignment,
      sopTitle: sop?.title ?? "",
      assigneeName: assignee?.name ?? "",
      assigneeEmail: assignee?.email ?? "",
      stepsTotal: stepsTotal[0]?.count ?? 0,
      stepsCompleted: stepsCompleted[0]?.count ?? 0,
    }),
  );
});

router.post("/tasks/:taskId/steps/:stepId/complete", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }

  const params = CompleteTaskStepParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const taskWhere =
    ctx.role === "member" && ctx.memberId != null
      ? and(
          eq(taskAssignmentsTable.id, params.data.taskId),
          eq(taskAssignmentsTable.workspaceId, ctx.workspaceId),
          eq(taskAssignmentsTable.assigneeId, ctx.memberId),
        )
      : and(
          eq(taskAssignmentsTable.id, params.data.taskId),
          eq(taskAssignmentsTable.workspaceId, ctx.workspaceId),
        );

  const [task] = await db.select().from(taskAssignmentsTable).where(taskWhere);

  if (!task) {
    res.status(404).json({ error: "Task not found or not assigned to you" });
    return;
  }

  const [validStep] = await db
    .select()
    .from(sopStepsTable)
    .where(
      and(
        eq(sopStepsTable.id, params.data.stepId),
        eq(sopStepsTable.sopId, task.sopId),
      ),
    );

  if (!validStep) {
    res.status(404).json({ error: "Step not found for this task's SOP" });
    return;
  }

  const existing = await db
    .select()
    .from(taskStepCompletionsTable)
    .where(
      and(
        eq(taskStepCompletionsTable.taskAssignmentId, params.data.taskId),
        eq(taskStepCompletionsTable.sopStepId, params.data.stepId),
      ),
    );

  if (existing.length > 0) {
    res.json(CompleteTaskStepResponse.parse(existing[0]));
    return;
  }

  const [completion] = await db
    .insert(taskStepCompletionsTable)
    .values({
      taskAssignmentId: params.data.taskId,
      sopStepId: params.data.stepId,
    })
    .returning();

  res.json(CompleteTaskStepResponse.parse(completion));
});

router.delete("/tasks/:taskId/steps/:stepId/complete", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }

  const params = UncompleteTaskStepParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const taskWhere =
    ctx.role === "member" && ctx.memberId != null
      ? and(
          eq(taskAssignmentsTable.id, params.data.taskId),
          eq(taskAssignmentsTable.workspaceId, ctx.workspaceId),
          eq(taskAssignmentsTable.assigneeId, ctx.memberId),
        )
      : and(
          eq(taskAssignmentsTable.id, params.data.taskId),
          eq(taskAssignmentsTable.workspaceId, ctx.workspaceId),
        );

  const [task] = await db.select().from(taskAssignmentsTable).where(taskWhere);
  if (!task) {
    res.status(404).json({ error: "Task not found or not assigned to you" });
    return;
  }

  const [validStep] = await db
    .select()
    .from(sopStepsTable)
    .where(
      and(
        eq(sopStepsTable.id, params.data.stepId),
        eq(sopStepsTable.sopId, task.sopId),
      ),
    );

  if (!validStep) {
    res.status(404).json({ error: "Step not found for this task's SOP" });
    return;
  }

  await db
    .delete(taskStepCompletionsTable)
    .where(
      and(
        eq(taskStepCompletionsTable.taskAssignmentId, params.data.taskId),
        eq(taskStepCompletionsTable.sopStepId, params.data.stepId),
      ),
    );

  res.status(204).end();
});

export default router;
