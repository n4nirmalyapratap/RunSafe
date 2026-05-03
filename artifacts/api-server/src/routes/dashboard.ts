import { Router, type IRouter } from "express";
import { eq, and, gte, sql } from "drizzle-orm";
import {
  db,
  sopsTable,
  taskAssignmentsTable,
  teamMembersTable,
  complianceItemsTable,
  complianceCompletionsTable,
} from "@workspace/db";
import { GetDashboardSummaryResponse } from "@workspace/api-zod";
import { requireAuth, getClerkUserId } from "../middlewares/requireAuth";
import { getWorkspaceContext } from "../lib/workspaceContext";

const router: IRouter = Router();

router.get("/dashboard/summary", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);

  if (!ctx) {
    res.json(
      GetDashboardSummaryResponse.parse({
        totalSops: 0,
        totalTaskAssignments: 0,
        pendingTasks: 0,
        completedTasksThisMonth: 0,
        overdueTasks: 0,
        overdueComplianceItems: 0,
        upcomingComplianceItems: 0,
        nextDueComplianceItem: null,
        teamMemberCount: 0,
        recentActivity: [],
      }),
    );
    return;
  }

  const { workspaceId, role, memberId } = ctx;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const isMember = role === "member" && memberId != null;

  // Members only see their own tasks
  const taskScope = isMember
    ? and(eq(taskAssignmentsTable.workspaceId, workspaceId), eq(taskAssignmentsTable.assigneeId, memberId!))
    : eq(taskAssignmentsTable.workspaceId, workspaceId);

  const [totalTasksResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(taskAssignmentsTable)
    .where(taskScope);

  const [pendingTasksResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(taskAssignmentsTable)
    .where(and(taskScope, sql`${taskAssignmentsTable.status} IN ('pending', 'in_progress')`));

  const [completedThisMonthResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(taskAssignmentsTable)
    .where(
      and(taskScope, eq(taskAssignmentsTable.status, "completed"), gte(taskAssignmentsTable.completedAt, startOfMonth)),
    );

  const [overdueTasksResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(taskAssignmentsTable)
    .where(
      and(
        taskScope,
        sql`${taskAssignmentsTable.status} != 'completed'`,
        sql`${taskAssignmentsTable.dueDate} < ${now.toISOString().split("T")[0]}`,
      ),
    );

  // Member-scoped recent task activity (their own tasks only)
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
    .where(taskScope)
    .orderBy(sql`${taskAssignmentsTable.createdAt} DESC`)
    .limit(5);

  const taskActivity = recentTasks
    .filter((t) => t.status === "completed")
    .map((t) => ({
      id: `task-${t.id}`,
      type: "task_completed" as const,
      description: `Task "${t.sopTitle}" completed`,
      actorName: t.assigneeName,
      createdAt: t.completedAt ?? t.createdAt,
    }));

  // Members get only task-scoped data; no SOP/team/compliance aggregates
  if (isMember) {
    res.json(
      GetDashboardSummaryResponse.parse({
        totalSops: 0,
        totalTaskAssignments: totalTasksResult?.count ?? 0,
        pendingTasks: pendingTasksResult?.count ?? 0,
        completedTasksThisMonth: completedThisMonthResult?.count ?? 0,
        overdueTasks: overdueTasksResult?.count ?? 0,
        overdueComplianceItems: 0,
        upcomingComplianceItems: 0,
        nextDueComplianceItem: null,
        teamMemberCount: 0,
        recentActivity: taskActivity,
      }),
    );
    return;
  }

  // Owner: include full workspace-wide metrics
  const [totalSopsResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sopsTable)
    .where(eq(sopsTable.workspaceId, workspaceId));

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
  const deadlineList: Array<{
    id: number;
    title: string;
    category: string;
    dueDate: string;
    daysUntilDue: number;
    status: "overdue" | "upcoming";
  }> = [];
  let nextDueItem: {
    id: number;
    title: string;
    category: string;
    dueDate: string;
    status: string;
    daysUntilDue: number;
  } | null = null;

  for (const item of complianceItems) {
    if (!item.dueDate) continue;
    if (item.status === "completed") continue;
    const due = new Date(item.dueDate);
    const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (due < now) {
      overdueCompliance++;
      deadlineList.push({
        id: item.id,
        title: item.title,
        category: item.category,
        dueDate: item.dueDate,
        daysUntilDue,
        status: "overdue",
      });
    } else if (due <= thirtyDaysFromNow) {
      upcomingCompliance++;
      deadlineList.push({
        id: item.id,
        title: item.title,
        category: item.category,
        dueDate: item.dueDate,
        daysUntilDue,
        status: "upcoming",
      });
    }

    const status = due < now ? "overdue" : daysUntilDue <= 30 ? "upcoming" : "pending";
    if (!nextDueItem || due < new Date(nextDueItem.dueDate)) {
      nextDueItem = {
        id: item.id,
        title: item.title,
        category: item.category,
        dueDate: item.dueDate,
        status,
        daysUntilDue,
      };
    }
  }
  // Show the most urgent first (overdue, then soonest upcoming) — top 5
  const upcomingComplianceDeadlines = deadlineList
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
    .slice(0, 5);

  const recentCompletions = await db
    .select({
      id: complianceCompletionsTable.id,
      completedByName: complianceCompletionsTable.completedByName,
      complianceItemTitle: complianceItemsTable.title,
      completedAt: complianceCompletionsTable.completedAt,
    })
    .from(complianceCompletionsTable)
    .innerJoin(complianceItemsTable, eq(complianceItemsTable.id, complianceCompletionsTable.complianceItemId))
    .where(eq(complianceItemsTable.workspaceId, workspaceId))
    .orderBy(sql`${complianceCompletionsTable.completedAt} DESC`)
    .limit(3);

  const recentActivity = [
    ...recentCompletions.map((c) => ({
      id: `compliance-${c.id}`,
      type: "compliance_completed" as const,
      description: `Compliance item "${c.complianceItemTitle}" marked complete`,
      actorName: c.completedByName,
      createdAt: c.completedAt,
    })),
    ...taskActivity,
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
      nextDueComplianceItem: nextDueItem,
      teamMemberCount: teamCountResult?.count ?? 0,
      recentActivity,
      upcomingComplianceDeadlines,
    }),
  );
});

export default router;
