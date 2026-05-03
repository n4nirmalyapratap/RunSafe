import { AppLayout } from "@/components/layout";
import { Link, useParams } from "wouter";
import {
  useGetTaskAssignment,
  getGetTaskAssignmentQueryKey,
  getGetTaskAssignmentsQueryKey,
  useUpdateTaskAssignment,
  useCompleteTaskStep,
  useUncompleteTaskStep,
  type TaskAssignmentDetail,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format, isPast, isToday } from "date-fns";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  PlayCircle,
  User,
  Mail,
  AlertCircle,
  FileText,
} from "lucide-react";
import { useMemo } from "react";

type Status = "pending" | "in_progress" | "completed";

function StatusPill({ status }: { status: Status }) {
  if (status === "completed")
    return (
      <Badge className="bg-emerald-500 hover:bg-emerald-600 gap-1">
        <CheckCircle2 className="h-3 w-3" /> Done
      </Badge>
    );
  if (status === "in_progress")
    return (
      <Badge className="bg-blue-500 hover:bg-blue-600 gap-1">
        <PlayCircle className="h-3 w-3" /> In Progress
      </Badge>
    );
  return (
    <Badge variant="outline" className="gap-1">
      <Clock className="h-3 w-3" /> To Do
    </Badge>
  );
}

export function TaskDetail() {
  const params = useParams();
  const taskId = Number(params.taskId);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: task, isLoading } = useGetTaskAssignment(taskId, {
    query: {
      enabled: !!taskId,
      queryKey: getGetTaskAssignmentQueryKey(taskId),
    },
  });

  const detail = task as TaskAssignmentDetail | undefined;

  const updateTask = useUpdateTaskAssignment();
  const completeStep = useCompleteTaskStep();
  const uncompleteStep = useUncompleteTaskStep();

  const completedSet = useMemo(
    () => new Set(detail?.completedStepIds ?? []),
    [detail?.completedStepIds],
  );

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getGetTaskAssignmentQueryKey(taskId) });
    qc.invalidateQueries({ queryKey: getGetTaskAssignmentsQueryKey() });
  };

  const handleStepToggle = (stepId: number, currentlyDone: boolean) => {
    if (!detail) return;

    // optimistic update
    const prev = qc.getQueryData<TaskAssignmentDetail>(getGetTaskAssignmentQueryKey(taskId));
    if (prev) {
      const nextIds = currentlyDone
        ? prev.completedStepIds.filter((id) => id !== stepId)
        : [...prev.completedStepIds, stepId];
      qc.setQueryData<TaskAssignmentDetail>(getGetTaskAssignmentQueryKey(taskId), {
        ...prev,
        completedStepIds: nextIds,
      });
    }

    const onError = () => {
      if (prev) qc.setQueryData(getGetTaskAssignmentQueryKey(taskId), prev);
      toast({ title: "Couldn't update step", variant: "destructive" });
    };

    if (currentlyDone) {
      uncompleteStep.mutate(
        { taskId, stepId },
        { onSuccess: invalidate, onError },
      );
    } else {
      completeStep.mutate(
        { taskId, stepId },
        {
          onSuccess: () => {
            // auto-bump status: first step completed → in_progress, all done → completed
            const total = detail.steps.length;
            const newCount = (prev?.completedStepIds.length ?? 0) + 1;
            if (total > 0 && newCount === total && detail.status !== "completed") {
              updateTask.mutate(
                { taskId, data: { status: "completed" } },
                { onSuccess: invalidate, onError: invalidate },
              );
              toast({ title: "All steps complete — task marked Done" });
            } else if (newCount === 1 && detail.status === "pending") {
              updateTask.mutate(
                { taskId, data: { status: "in_progress" } },
                { onSuccess: invalidate, onError: invalidate },
              );
            } else {
              invalidate();
            }
          },
          onError,
        },
      );
    }
  };

  const handleStatusChange = (status: Status) => {
    updateTask.mutate(
      { taskId, data: { status } },
      {
        onSuccess: () => {
          invalidate();
          toast({ title: `Status updated to ${status.replace("_", " ")}` });
        },
        onError: () => toast({ title: "Couldn't update status", variant: "destructive" }),
      },
    );
  };

  if (isLoading) {
    return (
      <AppLayout>
        <Skeleton className="h-96" />
      </AppLayout>
    );
  }

  if (!detail) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <Link href="/tasks" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Tasks
          </Link>
          <div className="text-center py-12 text-muted-foreground border rounded-lg">
            Task not found.
          </div>
        </div>
      </AppLayout>
    );
  }

  const total = detail.steps.length;
  const done = completedSet.size;
  const progressPct = total > 0 ? (done / total) * 100 : 0;

  const due = detail.dueDate ? new Date(detail.dueDate) : null;
  const isOverdue = due ? isPast(due) && !isToday(due) && detail.status !== "completed" : false;
  const isDueToday = due ? isToday(due) : false;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl">
        <Link href="/tasks" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Tasks
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 font-mono">
              TASK-{detail.id}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{detail.sopTitle}</h1>
            {detail.sopDescription && (
              <p className="text-muted-foreground mt-1">{detail.sopDescription}</p>
            )}
          </div>
          <StatusPill status={detail.status as Status} />
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_280px]">
          <div className="space-y-6">
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Steps</h2>
                  <p className="text-sm text-muted-foreground">
                    Check off each step as you complete the procedure.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold">
                    {done}<span className="text-muted-foreground text-base">/{total}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">complete</div>
                </div>
              </div>

              {total > 0 && <Progress value={progressPct} className="h-2 mb-4" />}

              {total === 0 ? (
                <div className="text-center text-muted-foreground py-8 border border-dashed rounded-md">
                  This SOP has no steps defined yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {detail.steps.map((step, idx) => {
                    const isDone = completedSet.has(step.id);
                    return (
                      <label
                        key={step.id}
                        className={`flex items-start gap-3 p-3 border rounded-md cursor-pointer transition hover:bg-slate-50 ${
                          isDone ? "bg-slate-50" : "bg-background"
                        }`}
                      >
                        <Checkbox
                          checked={isDone}
                          onCheckedChange={() => handleStepToggle(step.id, isDone)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div
                            className={`font-medium text-sm ${
                              isDone ? "line-through text-muted-foreground" : ""
                            }`}
                          >
                            <span className="text-muted-foreground font-mono mr-2">
                              {String(idx + 1).padStart(2, "0")}
                            </span>
                            {step.title}
                          </div>
                          {step.description && (
                            <div
                              className={`text-sm mt-1 ${
                                isDone ? "text-muted-foreground/70" : "text-muted-foreground"
                              }`}
                            >
                              {step.description}
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {detail.notes && (
              <div className="bg-card border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">Notes</h2>
                </div>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                  {detail.notes}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-card border rounded-lg p-5 space-y-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-2">
                  Status
                </div>
                <Select
                  value={detail.status}
                  onValueChange={(v) => handleStatusChange(v as Status)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-2">
                  Assignee
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700">
                    {detail.assigneeName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{detail.assigneeName}</div>
                    <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {detail.assigneeEmail}
                    </div>
                  </div>
                </div>
              </div>

              {due && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-2">
                    Due Date
                  </div>
                  <div
                    className={`flex items-center gap-2 text-sm font-medium ${
                      isOverdue
                        ? "text-red-600"
                        : isDueToday
                        ? "text-amber-600"
                        : "text-foreground"
                    }`}
                  >
                    {isOverdue ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <CalendarDays className="h-4 w-4" />
                    )}
                    {format(due, "MMM d, yyyy")}
                    {isOverdue && <span className="text-xs">(overdue)</span>}
                    {isDueToday && <span className="text-xs">(today)</span>}
                  </div>
                </div>
              )}

              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-2">
                  Created
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(detail.createdAt), "MMM d, yyyy")}
                </div>
              </div>

              {detail.completedAt && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-2">
                    Completed
                  </div>
                  <div className="text-sm text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    {format(new Date(detail.completedAt), "MMM d, yyyy")}
                  </div>
                </div>
              )}
            </div>

            {detail.status !== "completed" && (
              <Button
                className="w-full"
                onClick={() => handleStatusChange("completed")}
                disabled={updateTask.isPending}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark as Done
              </Button>
            )}
          </div>
        </div>

        <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-2">
          <User className="h-3 w-3" />
          From SOP:{" "}
          <Link href={`/sops/${detail.sopId}`} className="underline hover:text-foreground">
            {detail.sopTitle}
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
