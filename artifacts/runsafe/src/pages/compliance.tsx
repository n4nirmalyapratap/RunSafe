import { AppLayout } from "@/components/layout";
import {
  useGetComplianceItems,
  getGetComplianceItemsQueryKey,
  useGetWorkspace,
  getGetWorkspaceQueryKey,
  useCompleteComplianceItem,
  useGetComplianceAuditLog,
  getGetComplianceAuditLogQueryKey,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, CheckCircle2, AlertTriangle, CalendarClock, ClipboardList, FileText } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function Compliance() {
  const qc = useQueryClient();
  const { data: workspace, isLoading: wsLoading } = useGetWorkspace({
    query: { queryKey: getGetWorkspaceQueryKey() },
  });
  const { data: items, isLoading: itemsLoading } = useGetComplianceItems(undefined, {
    query: { queryKey: getGetComplianceItemsQueryKey() },
  });
  const { data: auditLog, isLoading: auditLoading } = useGetComplianceAuditLog({
    query: { queryKey: getGetComplianceAuditLogQueryKey() },
  });

  const completeItem = useCompleteComplianceItem();

  if (wsLoading || itemsLoading) return <AppLayout><Skeleton className="h-64" /></AppLayout>;

  if (workspace?.plan === "starter") {
    return (
      <AppLayout>
        <div className="h-[60vh] flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
            <ShieldAlert className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Compliance Autopilot</h2>
          <p className="text-muted-foreground mb-8">
            Your current Starter plan includes Delegation OS. Upgrade to Growth or Pro to unlock
            automated regulatory tracking and compliance alerts.
          </p>
          <Button size="lg">Upgrade Plan</Button>
        </div>
      </AppLayout>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="text-green-500 w-5 h-5" />;
      case "overdue":
        return <AlertTriangle className="text-destructive w-5 h-5" />;
      case "upcoming":
        return <CalendarClock className="text-amber-500 w-5 h-5" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />;
    }
  };

  const overdueCount = items?.filter((i) => i.status === "overdue").length ?? 0;
  const upcomingCount = items?.filter((i) => i.status === "upcoming").length ?? 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Compliance Autopilot</h1>
          <div className="flex gap-2">
            {overdueCount > 0 && (
              <Badge variant="destructive">{overdueCount} Overdue</Badge>
            )}
            {upcomingCount > 0 && (
              <Badge variant="outline" className="border-amber-500 text-amber-600">
                {upcomingCount} Due Soon
              </Badge>
            )}
          </div>
        </div>

        <Tabs defaultValue="checklist">
          <TabsList>
            <TabsTrigger value="checklist" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Checklist
            </TabsTrigger>
            <TabsTrigger value="audit-log" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Audit Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="checklist" className="mt-4 space-y-4">
            {items?.map((item) => (
              <Card
                key={item.id}
                className={item.status === "overdue" ? "border-destructive shadow-sm" : ""}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 gap-4">
                  <div className="flex gap-4 items-start">
                    <div className="mt-1">{getStatusIcon(item.status)}</div>
                    <div>
                      <h3 className="font-semibold text-lg">{item.title}</h3>
                      <p className="text-muted-foreground text-sm max-w-2xl">{item.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary">{item.category.replace("_", " ")}</Badge>
                        <Badge variant="outline">{item.recurrence.replace("_", " ")}</Badge>
                        {item.dueDate && (
                          <Badge
                            variant={item.status === "overdue" ? "destructive" : "outline"}
                          >
                            Due: {format(new Date(item.dueDate), "MMM d, yyyy")}
                          </Badge>
                        )}
                        {item.lastCompletedAt && (
                          <Badge variant="secondary" className="text-green-700 border-green-200 bg-green-50">
                            Last done: {format(new Date(item.lastCompletedAt), "MMM d, yyyy")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="w-full md:w-auto">
                    {item.status !== "completed" && (
                      <Button
                        className="w-full md:w-auto"
                        disabled={completeItem.isPending}
                        onClick={() => {
                          completeItem.mutate(
                            { itemId: item.id, data: { completedAt: new Date().toISOString() } },
                            {
                              onSuccess: () => {
                                qc.invalidateQueries({ queryKey: getGetComplianceItemsQueryKey() });
                                qc.invalidateQueries({ queryKey: getGetComplianceAuditLogQueryKey() });
                              },
                            },
                          );
                        }}
                      >
                        Mark Complete
                      </Button>
                    )}
                    {item.status === "completed" && (
                      <span className="inline-flex items-center gap-1.5 text-sm text-green-600 font-medium">
                        <CheckCircle2 className="h-4 w-4" /> Completed
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
            {items?.length === 0 && (
              <div className="text-center py-12 border rounded-lg text-muted-foreground">
                No compliance items configured.
              </div>
            )}
          </TabsContent>

          <TabsContent value="audit-log" className="mt-4">
            {auditLoading ? (
              <Skeleton className="h-48" />
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Compliance Item</TableHead>
                      <TableHead>Completed By</TableHead>
                      <TableHead>Completed At</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLog && auditLog.length > 0 ? (
                      auditLog.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">{entry.complianceItemTitle}</TableCell>
                          <TableCell>{entry.completedByName}</TableCell>
                          <TableCell>
                            {entry.completedAt
                              ? format(new Date(entry.completedAt), "MMM d, yyyy h:mm a")
                              : "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {entry.notes ?? "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                          No compliance completions recorded yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
