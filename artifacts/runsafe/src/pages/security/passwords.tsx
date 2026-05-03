import { AppLayout } from "@/components/layout";
import {
  useGetPasswordAttestations,
  getGetPasswordAttestationsQueryKey,
  useGetMyPasswordAttestation,
  getGetMyPasswordAttestationQueryKey,
  useUpsertMyPasswordAttestation,
  useGetWorkspace,
  getGetWorkspaceQueryKey,
  getGetSecuritySummaryQueryKey,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, KeyRound, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

const FLAGS = [
  {
    key: "usesManager" as const,
    label: "I use a password manager",
    detail: "1Password, Bitwarden, Dashlane, or my browser's built-in manager.",
  },
  {
    key: "length12Plus" as const,
    label: "All my passwords are 12+ characters",
    detail: "Long beats weird-symbol-soup. A passphrase like 'maple-truck-orange-7' is great.",
  },
  {
    key: "uniquePerSite" as const,
    label: "I use a unique password for every site",
    detail: "Reusing the same password is the #1 way accounts get hacked.",
  },
  {
    key: "mfaEverywhere" as const,
    label: "I have MFA on email, banking, and work tools",
    detail: "Multi-factor (a code or tap on your phone) blocks 99% of account takeovers.",
  },
];

export function SecurityPasswords() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: workspace } = useGetWorkspace({ query: { queryKey: getGetWorkspaceQueryKey() } });
  const isOwner = workspace?.userRole === "owner";
  const { data: mine, isLoading: mineLoading } = useGetMyPasswordAttestation({
    query: { queryKey: getGetMyPasswordAttestationQueryKey() },
  });
  const { data: all } = useGetPasswordAttestations({
    query: { queryKey: getGetPasswordAttestationsQueryKey(), enabled: !!isOwner },
  });
  const upsert = useUpsertMyPasswordAttestation();
  const [draft, setDraft] = useState({
    usesManager: false, length12Plus: false, uniquePerSite: false, mfaEverywhere: false,
  });
  useEffect(() => {
    if (mine) {
      setDraft({
        usesManager: mine.usesManager,
        length12Plus: mine.length12Plus,
        uniquePerSite: mine.uniquePerSite,
        mfaEverywhere: mine.mfaEverywhere,
      });
    }
  }, [mine]);

  const submit = async () => {
    try {
      await upsert.mutateAsync({ data: draft });
      qc.invalidateQueries({ queryKey: getGetMyPasswordAttestationQueryKey() });
      qc.invalidateQueries({ queryKey: getGetPasswordAttestationsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetSecuritySummaryQueryKey() });
      toast({ title: "Saved" });
    } catch {
      toast({ title: "Could not save", variant: "destructive" });
    }
  };

  const liveScore = Object.values(draft).filter(Boolean).length * 25;

  return (
    <AppLayout>
      <Link href="/security" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-3">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Security
      </Link>
      <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
        <KeyRound className="h-6 w-6 text-primary" />
        Password Hygiene
      </h1>
      <p className="text-muted-foreground mb-6">
        A 30-second self-check that turns into a team-wide score.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">My attestation</h2>
            <Badge variant="outline" className="text-base font-bold">{liveScore} / 100</Badge>
          </div>
          {mineLoading ? <Skeleton className="h-32" /> : (
            <>
              <div className="space-y-3 mb-5">
                {FLAGS.map((f) => (
                  <label key={f.key} className="flex items-start gap-3 p-3 rounded border hover:bg-muted/30 cursor-pointer">
                    <Checkbox
                      checked={draft[f.key]}
                      onCheckedChange={(c) => setDraft({ ...draft, [f.key]: !!c })}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{f.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{f.detail}</div>
                    </div>
                  </label>
                ))}
              </div>
              <Button onClick={submit} disabled={upsert.isPending} className="w-full">
                {mine ? "Update attestation" : "Submit attestation"}
              </Button>
              {mine && (
                <div className="text-xs text-muted-foreground mt-3 text-center">
                  Last attested {format(new Date(mine.attestedAt), "MMM d, yyyy")}
                </div>
              )}
            </>
          )}
        </Card>

        {isOwner && (
          <Card className="p-6">
            <h2 className="font-semibold mb-4">Team scorecard</h2>
            {!all && <Skeleton className="h-32" />}
            {all && all.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No team members have attested yet. Share this page with your team.
              </p>
            )}
            {all && all.length > 0 && (
              <div className="space-y-2">
                {all.map((a) => (
                  <div key={a.id} className="p-3 rounded border flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{a.memberName}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {[
                          a.usesManager && "Manager",
                          a.length12Plus && "12+",
                          a.uniquePerSite && "Unique",
                          a.mfaEverywhere && "MFA",
                        ].filter(Boolean).join(" · ") || "—"}
                      </div>
                    </div>
                    <Badge className={
                      a.score === 100 ? "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30 gap-1"
                      : a.score >= 75 ? "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30"
                      : "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30"
                    }>
                      {a.score === 100 && <CheckCircle2 className="h-3 w-3" />}
                      {a.score} / 100
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
