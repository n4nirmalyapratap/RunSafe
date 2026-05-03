import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import {
  db,
  workspacesTable,
  taskAssignmentsTable,
  teamMembersTable,
  sopsTable,
  taskStepCompletionsTable,
  sopStepsTable,
} from "@workspace/db";
import {
  GetTaskAssignmentsQueryParams,
  GetTaskAssignmentsResponse,
  UpdateTaskAssignmentParams,
  UpdateTaskAssignmentBody,
  UpdateTaskAssignmentResponse,
  CompleteTaskStepParams,
  CompleteTaskStepResponse,
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

router.get("/tasks", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const workspaceId = await getWorkspaceId(clerkId);
  if (!workspaceId) {
    res.json([]);
    return;
  }

  const params = GetTaskAssignmentsQueryParams.safeParse(req.query);

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
      stepsTotal: sql<number>`(select count(*) from sop_steps where sop_steps.sop_id = ${taskAssignmentsTable.sopId})::int`,
      stepsCompleted: sql<number>`(select count(*) from task_step_completions where task_step_completions.task_assignment_id = ${taskAssignmentsTable.id})::int`,
    })
    .from(taskAssignmentsTable)
    .innerJoin(sopsTable, eq(sopsTable.id, taskAssignmentsTable.sopId))
    .innerJoin(teamMembersTable, eq(teamMembersTable.id, taskAssignmentsTable.assigneeId))
    .where(
      params.success
        ? and(
            eq(taskAssignmentsTable.workspaceId, workspaceId),
            params.data.status ? eq(taskAssignmentsTable.status, params.data.status) : undefined,
            params.data.assigneeId
              ? eq(taskAssignmentsTable.assigneeId, params.data.assigneeId)
              : undefined,
          )
        : eq(taskAssignmentsTable.workspaceId, workspaceId),
    );

  res.json(GetTaskAssignmentsResponse.parse(rows));
});

router.patch("/tasks/:taskId", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const workspaceId = await getWorkspaceId(clerkId);
  if (!workspaceId) {
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

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status === "completed") {
    updateData.completedAt = new Date();
  }

  const [assignment] = await db
    .update(taskAssignmentsTable)
    .set(updateData)
    .where(
      and(
        eq(taskAssignmentsTable.id, params.data.taskId),
        eq(taskAssignmentsTable.workspaceId, workspaceId),
      ),
    )
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
  const params = CompleteTaskStepParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
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

export default router;
