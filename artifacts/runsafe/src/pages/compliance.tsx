import { AppLayout } from "@/components/layout";
import { useGetComplianceItems, getGetComplianceItemsQueryKey, useGetWorkspace, getGetWorkspaceQueryKey, useCompleteComplianceItem } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, CheckCircle2, AlertTriangle, CalendarClock } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export function Compliance() {
  const qc = useQueryClient();
  const { data: workspace, isLoading: wsLoading } = useGetWorkspace({ query: { queryKey: getGetWorkspaceQueryKey() } });
  const { data: items, isLoading: itemsLoading } = useGetComplianceItems(undefined, { query: { queryKey: getGetComplianceItemsQueryKey() } });
  
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
            Your current Starter plan includes Delegation OS. Upgrade to Growth or Pro to unlock automated regulatory tracking and compliance alerts.
          </p>
          <Button size="lg">Upgrade Plan</Button>
        </div>
      </AppLayout>
    );
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed': return <CheckCircle2 className="text-green-500 w-5 h-5" />;
      case 'overdue': return <AlertTriangle className="text-destructive w-5 h-5" />;
      case 'upcoming': return <CalendarClock className="text-amber-500 w-5 h-5" />;
      default: return <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Compliance Checklist</h1>
        
        <div className="grid gap-4">
          {items?.map(item => (
            <Card key={item.id} className={item.status === 'overdue' ? 'border-destructive shadow-sm' : ''}>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 gap-4">
                <div className="flex gap-4 items-start">
                  <div className="mt-1">{getStatusIcon(item.status)}</div>
                  <div>
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-muted-foreground text-sm max-w-2xl">{item.description}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="secondary">{item.category.replace('_', ' ')}</Badge>
                      <Badge variant="outline">{item.recurrence.replace('_', ' ')}</Badge>
                      {item.dueDate && (
                        <Badge variant={item.status === 'overdue' ? 'destructive' : 'outline'}>
                          Due: {format(new Date(item.dueDate), "MMM d, yyyy")}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="w-full md:w-auto">
                  {item.status !== 'completed' && (
                    <Button 
                      className="w-full md:w-auto"
                      disabled={completeItem.isPending}
                      onClick={() => {
                        completeItem.mutate(
                          { complianceItemId: item.id, data: { completedAt: new Date().toISOString() } },
                          { onSuccess: () => qc.invalidateQueries({ queryKey: getGetComplianceItemsQueryKey() }) }
                        );
                      }}
                    >
                      Mark Complete
                    </Button>
                  )}
                  {item.status === 'completed' && item.lastCompletedAt && (
                    <div className="text-sm text-muted-foreground">
                      Completed: {format(new Date(item.lastCompletedAt), "MMM d, yyyy")}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
          {items?.length === 0 && (
            <div className="text-center py-12 border rounded-lg">No compliance items configured.</div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}