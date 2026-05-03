import { Router, type IRouter } from "express";
import { eq, and, gte, sql } from "drizzle-orm";
import {
  db,
  workspacesTable,
  sopsTable,
  taskAssignmentsTable,
  teamMembersTable,
  complianceItemsTable,
  complianceCompletionsTable,
} from "@workspace/db";
import { GetDashboardSummaryResponse } from "@workspace/api-zod";
import { requireAuth, getClerkUserId } from "../middlewares/requireAuth";

const router: IRouter = Router();

async function getWorkspaceId(clerkId: string): Promise<number | null> {
  const [ws] = await db
    .select()
    .from(workspacesTable)
    .where(eq(workspacesTable.ownerClerkId, clerkId));
  return ws?.id ?? null;
}

router.get("/dashboard/summary", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const workspaceId = await getWorkspaceId(clerkId);
  if (!workspaceId) {
    res.json(
      GetDashboardSummaryResponse.parse({
        totalSops: 0,
        totalTaskAssignments: 0,
        pendingTasks: 0,
        completedTasksThisMonth: 0,
        overdueTasks: 0,
        overdueComplianceItems: 0,
        upcomingComplianceItems: 0,
        teamMemberCount: 0,
        recentActivity: [],
      }),
    );
    return;
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [totalSopsResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sopsTable)
    .where(eq(sopsTable.workspaceId, workspaceId));

  const [totalTasksResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(taskAssignmentsTable)
    .where(eq(taskAssignmentsTable.workspaceId, workspaceId));

  const [pendingTasksResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(taskAssignmentsTable)
    .where(
      and(
        eq(taskAssignmentsTable.workspaceId, workspaceId),
        sql`${taskAssignmentsTable.status} IN ('pending', 'in_progress')`,
      ),
    );

  const [completedThisMonthResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(taskAssignmentsTable)
    .where(
      and(
        eq(taskAssignmentsTable.workspaceId, workspaceId),
        eq(taskAssignmentsTable.status, "completed"),
        gte(taskAssignmentsTable.completedAt, startOfMonth),
      ),
    );

  const [overdueTasksResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(taskAssignmentsTable)
    .where(
      and(
        eq(taskAssignmentsTable.workspaceId, workspaceId),
        sql`${taskAssignmentsTable.status} != 'completed'`,
        sql`${taskAssignmentsTable.dueDate} < ${now.toISOString().split("T")[0]}`,
      ),
    );

  const [teamCountResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(teamMembersTable)
    .where(eq(teamMembersTable.workspaceId, workspaceId));

  const complianceItems = await db
    .select()
    .from(complianceItemsTable)
    .where(eq(complianceItemsTable.workspaceId, workspaceId));

  let overdueCompliance = 0;
  let upcomingCompliance = 0;
  for (const item of complianceItems) {
    if (!item.dueDate) continue;
    const due = new Date(item.dueDate);
    if (due < now) {
      overdueCompliance++;
    } else if (due <= thirtyDaysFromNow) {
      upcomingCompliance++;
    }
  }

  const recentCompletions = await db
    .select({
      id: complianceCompletionsTable.id,
      completedByName: complianceCompletionsTable.completedByName,
      complianceItemTitle: complianceItemsTable.title,
      completedAt: complianceCompletionsTable.completedAt,
    })
    .from(complianceCompletionsTable)
    .innerJoin(
      complianceItemsTable,
      eq(complianceItemsTable.id, complianceCompletionsTable.complianceItemId),
    )
    .where(eq(complianceItemsTable.workspaceId, workspaceId))
    .orderBy(sql`${complianceCompletionsTable.completedAt} DESC`)
    .limit(3);

  const recentTasks = await db
    .select({
      id: taskAssignmentsTable.id,
      status: taskAssignmentsTable.status,
      completedAt: taskAssignmentsTable.completedAt,
      assigneeName: teamMembersTable.name,
      sopTitle: sopsTable.title,
      createdAt: taskAssignmentsTable.createdAt,
    })
    .from(taskAssignmentsTable)
    .innerJoin(sopsTable, eq(sopsTable.id, taskAssignmentsTable.sopId))
    .innerJoin(teamMembersTable, eq(teamMembersTable.id, taskAssignmentsTable.assigneeId))
    .where(eq(taskAssignmentsTable.workspaceId, workspaceId))
    .orderBy(sql`${taskAssignmentsTable.createdAt} DESC`)
    .limit(3);

  const recentActivity = [
    ...recentCompletions.map((c) => ({
      id: `compliance-${c.id}`,
      type: "compliance_completed" as const,
      description: `Compliance item "${c.complianceItemTitle}" marked complete`,
      actorName: c.completedByName,
      createdAt: c.completedAt,
    })),
    ...recentTasks
      .filter((t) => t.status === "completed")
      .map((t) => ({
        id: `task-${t.id}`,
        type: "task_completed" as const,
        description: `Task "${t.sopTitle}" completed`,
        actorName: t.assigneeName,
        createdAt: t.completedAt ?? t.createdAt,
      })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  res.json(
    GetDashboardSummaryResponse.parse({
      totalSops: totalSopsResult?.count ?? 0,
      totalTaskAssignments: totalTasksResult?.count ?? 0,
      pendingTasks: pendingTasksResult?.count ?? 0,
      completedTasksThisMonth: completedThisMonthResult?.count ?? 0,
      overdueTasks: overdueTasksResult?.count ?? 0,
      overdueComplianceItems: overdueCompliance,
      upcomingComplianceItems: upcomingCompliance,
      teamMemberCount: teamCountResult?.count ?? 0,
      recentActivity,
    }),
  );
});

export default router;
