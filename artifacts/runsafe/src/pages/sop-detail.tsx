import { AppLayout } from "@/components/layout";
import { useParams } from "wouter";
import {
  useGetSop,
  getGetSopQueryKey,
  useAddSopStep,
  useAssignSop,
  useGetTeamMembers,
  getGetTeamMembersQueryKey,
  useReorderSopSteps,
} from "@workspace/api-client-react";
import type { SopDetail } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, UserPlus, GripVertical, Users } from "lucide-react";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { SopStep } from "@workspace/api-client-react";

interface SopAssignment {
  id: number;
  assigneeName: string;
  assigneeEmail: string;
  status: string;
  dueDate?: string | null;
  createdAt: string;
}

interface SopDetailWithAssignments extends SopDetail {
  assignments: SopAssignment[];
}

const stepSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});
const assignSchema = z.object({
  assigneeId: z.coerce.number().min(1, "Assignee required"),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  in_progress: "secondary",
  completed: "default",
};

function DraggableStepList({
  steps,
  onReorder,
}: {
  steps: SopStep[];
  onReorder: (orderedIds: number[]) => void;
}) {
  const [localSteps, setLocalSteps] = useState<SopStep[]>(steps);
  const dragIndexRef = useRef<number | null>(null);

  const handleDragStart = (idx: number) => {
    dragIndexRef.current = idx;
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    const from = dragIndexRef.current;
    if (from == null || from === idx) return;
    const next = [...localSteps];
    const [moved] = next.splice(from, 1);
    next.splice(idx, 0, moved);
    dragIndexRef.current = idx;
    setLocalSteps(next);
  };

  const handleDrop = () => {
    onReorder(localSteps.map((s) => s.id));
    dragIndexRef.current = null;
  };

  if (localSteps.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">No steps yet. Add one above.</div>
    );
  }

  return (
    <div className="space-y-3">
      {localSteps.map((step, idx) => (
        <div
          key={step.id}
          draggable
          onDragStart={() => handleDragStart(idx)}
          onDragOver={(e) => handleDragOver(e, idx)}
          onDrop={handleDrop}
          className="flex gap-4 p-4 border rounded-md bg-background items-start cursor-default select-none"
        >
          <div className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground">
            <GripVertical className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="font-medium">Step {idx + 1}: {step.title}</div>
            {step.description && (
              <div className="text-sm text-muted-foreground mt-1">{step.description}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SopDetail() {
  const params = useParams();
  const sopId = Number(params.sopId);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: sopRaw, isLoading } = useGetSop(sopId, {
    query: { enabled: !!sopId, queryKey: getGetSopQueryKey(sopId) },
  });
  const sop = sopRaw as SopDetailWithAssignments | undefined;

  const { data: team } = useGetTeamMembers({ query: { queryKey: getGetTeamMembersQueryKey() } });

  const addStep = useAddSopStep();
  const assignSop = useAssignSop();
  const reorderSteps = useReorderSopSteps();

  const [stepOpen, setStepOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const stepForm = useForm<z.infer<typeof stepSchema>>({
    resolver: zodResolver(stepSchema),
    defaultValues: { title: "", description: "" },
  });
  const assignForm = useForm<z.infer<typeof assignSchema>>({
    resolver: zodResolver(assignSchema),
  });

  if (isLoading) return <AppLayout><Skeleton className="h-64" /></AppLayout>;
  if (!sop) return <AppLayout>SOP not found</AppLayout>;

  const assignments: SopAssignment[] = sop.assignments ?? [];

  const handleReorder = (orderedIds: number[]) => {
    reorderSteps.mutate(
      { sopId, data: { stepIds: orderedIds } },
      {
        onSuccess: () => qc.invalidateQueries({ queryKey: getGetSopQueryKey(sopId) }),
        onError: () => toast({ title: "Failed to save order", variant: "destructive" }),
      },
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <Link href="/sops" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to SOPs
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{sop.title}</h1>
            {sop.description && <p className="text-muted-foreground mt-1">{sop.description}</p>}
          </div>

          <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary">
                <UserPlus className="h-4 w-4 mr-2" /> Assign Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Assign SOP to Team Member</DialogTitle></DialogHeader>
              <Form {...assignForm}>
                <form
                  onSubmit={assignForm.handleSubmit((v) => {
                    assignSop.mutate(
                      {
                        sopId,
                        data: {
                          assigneeId: v.assigneeId,
                          notes: v.notes,
                          dueDate: v.dueDate || undefined,
                        },
                      },
                      {
                        onSuccess: () => {
                          toast({ title: "Assigned successfully" });
                          setAssignOpen(false);
                          qc.invalidateQueries({ queryKey: getGetSopQueryKey(sopId) });
                        },
                      },
                    );
                  })}
                  className="space-y-4"
                >
                  <FormField
                    control={assignForm.control}
                    name="assigneeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team Member</FormLabel>
                        <Select onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {team?.map((t) => (
                              <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={assignForm.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={assignForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={assignSop.isPending} className="w-full">Assign</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">Steps</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Drag to reorder steps</p>
            </div>
            <Dialog open={stepOpen} onOpenChange={setStepOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Step</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Step</DialogTitle></DialogHeader>
                <Form {...stepForm}>
                  <form
                    onSubmit={stepForm.handleSubmit((v) => {
                      addStep.mutate(
                        { sopId, data: v },
                        {
                          onSuccess: () => {
                            qc.invalidateQueries({ queryKey: getGetSopQueryKey(sopId) });
                            setStepOpen(false);
                            stepForm.reset();
                          },
                        },
                      );
                    })}
                    className="space-y-4"
                  >
                    <FormField
                      control={stepForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Step Title</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={stepForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={addStep.isPending} className="w-full">Add Step</Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <DraggableStepList steps={sop.steps ?? []} onReorder={handleReorder} />
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Assignment History</h2>
            {assignments.length > 0 && (
              <Badge variant="secondary">{assignments.length}</Badge>
            )}
          </div>

          {assignments.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              This SOP has not been assigned yet. Use "Assign Task" to delegate it to a team member.
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Assigned On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="font-medium">{a.assigneeName}</div>
                        <div className="text-xs text-muted-foreground">{a.assigneeEmail}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[a.status] ?? "outline"}>
                          {a.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {a.dueDate ? format(new Date(a.dueDate), "MMM d, yyyy") : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(a.createdAt), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
