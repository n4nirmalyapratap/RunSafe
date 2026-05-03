import { AppLayout } from "@/components/layout";
import {
  useGetDevices, getGetDevicesQueryKey,
  useCreateDevice, useUpdateDevice, useDeleteDevice,
  useGetTeamMembers, getGetTeamMembersQueryKey,
  useGetWorkspace, getGetWorkspaceQueryKey,
  getGetSecuritySummaryQueryKey,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft, Laptop, Plus, Trash2, Smartphone, Tablet, Monitor, ShieldAlert, ShieldCheck,
} from "lucide-react";

const TYPES = ["laptop", "phone", "tablet", "desktop"] as const;

const TypeIcon = ({ t, className }: { t: string; className?: string }) => {
  if (t === "phone") return <Smartphone className={className} />;
  if (t === "tablet") return <Tablet className={className} />;
  if (t === "desktop") return <Monitor className={className} />;
  return <Laptop className={className} />;
};

type DraftD = {
  name: string; type: typeof TYPES[number]; os: string;
  mfaEnabled: boolean; diskEncrypted: boolean; autoUpdates: boolean; notes: string;
  memberId?: number;
};
const EMPTY: DraftD = {
  name: "", type: "laptop", os: "",
  mfaEnabled: false, diskEncrypted: false, autoUpdates: false, notes: "",
};

function DeviceDialog({
  device, onClose, isOwner,
}: {
  device: (DraftD & { id?: number }) | null;
  onClose: () => void;
  isOwner: boolean;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const create = useCreateDevice();
  const update = useUpdateDevice();
  const { data: members } = useGetTeamMembers({
    query: { queryKey: getGetTeamMembersQueryKey(), enabled: !!isOwner && !device?.id },
  });
  const [draft, setDraft] = useState<DraftD>(EMPTY);
  useEffect(() => {
    if (device) setDraft(device);
  }, [device]);

  if (!device) return null;

  const submit = async () => {
    try {
      if (device.id) {
        const { memberId: _drop, ...rest } = draft;
        await update.mutateAsync({ deviceId: device.id, data: rest });
      } else {
        await create.mutateAsync({ data: draft });
      }
      qc.invalidateQueries({ queryKey: getGetDevicesQueryKey() });
      qc.invalidateQueries({ queryKey: getGetSecuritySummaryQueryKey() });
      toast({ title: device.id ? "Device updated" : "Device added" });
      onClose();
    } catch {
      toast({ title: "Could not save", variant: "destructive" });
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{device.id ? "Edit device" : "Add device"}</DialogTitle>
          <DialogDescription>
            Self-reported, no software install needed. Honesty makes the score useful.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="dname">Device name</Label>
            <Input id="dname" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Sarah's MacBook Pro" className="mt-1.5" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="dtype">Type</Label>
              <Select value={draft.type} onValueChange={(v) => setDraft({ ...draft, type: v as typeof TYPES[number] })}>
                <SelectTrigger id="dtype" className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dos">OS (optional)</Label>
              <Input id="dos" value={draft.os} onChange={(e) => setDraft({ ...draft, os: e.target.value })}
                placeholder="macOS 14, iOS 17…" className="mt-1.5" />
            </div>
          </div>
          {isOwner && !device.id && members && (
            <div>
              <Label htmlFor="dmem">Owner (optional)</Label>
              <Select
                value={draft.memberId !== undefined ? String(draft.memberId) : "self"}
                onValueChange={(v) => setDraft({ ...draft, memberId: v === "self" ? undefined : Number(v) })}
              >
                <SelectTrigger id="dmem" className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="self">Me</SelectItem>
                  {members.map((m) => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-muted/30">
              <Checkbox checked={draft.mfaEnabled} onCheckedChange={(c) => setDraft({ ...draft, mfaEnabled: !!c })} />
              <span className="text-sm">MFA is enabled on the device's main accounts</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-muted/30">
              <Checkbox checked={draft.diskEncrypted} onCheckedChange={(c) => setDraft({ ...draft, diskEncrypted: !!c })} />
              <span className="text-sm">Disk encryption is on (FileVault / BitLocker / device passcode)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-muted/30">
              <Checkbox checked={draft.autoUpdates} onCheckedChange={(c) => setDraft({ ...draft, autoUpdates: !!c })} />
              <span className="text-sm">Automatic OS updates are turned on</span>
            </label>
          </div>
          <div>
            <Label htmlFor="dnotes">Notes</Label>
            <Textarea id="dnotes" value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              rows={2} className="mt-1.5" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={!draft.name}>{device.id ? "Save" : "Add device"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SecurityDevices() {
  const qc = useQueryClient();
  const { data: workspace } = useGetWorkspace({ query: { queryKey: getGetWorkspaceQueryKey() } });
  const isOwner = workspace?.userRole === "owner";
  const { data: devices, isLoading } = useGetDevices({ query: { queryKey: getGetDevicesQueryKey() } });
  const del = useDeleteDevice();
  const [editing, setEditing] = useState<(DraftD & { id?: number }) | null>(null);

  const remove = async (id: number) => {
    if (!confirm("Remove this device?")) return;
    await del.mutateAsync({ deviceId: id });
    qc.invalidateQueries({ queryKey: getGetDevicesQueryKey() });
    qc.invalidateQueries({ queryKey: getGetSecuritySummaryQueryKey() });
  };

  return (
    <AppLayout>
      <Link href="/security" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-3">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Security
      </Link>
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <Laptop className="h-6 w-6 text-primary" />
            Device & MFA Inventory
          </h1>
          <p className="text-muted-foreground">
            {isOwner
              ? "Self-reported device security status across your team. No agents required."
              : "Add the work devices you use. Honesty here helps your team's security score."}
          </p>
        </div>
        <Button onClick={() => setEditing({ ...EMPTY })}>
          <Plus className="h-4 w-4 mr-2" /> Add device
        </Button>
      </div>

      {isLoading && <Skeleton className="h-48" />}
      {!isLoading && devices && devices.length === 0 && (
        <Card className="p-10 text-center">
          <Laptop className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-1">No devices logged</h3>
          <Button onClick={() => setEditing({ ...EMPTY })} className="mt-2">Add your first device</Button>
        </Card>
      )}
      {!isLoading && devices && devices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {devices.map((d) => {
            const good = d.mfaEnabled && d.diskEncrypted && d.autoUpdates;
            return (
              <Card key={d.id} className="p-4">
                <div className="flex items-start gap-3">
                  <TypeIcon t={d.type} className="h-8 w-8 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{d.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {d.memberName} · {d.type}{d.os ? ` · ${d.os}` : ""}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Badge variant="outline" className={`text-xs gap-1 ${d.mfaEnabled ? "border-green-500/40" : "border-red-500/40 text-red-700 dark:text-red-400"}`}>
                        {d.mfaEnabled ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                        MFA
                      </Badge>
                      <Badge variant="outline" className={`text-xs gap-1 ${d.diskEncrypted ? "border-green-500/40" : "border-red-500/40 text-red-700 dark:text-red-400"}`}>
                        {d.diskEncrypted ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                        Encrypted
                      </Badge>
                      <Badge variant="outline" className={`text-xs gap-1 ${d.autoUpdates ? "border-green-500/40" : "border-red-500/40 text-red-700 dark:text-red-400"}`}>
                        {d.autoUpdates ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                        Auto-update
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {good
                      ? <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30 text-xs">Good</Badge>
                      : <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-xs">Improve</Badge>}
                    <div className="flex">
                      <Button size="sm" variant="ghost" onClick={() => setEditing({
                        id: d.id, name: d.name, type: d.type as typeof TYPES[number], os: d.os ?? "",
                        mfaEnabled: d.mfaEnabled, diskEncrypted: d.diskEncrypted, autoUpdates: d.autoUpdates,
                        notes: d.notes ?? "",
                      })}>Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(d.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <DeviceDialog device={editing} onClose={() => setEditing(null)} isOwner={!!isOwner} />
    </AppLayout>
  );
}
