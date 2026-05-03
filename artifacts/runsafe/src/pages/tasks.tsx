import { AppLayout } from "@/components/layout";
import { useGetTaskAssignments, getGetTaskAssignmentsQueryKey, useUpdateTaskAssignment } from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, PlayCircle } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export function Tasks() {
  const qc = useQueryClient();
  const { data: tasks, isLoading } = useGetTaskAssignments(undefined, { query: { queryKey: getGetTaskAssignmentsQueryKey() } });
  const updateTask = useUpdateTaskAssignment();

  const handleStatusChange = (taskId: number, status: "pending" | "in_progress" | "completed") => {
    updateTask.mutate(
      { taskAssignmentId: taskId, data: { status } },
      { onSuccess: () => qc.invalidateQueries({ queryKey: getGetTaskAssignmentsQueryKey() }) }
    );
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed': return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>;
      case 'in_progress': return <Badge variant="secondary" className="text-blue-600"><PlayCircle className="w-3 h-3 mr-1" /> In Progress</Badge>;
      default: return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  const TaskList = ({ filter }: { filter: string }) => {
    const filtered = tasks?.filter(t => t.status === filter);
    if (!filtered?.length) return <div className="text-center py-12 text-muted-foreground border rounded-lg">No tasks found.</div>;
    
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map(task => {
          const progress = task.stepsTotal > 0 ? (task.stepsCompleted / task.stepsTotal) * 100 : 0;
          return (
            <Card key={task.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-1">{task.sopTitle}</CardTitle>
                  {getStatusBadge(task.status)}
                </div>
                <div className="text-sm text-muted-foreground">Assigned to: {task.assigneeName}</div>
              </CardHeader>
              <CardContent className="flex-1 pb-2">
                {task.dueDate && <div className="text-xs font-medium text-destructive mb-4">Due: {format(new Date(task.dueDate), "MMM d, yyyy")}</div>}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progress</span>
                    <span>{task.stepsCompleted}/{task.stepsTotal} steps</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t flex justify-end gap-2">
                {task.status === "pending" && <Button size="sm" onClick={() => handleStatusChange(task.id, "in_progress")}>Start Task</Button>}
                {task.status === "in_progress" && <Button size="sm" onClick={() => handleStatusChange(task.id, "completed")}>Mark Complete</Button>}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Task Assignments</h1>
        
        {isLoading ? (
          <Skeleton className="h-96" />
        ) : (
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            <TabsContent value="pending"><TaskList filter="pending" /></TabsContent>
            <TabsContent value="in_progress"><TaskList filter="in_progress" /></TabsContent>
            <TabsContent value="completed"><TaskList filter="completed" /></TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}