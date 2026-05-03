import { AppLayout } from "@/components/layout";
import {
  useGetDashboardSummary,
  getGetDashboardSummaryQueryKey,
  useGetWorkspace,
  getGetWorkspaceQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckSquare, ShieldAlert, Users, Activity, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

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
