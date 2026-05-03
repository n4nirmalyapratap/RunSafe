import { AppLayout } from "@/components/layout";
import {
  useGetTaskAssignments,
  getGetTaskAssignmentsQueryKey,
  useUpdateTaskAssignment,
  type TaskAssignment,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Link } from "wouter";
import { format, isPast, isToday } from "date-fns";
import {
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertCircle,
  GripVertical,
  CalendarDays,
  User,
} from "lucide-react";

type Status = "pending" | "in_progress" | "completed";

const COLUMNS: { id: Status; title: string; accent: string; icon: React.ReactNode }[] = [
  {
    id: "pending",
    title: "To Do",
    accent: "border-t-slate-400",
    icon: <Clock className="h-4 w-4 text-slate-500" />,
  },
  {
    id: "in_progress",
    title: "In Progress",
    accent: "border-t-blue-500",
    icon: <PlayCircle className="h-4 w-4 text-blue-500" />,
  },
  {
    id: "completed",
    title: "Done",
    accent: "border-t-emerald-500",
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  },
];

function dueLabel(due: string | Date | null | undefined) {
  if (!due) return null;
  const d = new Date(due);
  const overdue = isPast(d) && !isToday(d);
  return {
    text: format(d, "MMM d"),
    overdue,
    today: isToday(d),
  };
}

function TaskCard({
  task,
  onDragStart,
  isDragging,
}: {
  task: TaskAssignment;
  onDragStart: (taskId: number) => void;
  isDragging: boolean;
}) {
  const progress = task.stepsTotal > 0 ? (task.stepsCompleted / task.stepsTotal) * 100 : 0;
  const due = dueLabel(task.dueDate);
  const isDone = task.status === "completed";

  return (
    <Link href={`/tasks/${task.id}`}>
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          onDragStart(task.id);
        }}
        className={`group bg-white border rounded-md p-3 shadow-sm hover:shadow-md hover:border-slate-300 transition cursor-pointer select-none ${
          isDragging ? "opacity-40" : ""
        } ${isDone ? "opacity-80" : ""}`}
      >
        <div className="flex items-start gap-2">
          <GripVertical className="h-4 w-4 mt-0.5 text-slate-300 group-hover:text-slate-400 cursor-grab active:cursor-grabbing flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className={`font-medium text-sm leading-snug line-clamp-2 ${isDone ? "line-through text-muted-foreground" : ""}`}>
              {task.sopTitle}
            </div>

            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="truncate">{task.assigneeName}</span>
            </div>

            {task.stepsTotal > 0 && (
              <div className="mt-2.5">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1 font-medium uppercase tracking-wide">
                  <span>Steps</span>
                  <span>
                    {task.stepsCompleted}/{task.stepsTotal}
                  </span>
                </div>
                <Progress value={progress} className="h-1" />
              </div>
            )}

            <div className="mt-2.5 flex items-center justify-between gap-2">
              {due ? (
                <Badge
                  variant="outline"
                  className={`text-[10px] font-medium gap-1 px-1.5 py-0 h-5 ${
                    due.overdue && !isDone
                      ? "border-red-200 bg-red-50 text-red-700"
                      : due.today && !isDone
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  {due.overdue && !isDone ? (
                    <AlertCircle className="h-2.5 w-2.5" />
                  ) : (
                    <CalendarDays className="h-2.5 w-2.5" />
                  )}
                  {due.text}
                </Badge>
              ) : (
                <span />
              )}
              <span className="text-[10px] text-muted-foreground font-mono">#{task.id}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function Column({
  column,
  tasks,
  draggingId,
  dragOverColumn,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  column: typeof COLUMNS[number];
  tasks: TaskAssignment[];
  draggingId: number | null;
  dragOverColumn: Status | null;
  onDragStart: (id: number) => void;
  onDragOver: (e: React.DragEvent, status: Status) => void;
  onDragLeave: () => void;
  onDrop: (status: Status) => void;
}) {
  const isDropTarget = dragOverColumn === column.id;

  return (
    <div
      onDragOver={(e) => onDragOver(e, column.id)}
      onDragLeave={onDragLeave}
      onDrop={() => onDrop(column.id)}
      className={`flex flex-col bg-slate-50 rounded-lg border-t-4 ${column.accent} min-h-[60vh] transition ${
        isDropTarget ? "bg-slate-100 ring-2 ring-slate-300" : ""
      }`}
    >
      <div className="flex items-center justify-between px-3 py-2.5 border-b bg-white/60 rounded-t-md">
        <div className="flex items-center gap-2">
          {column.icon}
          <h3 className="font-semibold text-sm">{column.title}</h3>
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-mono">
            {tasks.length}
          </Badge>
        </div>
      </div>

      <div className="flex-1 p-2 space-y-2 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground py-8 border border-dashed rounded-md mx-1">
            Drop tasks here
          </div>
        ) : (
          tasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onDragStart={onDragStart}
              isDragging={draggingId === t.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function Tasks() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: tasks, isLoading } = useGetTaskAssignments(undefined, {
    query: { queryKey: getGetTaskAssignmentsQueryKey() },
  });
  const updateTask = useUpdateTaskAssignment();

  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<Status | null>(null);

  const handleDrop = (status: Status) => {
    const taskId = draggingId;
    setDraggingId(null);
    setDragOverColumn(null);
    if (!taskId || !tasks) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === status) return;

    // optimistic update
    const prev = qc.getQueryData<TaskAssignment[]>(getGetTaskAssignmentsQueryKey());
    if (prev) {
      qc.setQueryData<TaskAssignment[]>(
        getGetTaskAssignmentsQueryKey(),
        prev.map((t) => (t.id === taskId ? { ...t, status } : t)),
      );
    }

    updateTask.mutate(
      { taskId, data: { status } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetTaskAssignmentsQueryKey() });
        },
        onError: () => {
          if (prev) qc.setQueryData(getGetTaskAssignmentsQueryKey(), prev);
          toast({ title: "Couldn't update task", variant: "destructive" });
        },
      },
    );
  };

  const grouped: Record<Status, TaskAssignment[]> = {
    pending: [],
    in_progress: [],
    completed: [],
  };
  (tasks ?? []).forEach((t) => {
    const s = (t.status as Status) ?? "pending";
    if (grouped[s]) grouped[s].push(t);
  });

  // Sort: overdue first, then by due date asc, then by id desc
  Object.keys(grouped).forEach((k) => {
    grouped[k as Status].sort((a, b) => {
      const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      if (da !== db) return da - db;
      return b.id - a.id;
    });
  });

  return (
    <AppLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Drag cards between columns to update status. Click a card to open it.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {COLUMNS.map((col) => (
              <Column
                key={col.id}
                column={col}
                tasks={grouped[col.id]}
                draggingId={draggingId}
                dragOverColumn={dragOverColumn}
                onDragStart={setDraggingId}
                onDragOver={(e, status) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (dragOverColumn !== status) setDragOverColumn(status);
                }}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={handleDrop}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
