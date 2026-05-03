import { AppLayout } from "@/components/layout";
import {
  useGetPlaybooks, getGetPlaybooksQueryKey,
  useGetPlaybook, getGetPlaybookQueryKey,
  useGetIncidents, getGetIncidentsQueryKey,
  useCreateIncident, useUpdateIncident,
  getGetSecuritySummaryQueryKey,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft, ScrollText, Play, AlertCircle, CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";

function severityClass(sev: string) {
  if (sev === "critical") return "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30";
  if (sev === "high") return "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30";
  if (sev === "medium") return "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30";
  return "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30";
}

function PlaybookDialog({ playbookId, onClose, onStart }: {
  playbookId: number; onClose: () => void; onStart: () => void;
}) {
  const { data: pb, isLoading } = useGetPlaybook(playbookId, {
    query: { queryKey: getGetPlaybookQueryKey(playbookId) },
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pb?.title ?? "Playbook"}</DialogTitle>
          {pb && (
            <DialogDescription>
              <Badge className={`${severityClass(pb.severity)} mr-2 capitalize`}>{pb.severity}</Badge>
              {pb.description}
            </DialogDescription>
          )}
        </DialogHeader>
        {isLoading || !pb ? <Skeleton className="h-48" /> : (
          <ol className="space-y-3 my-3">
            {pb.steps.map((s, i) => (
              <li key={i} className="p-3 rounded border bg-muted/30">
                <div className="font-medium mb-1">
                  <span className="text-muted-foreground mr-2">{i + 1}.</span>
                  {s.title}
                </div>
                <div className="text-sm text-muted-foreground">{s.detail}</div>
              </li>
            ))}
          </ol>
        )}
        <DialogFooter>
          <Button onClick={onStart}>
            <Play className="h-4 w-4 mr-2" /> Start incident from this playbook
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StartIncidentDialog({ playbookId, onClose }: { playbookId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const create = useCreateIncident();
  const { data: pb } = useGetPlaybook(playbookId, {
    query: { queryKey: getGetPlaybookQueryKey(playbookId) },
  });
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Open incident</DialogTitle>
          <DialogDescription>
            From: {pb?.title ?? "playbook"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="ititle">Short title</Label>
            <Input id="ititle" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Sarah's laptop stolen at airport" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="inotes">Initial notes (optional)</Label>
            <Textarea id="inotes" value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="What happened, when, who's affected" rows={3} className="mt-1.5" />
          </div>
        </div>
        <DialogFooter>
          <Button disabled={!title || create.isPending} onClick={async () => {
            try {
              await create.mutateAsync({ data: { playbookId, title, notes } });
              qc.invalidateQueries({ queryKey: getGetIncidentsQueryKey() });
              qc.invalidateQueries({ queryKey: getGetSecuritySummaryQueryKey() });
              toast({ title: "Incident opened" });
              onClose();
            } catch {
              toast({ title: "Could not open incident", variant: "destructive" });
            }
          }}>Open incident</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function IncidentDialog({
  incidentId, onClose,
}: { incidentId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: incidents } = useGetIncidents({ query: { queryKey: getGetIncidentsQueryKey() } });
  const incident = incidents?.find((i) => i.id === incidentId);
  const { data: pb } = useGetPlaybook(incident?.playbookId ?? 0, {
    query: { queryKey: getGetPlaybookQueryKey(incident?.playbookId ?? 0), enabled: !!incident },
  });
  const update = useUpdateIncident();

  if (!incident) return null;

  const toggle = async (idx: number) => {
    const next = new Set(incident.completedStepIndices);
    if (next.has(idx)) next.delete(idx); else next.add(idx);
    await update.mutateAsync({
      incidentId,
      data: { completedStepIndices: Array.from(next).sort((a, b) => a - b) },
    });
    qc.invalidateQueries({ queryKey: getGetIncidentsQueryKey() });
  };

  const resolve = async () => {
    await update.mutateAsync({ incidentId, data: { status: "resolved" } });
    qc.invalidateQueries({ queryKey: getGetIncidentsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetSecuritySummaryQueryKey() });
    toast({ title: "Incident resolved" });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{incident.title}</DialogTitle>
          <DialogDescription>
            <Badge className={`${severityClass(incident.playbookSeverity)} capitalize mr-2`}>
              {incident.playbookSeverity}
            </Badge>
            {incident.playbookTitle} · opened by {incident.openedByName} · {format(new Date(incident.openedAt), "MMM d, h:mm a")}
          </DialogDescription>
        </DialogHeader>
        {!pb ? <Skeleton className="h-32" /> : (
          <ol className="space-y-2 my-3">
            {pb.steps.map((s, i) => {
              const done = incident.completedStepIndices.includes(i);
              return (
                <li key={i}
                  className={`p-3 rounded border flex items-start gap-3 ${done ? "bg-green-500/5 border-green-500/30" : ""}`}>
                  <Checkbox checked={done} onCheckedChange={() => toggle(i)} className="mt-0.5" />
                  <div className="flex-1">
                    <div className={`font-medium text-sm ${done ? "line-through text-muted-foreground" : ""}`}>
                      {i + 1}. {s.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{s.detail}</div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        {incident.status === "open" && (
          <DialogFooter>
            <Button onClick={resolve} variant="default">
              <CheckCircle2 className="h-4 w-4 mr-2" /> Mark incident resolved
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function SecurityPlaybooks() {
  const { data: playbooks, isLoading: pbLoading } = useGetPlaybooks({
    query: { queryKey: getGetPlaybooksQueryKey() },
  });
  const { data: incidents, isLoading: incLoading } = useGetIncidents({
    query: { queryKey: getGetIncidentsQueryKey() },
  });
  const [openPlaybook, setOpenPlaybook] = useState<number | null>(null);
  const [startFrom, setStartFrom] = useState<number | null>(null);
  const [openIncident, setOpenIncident] = useState<number | null>(null);

  const open = incidents?.filter((i) => i.status === "open") ?? [];
  const resolved = incidents?.filter((i) => i.status === "resolved") ?? [];

  return (
    <AppLayout>
      <Link href="/security" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-3">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Security
      </Link>
      <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
        <ScrollText className="h-6 w-6 text-primary" />
        Incident Response Playbooks
      </h1>
      <p className="text-muted-foreground mb-6">
        Pre-built step-by-step runbooks for the worst days. When something happens, open the incident and tick off the steps as you go.
      </p>

      <Tabs defaultValue="playbooks">
        <TabsList>
          <TabsTrigger value="playbooks">Playbooks</TabsTrigger>
          <TabsTrigger value="open">
            Open <Badge variant="outline" className="ml-2">{open.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value="playbooks" className="mt-4">
          {pbLoading && <Skeleton className="h-48" />}
          {playbooks && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {playbooks.map((p) => (
                <Card key={p.id} className="p-5 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setOpenPlaybook(p.id)}>
                  <div className="flex items-start justify-between mb-3">
                    <Badge className={`${severityClass(p.severity)} capitalize`}>{p.severity}</Badge>
                    <span className="text-xs text-muted-foreground">{p.stepCount} steps</span>
                  </div>
                  <h3 className="font-semibold mb-1">{p.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="open" className="mt-4">
          {incLoading && <Skeleton className="h-48" />}
          {!incLoading && open.length === 0 && (
            <Card className="p-10 text-center">
              <CheckCircle2 className="h-10 w-10 mx-auto text-green-500 mb-3" />
              <h3 className="font-semibold mb-1">No open incidents</h3>
              <p className="text-sm text-muted-foreground">Quiet day. Long may it last.</p>
            </Card>
          )}
          <div className="space-y-2">
            {open.map((i) => (
              <Card key={i.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setOpenIncident(i.id)}>
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{i.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {i.playbookTitle} · {i.completedStepIndices.length} steps done · opened {format(new Date(i.openedAt), "MMM d")}
                    </div>
                  </div>
                  <Badge className={`${severityClass(i.playbookSeverity)} capitalize`}>{i.playbookSeverity}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="resolved" className="mt-4">
          <div className="space-y-2">
            {resolved.length === 0 && <p className="text-sm text-muted-foreground">No resolved incidents yet.</p>}
            {resolved.map((i) => (
              <Card key={i.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow opacity-80"
                onClick={() => setOpenIncident(i.id)}>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{i.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {i.playbookTitle} · resolved {i.resolvedAt && format(new Date(i.resolvedAt), "MMM d")}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {openPlaybook !== null && startFrom === null && openIncident === null && (
        <PlaybookDialog
          playbookId={openPlaybook}
          onClose={() => setOpenPlaybook(null)}
          onStart={() => { setStartFrom(openPlaybook); setOpenPlaybook(null); }}
        />
      )}
      {startFrom !== null && (
        <StartIncidentDialog playbookId={startFrom} onClose={() => setStartFrom(null)} />
      )}
      {openIncident !== null && (
        <IncidentDialog incidentId={openIncident} onClose={() => setOpenIncident(null)} />
      )}
    </AppLayout>
  );
}
