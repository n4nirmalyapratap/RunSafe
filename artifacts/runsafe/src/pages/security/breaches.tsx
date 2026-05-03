import { AppLayout } from "@/components/layout";
import {
  useGetSecurityBreachChecks,
  getGetSecurityBreachChecksQueryKey,
  useRefreshSecurityBreachCheck,
  useGetTeamMembers,
  getGetTeamMembersQueryKey,
  getGetSecuritySummaryQueryKey,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Search, AlertTriangle, ShieldCheck, RefreshCw } from "lucide-react";
import { format } from "date-fns";

export function SecurityBreaches() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [refreshingId, setRefreshingId] = useState<number | null>(null);
  const { data: members } = useGetTeamMembers({ query: { queryKey: getGetTeamMembersQueryKey() } });
  const { data: checks, isLoading } = useGetSecurityBreachChecks({
    query: { queryKey: getGetSecurityBreachChecksQueryKey() },
  });
  const refresh = useRefreshSecurityBreachCheck();

  const checksByMember = useMemo(() => {
    const m = new Map<number, NonNullable<typeof checks>[number]>();
    (checks ?? []).forEach((c) => m.set(c.memberId, c));
    return m;
  }, [checks]);

  const handleRefresh = async (memberId: number) => {
    setRefreshingId(memberId);
    try {
      await refresh.mutateAsync({ memberId });
      qc.invalidateQueries({ queryKey: getGetSecurityBreachChecksQueryKey() });
      qc.invalidateQueries({ queryKey: getGetSecuritySummaryQueryKey() });
      toast({ title: "Scan complete" });
    } catch {
      toast({ title: "Scan failed", description: "Try again in a moment", variant: "destructive" });
    } finally {
      setRefreshingId(null);
    }
  };

  const handleScanAll = async () => {
    if (!members) return;
    for (const m of members) {
      setRefreshingId(m.id);
      try {
        await refresh.mutateAsync({ memberId: m.id });
      } catch { /* keep going */ }
    }
    qc.invalidateQueries({ queryKey: getGetSecurityBreachChecksQueryKey() });
    qc.invalidateQueries({ queryKey: getGetSecuritySummaryQueryKey() });
    setRefreshingId(null);
    toast({ title: "All members scanned" });
  };

  return (
    <AppLayout>
      <Link href="/security" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-3">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Security
      </Link>
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <Search className="h-6 w-6 text-primary" />
            Breach Exposure Monitor
          </h1>
          <p className="text-muted-foreground">
            Scans each team member's email against the public XposedOrNot breach database — real data, no API key needed.
          </p>
        </div>
        <Button onClick={handleScanAll} disabled={!members || refreshingId !== null}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshingId !== null ? "animate-spin" : ""}`} />
          Scan all members
        </Button>
      </div>

      {isLoading && <Skeleton className="h-64" />}

      {!isLoading && members && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {members.map((m) => {
            const check = checksByMember.get(m.id);
            const isScanning = refreshingId === m.id;
            return (
              <Card key={m.id} className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{m.name}</div>
                    <div className="text-sm text-muted-foreground truncate">{m.email}</div>
                  </div>
                  <div>
                    {!check ? (
                      <Badge variant="outline">Not scanned</Badge>
                    ) : check.breachCount === 0 ? (
                      <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30 gap-1">
                        <ShieldCheck className="h-3 w-3" /> Clean
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30 gap-1">
                        <AlertTriangle className="h-3 w-3" /> {check.breachCount} found
                      </Badge>
                    )}
                  </div>
                </div>
                {check && check.breaches.length > 0 && (
                  <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                    {check.breaches.map((b, i) => (
                      <div key={i} className="text-sm p-2 rounded bg-muted/50 border">
                        <div className="font-medium">{b.name}</div>
                        {b.date && (
                          <div className="text-xs text-muted-foreground">Breached {b.date}</div>
                        )}
                        {b.dataClasses.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Exposed: {b.dataClasses.slice(0, 5).join(", ")}
                            {b.dataClasses.length > 5 && "…"}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {check ? `Last scan: ${format(new Date(check.checkedAt), "MMM d, yyyy h:mm a")}` : "Never scanned"}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => handleRefresh(m.id)} disabled={isScanning}>
                    <RefreshCw className={`h-3 w-3 mr-1 ${isScanning ? "animate-spin" : ""}`} />
                    {isScanning ? "Scanning…" : "Scan"}
                  </Button>
                </div>
                {check && check.breachCount > 0 && (
                  <div className="mt-3 p-3 rounded border border-amber-500/30 bg-amber-500/10 text-xs">
                    <div className="font-medium mb-1">Recommended action</div>
                    Have {m.name.split(" ")[0]} change their passwords on any account using this email,
                    starting with email + banking + work tools. Turn on MFA everywhere.
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
