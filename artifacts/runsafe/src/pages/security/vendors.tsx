import { AppLayout } from "@/components/layout";
import {
  useGetVendors, getGetVendorsQueryKey,
  useCreateVendor, useUpdateVendor, useDeleteVendor,
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
import { ArrowLeft, Building2, Plus, Trash2, RefreshCw } from "lucide-react";
import { format, differenceInDays } from "date-fns";

const ACCESS = ["low", "medium", "high", "critical"] as const;

function accessBadge(a: string) {
  if (a === "critical") return "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30";
  if (a === "high") return "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30";
  if (a === "medium") return "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30";
  return "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30";
}

type DraftV = {
  name: string; category: string; dataAccess: typeof ACCESS[number];
  hasMfa: boolean; hasSso: boolean; notes: string;
};
const EMPTY: DraftV = {
  name: "", category: "saas", dataAccess: "medium", hasMfa: false, hasSso: false, notes: "",
};

function VendorDialog({
  vendor, onClose,
}: { vendor: DraftV & { id?: number } | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const create = useCreateVendor();
  const update = useUpdateVendor();
  const [draft, setDraft] = useState<DraftV>(EMPTY);
  useEffect(() => {
    if (vendor) setDraft(vendor);
  }, [vendor]);

  if (!vendor) return null;

  const submit = async () => {
    try {
      if (vendor.id) {
        await update.mutateAsync({ vendorId: vendor.id, data: draft });
      } else {
        await create.mutateAsync({ data: draft });
      }
      qc.invalidateQueries({ queryKey: getGetVendorsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetSecuritySummaryQueryKey() });
      toast({ title: vendor.id ? "Vendor updated" : "Vendor added" });
      onClose();
    } catch {
      toast({ title: "Could not save", variant: "destructive" });
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{vendor.id ? "Edit vendor" : "Add vendor"}</DialogTitle>
          <DialogDescription>
            Track every third-party tool that touches your data. Review at least once a year.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="vname">Name</Label>
            <Input id="vname" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="mt-1.5" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="vcat">Category</Label>
              <Input id="vcat" value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                placeholder="saas, payments…" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="vacc">Data access</Label>
              <Select value={draft.dataAccess} onValueChange={(v) => setDraft({ ...draft, dataAccess: v as typeof ACCESS[number] })}>
                <SelectTrigger id="vacc" className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACCESS.map((a) => <SelectItem key={a} value={a} className="capitalize">{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={draft.hasMfa} onCheckedChange={(c) => setDraft({ ...draft, hasMfa: !!c })} />
              <span className="text-sm">MFA enabled for our team</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={draft.hasSso} onCheckedChange={(c) => setDraft({ ...draft, hasSso: !!c })} />
              <span className="text-sm">SSO configured</span>
            </label>
          </div>
          <div>
            <Label htmlFor="vnotes">Notes</Label>
            <Textarea id="vnotes" value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              rows={3} className="mt-1.5" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={!draft.name}>{vendor.id ? "Save" : "Add vendor"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SecurityVendors() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: vendors, isLoading } = useGetVendors({ query: { queryKey: getGetVendorsQueryKey() } });
  const update = useUpdateVendor();
  const del = useDeleteVendor();
  const [editing, setEditing] = useState<(DraftV & { id?: number }) | null>(null);

  const markReviewed = async (id: number) => {
    await update.mutateAsync({ vendorId: id, data: { markReviewed: true } });
    qc.invalidateQueries({ queryKey: getGetVendorsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetSecuritySummaryQueryKey() });
    toast({ title: "Marked reviewed" });
  };

  const remove = async (id: number) => {
    if (!confirm("Remove this vendor?")) return;
    await del.mutateAsync({ vendorId: id });
    qc.invalidateQueries({ queryKey: getGetVendorsQueryKey() });
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
            <Building2 className="h-6 w-6 text-primary" />
            Vendor & SaaS Risk Register
          </h1>
          <p className="text-muted-foreground">
            Every third-party tool that holds your customer data, your money, or your code. Reviewed annually keeps you in good shape.
          </p>
        </div>
        <Button onClick={() => setEditing({ ...EMPTY })}>
          <Plus className="h-4 w-4 mr-2" /> Add vendor
        </Button>
      </div>

      {isLoading && <Skeleton className="h-48" />}
      {!isLoading && vendors && vendors.length === 0 && (
        <Card className="p-10 text-center">
          <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-1">No vendors tracked</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start with the obvious ones — email, payment processor, accounting, CRM, file storage.
          </p>
          <Button onClick={() => setEditing({ ...EMPTY })}>Add your first vendor</Button>
        </Card>
      )}
      {!isLoading && vendors && vendors.length > 0 && (
        <div className="space-y-2">
          {vendors.map((v) => {
            const daysSince = v.lastReviewedAt
              ? differenceInDays(new Date(), new Date(v.lastReviewedAt)) : null;
            const stale = daysSince !== null && daysSince > 365;
            return (
              <Card key={v.id} className="p-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold">{v.name}</span>
                      <Badge variant="outline" className="text-xs">{v.category}</Badge>
                      <Badge className={`${accessBadge(v.dataAccess)} capitalize text-xs`}>{v.dataAccess} access</Badge>
                      {v.hasMfa && <Badge variant="outline" className="text-xs">MFA</Badge>}
                      {v.hasSso && <Badge variant="outline" className="text-xs">SSO</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {daysSince === null ? "Never reviewed"
                        : stale ? `Reviewed ${daysSince} days ago — overdue`
                        : `Reviewed ${format(new Date(v.lastReviewedAt!), "MMM d, yyyy")}`}
                    </div>
                    {v.notes && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{v.notes}</div>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => markReviewed(v.id)}>
                      <RefreshCw className="h-3 w-3 mr-1" /> Mark reviewed
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing({
                      id: v.id, name: v.name, category: v.category, dataAccess: v.dataAccess,
                      hasMfa: v.hasMfa, hasSso: v.hasSso, notes: v.notes ?? "",
                    })}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(v.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <VendorDialog vendor={editing} onClose={() => setEditing(null)} />
    </AppLayout>
  );
}
