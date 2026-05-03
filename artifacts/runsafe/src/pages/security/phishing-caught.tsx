import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, CheckCircle2, ChevronRight } from "lucide-react";

// Public, unauthenticated landing page shown when a phishing-test link
// is opened. We DO NOT show whose campaign it is — the recipient just
// learns they were caught and what to look out for next time.

const GENERIC_TIPS = [
  "Hover over the sender's name to see the actual email address.",
  "Be skeptical of urgency — countdowns, account suspensions, late fees.",
  "Don't enter passwords from a link in an email. Open the real site directly.",
  "When something feels off (wrong tone, weird formatting), it usually is.",
  "If a request involves money or credentials, verify on a different channel — phone or in person.",
];

export function PhishingCaught() {
  const [, params] = useRoute("/phishing-caught/:token");
  const token = params?.token;
  const [acknowledged, setAcknowledged] = useState(false);

  // Best-effort click tracking from the browser too, in case someone landed
  // here directly without going through the redirect endpoint.
  useEffect(() => {
    if (!token) return;
    fetch(`/api/phish/${encodeURIComponent(token)}`, { method: "GET", redirect: "manual" })
      .catch(() => { /* swallow */ });
  }, [token]);

  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 md:p-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-full bg-amber-500/15 flex items-center justify-center">
            <ShieldAlert className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <Badge variant="outline" className="mb-1">Security training</Badge>
            <h1 className="text-2xl md:text-3xl font-bold">That was a phishing test.</h1>
          </div>
        </div>

        <p className="text-base text-muted-foreground mb-6">
          The email you just clicked was a <strong>simulated phishing message</strong> sent
          by your own organization. No harm done — but if it had been real, an attacker could
          now have your password, your files, or both.
        </p>

        <div className="bg-muted/40 border rounded-lg p-5 mb-6">
          <h2 className="font-semibold mb-3">5 things to look out for next time</h2>
          <ul className="space-y-2">
            {GENERIC_TIPS.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <ChevronRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          You won't get in trouble for clicking — that's the whole point of the test.
          The next time an email looks suspicious, just <strong>pause</strong> and
          ask your manager before clicking. Reporting saves the team.
        </p>

        {!acknowledged ? (
          <Button onClick={() => setAcknowledged(true)} className="w-full" size="lg">
            <CheckCircle2 className="h-5 w-5 mr-2" /> I understand
          </Button>
        ) : (
          <div className="text-center text-sm text-muted-foreground">
            Thanks. You can close this tab.
            <div className="mt-3">
              <Link href="/dashboard" className="text-primary hover:underline">
                Or sign in to your dashboard
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
