import { AppLayout } from "@/components/layout";
import {
  useGetPhishingCampaigns,
  getGetPhishingCampaignsQueryKey,
  useGetPhishingTemplates,
  getGetPhishingTemplatesQueryKey,
  useCreatePhishingCampaign,
  useDeletePhishingCampaign,
  useGetPhishingCampaign,
  getGetPhishingCampaignQueryKey,
  useGetTeamMembers,
  getGetTeamMembersQueryKey,
  getGetSecuritySummaryQueryKey,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft, Target, Plus, Copy, ChevronRight, Trash2,
  MousePointerClick, Mail, AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";

function CreateCampaignDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: templates } = useGetPhishingTemplates({
    query: { queryKey: getGetPhishingTemplatesQueryKey(), enabled: open },
  });
  const { data: members } = useGetTeamMembers({
    query: { queryKey: getGetTeamMembersQueryKey(), enabled: open },
  });
  const create = useCreatePhishingCampaign();
  const [name, setName] = useState("");
  const [templateKey, setTemplateKey] = useState<string>("");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const reset = () => {
    setName(""); setTemplateKey(""); setSelected(new Set());
  };

  const submit = async () => {
    if (!name || !templateKey || selected.size === 0) return;
    try {
      await create.mutateAsync({
        data: { name, templateKey, recipientMemberIds: Array.from(selected) },
      });
      qc.invalidateQueries({ queryKey: getGetPhishingCampaignsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetSecuritySummaryQueryKey() });
      toast({ title: "Campaign created", description: "Copy the per-recipient links from the campaign detail and send them." });
      reset();
      onOpenChange(false);
    } catch {
      toast({ title: "Could not create campaign", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New phishing simulation</DialogTitle>
          <DialogDescription>
            We generate a unique tracking link per recipient. You distribute the links however you like
            (paste into your email tool). Clicks are tracked and recipients see a teaching page when they click.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div>
            <Label htmlFor="cname">Campaign name</Label>
            <Input id="cname" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Q2 phishing test" className="mt-1.5" />
          </div>
          <div>
            <Label>Pick a template</Label>
            <div className="mt-2 space-y-2">
              {templates?.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTemplateKey(t.key)}
                  className={`w-full text-left p-3 rounded border transition-colors ${
                    templateKey === t.key ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium">{t.name}</div>
                    <Badge variant="outline" className="capitalize">{t.difficulty}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">Subject: {t.subject}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Recipients</Label>
            <div className="mt-2 max-h-48 overflow-y-auto space-y-1 border rounded p-2">
              {members?.map((m) => (
                <label key={m.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer">
                  <Checkbox
                    checked={selected.has(m.id)}
                    onCheckedChange={(c) => {
                      const next = new Set(selected);
                      if (c) next.add(m.id); else next.delete(m.id);
                      setSelected(next);
                    }}
                  />
                  <span className="flex-1 text-sm">{m.name}</span>
                  <span className="text-xs text-muted-foreground">{m.email}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={!name || !templateKey || selected.size === 0 || create.isPending}>
            Create campaign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CampaignDetailDialog({ campaignId, onClose }: { campaignId: number; onClose: () => void }) {
  const { toast } = useToast();
  const { data: campaign, isLoading } = useGetPhishingCampaign(campaignId, {
    query: { queryKey: getGetPhishingCampaignQueryKey(campaignId) },
  });

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Link copied" });
  };
  const copyAll = () => {
    if (!campaign) return;
    const lines = campaign.results.map((r) => `${r.memberName} <${r.memberEmail}> — ${r.link}`);
    navigator.clipboard.writeText(lines.join("\n"));
    toast({ title: "All links copied" });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{campaign?.name ?? "Campaign"}</DialogTitle>
        </DialogHeader>
        {isLoading || !campaign ? <Skeleton className="h-64" /> : (
          <>
            <Card className="p-4 bg-muted/40 mb-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Email template</div>
              <div className="font-semibold mb-1">{campaign.template.name}</div>
              <div className="text-sm text-muted-foreground mb-2">Subject: {campaign.template.subject}</div>
              <pre className="text-xs whitespace-pre-wrap font-mono p-3 bg-background rounded border">
{campaign.template.previewBody}
              </pre>
              <div className="mt-3 text-xs text-muted-foreground">
                Replace <code className="px-1 py-0.5 rounded bg-muted">{"{{LINK}}"}</code> with each recipient's unique tracking link below.
              </div>
            </Card>

            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Recipients ({campaign.results.length})</div>
              <Button size="sm" variant="outline" onClick={copyAll}>
                <Copy className="h-3 w-3 mr-1" /> Copy all links
              </Button>
            </div>
            <div className="space-y-2">
              {campaign.results.map((r) => (
                <div key={r.id} className="p-3 rounded border flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{r.memberName}</div>
                    <div className="text-xs text-muted-foreground truncate">{r.memberEmail}</div>
                    <div className="text-xs font-mono mt-1 truncate text-muted-foreground">{r.link}</div>
                  </div>
                  <div>
                    {r.clickedAt ? (
                      <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30 gap-1">
                        <MousePointerClick className="h-3 w-3" /> Clicked
                      </Badge>
                    ) : (
                      <Badge variant="outline">Not clicked</Badge>
                    )}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => copy(r.link)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function SecurityPhishing() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: campaigns, isLoading } = useGetPhishingCampaigns({
    query: { queryKey: getGetPhishingCampaignsQueryKey() },
  });
  const del = useDeletePhishingCampaign();
  const [creating, setCreating] = useState(false);
  const [openCampaign, setOpenCampaign] = useState<number | null>(null);

  return (
    <AppLayout>
      <Link href="/security" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-3">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Security
      </Link>
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Phishing Simulations
          </h1>
          <p className="text-muted-foreground">
            Test how well your team spots fake emails. Pick a template, pick recipients,
            distribute the unique tracking links from your own email tool.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-2" /> New simulation
        </Button>
      </div>

      {isLoading && <Skeleton className="h-48" />}
      {!isLoading && campaigns && campaigns.length === 0 && (
        <Card className="p-10 text-center">
          <Mail className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-1">No campaigns yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Phishing tests are the cheapest, fastest way to find out who needs more training.
          </p>
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-2" /> Create your first campaign
          </Button>
        </Card>
      )}
      {!isLoading && campaigns && campaigns.length > 0 && (
        <div className="space-y-3">
          {campaigns.map((c) => {
            const clickRate = c.recipientCount === 0 ? 0
              : Math.round((c.clickCount / c.recipientCount) * 100);
            return (
              <Card key={c.id} className="p-5">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold mb-1">{c.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Template: {c.templateName} · Sent {format(new Date(c.createdAt), "MMM d, yyyy")}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{c.clickCount}</div>
                      <div className="text-xs text-muted-foreground">of {c.recipientCount} clicked</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${clickRate > 30 ? "text-red-600 dark:text-red-400" : clickRate > 0 ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"}`}>
                        {clickRate}%
                      </div>
                      <div className="text-xs text-muted-foreground">click rate</div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setOpenCampaign(c.id)}>
                      View <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={async () => {
                      if (!confirm("Delete this campaign?")) return;
                      await del.mutateAsync({ campaignId: c.id });
                      qc.invalidateQueries({ queryKey: getGetPhishingCampaignsQueryKey() });
                      qc.invalidateQueries({ queryKey: getGetSecuritySummaryQueryKey() });
                      toast({ title: "Campaign deleted" });
                    }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {clickRate > 0 && (
                  <div className="mt-3 p-2 rounded bg-amber-500/10 border border-amber-500/30 text-xs flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                    Coachable moment — assign clickers to the "Spotting Phishing Emails" lesson.
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <CreateCampaignDialog open={creating} onOpenChange={setCreating} />
      {openCampaign !== null && (
        <CampaignDetailDialog campaignId={openCampaign} onClose={() => setOpenCampaign(null)} />
      )}
    </AppLayout>
  );
}
