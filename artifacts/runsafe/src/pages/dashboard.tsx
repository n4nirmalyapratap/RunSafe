import { AppLayout } from "@/components/layout";
import {
  useGetDashboardSummary,
  getGetDashboardSummaryQueryKey,
  useGetWorkspace,
  getGetWorkspaceQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckSquare, ShieldAlert, Activity, AlertTriangle, Calendar, CalendarClock } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() },
  });
  const { data: workspace, isLoading: wsLoading } = useGetWorkspace({
    query: { queryKey: getGetWorkspaceQueryKey() },
  });

  const isLoading = summaryLoading || wsLoading;
  const isOwner = workspace?.userRole === "owner";

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!summary) return null;

  return (
    <AppLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

        {isOwner && summary.nextDueComplianceItem && (
          <Card
            className={
              summary.nextDueComplianceItem.status === "overdue"
                ? "border-destructive bg-destructive/5"
                : summary.nextDueComplianceItem.daysUntilDue <= 7
                  ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20"
                  : ""
            }
          >
            <CardContent className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6">
              <div className="flex gap-4 items-start">
                <div
                  className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    summary.nextDueComplianceItem.status === "overdue"
                      ? "bg-destructive/15 text-destructive"
                      : "bg-amber-500/15 text-amber-600"
                  }`}
                >
                  <CalendarClock className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                    Next compliance deadline
                  </div>
                  <div className="text-lg font-semibold">{summary.nextDueComplianceItem.title}</div>
                  <div className="flex flex-wrap gap-2 mt-2 text-sm">
                    <Badge variant="secondary">
                      {summary.nextDueComplianceItem.category.replace("_", " ")}
                    </Badge>
                    <Badge
                      variant={
                        summary.nextDueComplianceItem.status === "overdue" ? "destructive" : "outline"
                      }
                    >
                      Due {format(new Date(summary.nextDueComplianceItem.dueDate), "MMM d, yyyy")}
                    </Badge>
                    <span className="text-muted-foreground">
                      {summary.nextDueComplianceItem.daysUntilDue < 0
                        ? `${Math.abs(summary.nextDueComplianceItem.daysUntilDue)} days overdue`
                        : summary.nextDueComplianceItem.daysUntilDue === 0
                          ? "Due today"
                          : `In ${summary.nextDueComplianceItem.daysUntilDue} days`}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className={`grid gap-4 md:grid-cols-2 ${isOwner ? "lg:grid-cols-4" : "lg:grid-cols-2"}`}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isOwner ? "Pending Tasks" : "My Pending Tasks"}
              </CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.pendingTasks}</div>
              <p className="text-xs text-muted-foreground">
                {summary.completedTasksThisMonth} completed this month
              </p>
            </CardContent>
          </Card>

          {summary.overdueTasks > 0 && (
            <Card className="border-destructive">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {isOwner ? "Overdue Tasks" : "My Overdue Tasks"}
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{summary.overdueTasks}</div>
                <p className="text-xs text-muted-foreground">Require immediate attention</p>
              </CardContent>
            </Card>
          )}

          {isOwner && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Compliance Alerts</CardTitle>
                  <ShieldAlert
                    className={`h-4 w-4 ${summary.overdueComplianceItems > 0 ? "text-destructive" : "text-muted-foreground"}`}
                  />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.overdueComplianceItems} overdue</div>
                  <p className="text-xs text-muted-foreground">
                    {summary.upcomingComplianceItems} upcoming
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active SOPs</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.totalSops}</div>
                  <p className="text-xs text-muted-foreground">{summary.teamMemberCount} team members</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {isOwner && summary.upcomingComplianceDeadlines && summary.upcomingComplianceDeadlines.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Compliance Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summary.upcomingComplianceDeadlines.map((d) => {
                  const isOverdue = d.status === "overdue";
                  const daysLabel = isOverdue
                    ? `${Math.abs(d.daysUntilDue)} day${Math.abs(d.daysUntilDue) === 1 ? "" : "s"} overdue`
                    : d.daysUntilDue === 0
                      ? "Due today"
                      : `Due in ${d.daysUntilDue} day${d.daysUntilDue === 1 ? "" : "s"}`;
                  return (
                    <Link key={d.id} href="/compliance">
                      <div className="flex items-center justify-between gap-4 p-3 rounded-md border hover:bg-accent cursor-pointer">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{d.title}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {d.category.replace(/_/g, " ")} • {format(new Date(d.dueDate), "MMM d, yyyy")}
                          </p>
                        </div>
                        <Badge variant={isOverdue ? "destructive" : "secondary"} className="shrink-0">
                          {daysLabel}
                        </Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {isOwner ? "Recent Activity" : "My Recent Activity"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {summary.recentActivity.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">No recent activity.</div>
              ) : (
                summary.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4">
                    <div className="w-2 h-2 mt-2 rounded-full bg-primary flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.actorName} •{" "}
                        {format(new Date(activity.createdAt), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
