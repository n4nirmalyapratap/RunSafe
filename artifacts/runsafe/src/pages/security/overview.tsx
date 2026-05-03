import { Link } from "wouter";
import { AppLayout } from "@/components/layout";
import {
  useGetSecuritySummary,
  getGetSecuritySummaryQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  AlertTriangle,
  GraduationCap,
  Target,
  KeyRound,
  Building2,
  Laptop,
  ScrollText,
  ChevronRight,
} from "lucide-react";

function scoreColor(score: number) {
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
  if (score >= 40) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

function scoreRingClass(score: number) {
  if (score >= 80) return "stroke-green-500";
  if (score >= 60) return "stroke-yellow-500";
  if (score >= 40) return "stroke-orange-500";
  return "stroke-red-500";
}

const MODULES: Array<{
  key: "breach" | "training" | "phishing" | "password" | "vendors" | "devices";
  href: string;
  icon: typeof Shield;
}> = [
  { key: "breach", href: "/security/breaches", icon: AlertTriangle },
  { key: "training", href: "/security/training", icon: GraduationCap },
  { key: "phishing", href: "/security/phishing", icon: Target },
  { key: "password", href: "/security/passwords", icon: KeyRound },
  { key: "vendors", href: "/security/vendors", icon: Building2 },
  { key: "devices", href: "/security/devices", icon: Laptop },
];

export function SecurityOverview() {
  const { data: summary, isLoading } = useGetSecuritySummary({
    query: { queryKey: getGetSecuritySummaryQueryKey() },
  });

  if (isLoading || !summary) {
    return (
      <AppLayout>
        <Skeleton className="h-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </AppLayout>
    );
  }

  const score = summary.postureScore;
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          Cybersecurity Autopilot
        </h1>
        <p className="text-muted-foreground">
          Your team's overall security posture, in one place. Click any tile to dig in.
        </p>
      </div>

      <Card className="p-6 md:p-8 mb-8">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative w-40 h-40 shrink-0">
            <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
              <circle cx="70" cy="70" r={radius}
                className="stroke-muted fill-none" strokeWidth="12" />
              <circle cx="70" cy="70" r={radius}
                className={`${scoreRingClass(score)} fill-none transition-all`}
                strokeWidth="12" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={offset} />
            </svg>
            <div className={`absolute inset-0 flex flex-col items-center justify-center ${scoreColor(score)}`}>
              <div className="text-4xl font-bold">{score}</div>
              <div className="text-xs font-medium uppercase tracking-wider">/ 100</div>
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl font-bold mb-2">Posture Score</h2>
            <p className="text-muted-foreground mb-4">
              {score >= 80 && "Strong. Keep up the routine — your team is well above average for an SMB."}
              {score >= 60 && score < 80 && "Solid foundation, room to grow. Focus on the modules below sitting under 80."}
              {score >= 40 && score < 60 && "Risky. A breach is much more likely than it should be — start with the lowest-scoring module."}
              {score < 40 && "Critical. Most attacks succeed against orgs in this range. Spend an hour on the lowest-scoring module today."}
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start text-sm">
              <Badge variant="outline" className="gap-1.5">
                <span className="text-muted-foreground">Open incidents</span>
                <span className="font-semibold">{summary.counts.openIncidents}</span>
              </Badge>
              <Badge variant="outline" className="gap-1.5">
                <span className="text-muted-foreground">Breaches found</span>
                <span className="font-semibold">{summary.counts.totalBreaches}</span>
              </Badge>
              <Badge variant="outline" className="gap-1.5">
                <span className="text-muted-foreground">Trained</span>
                <span className="font-semibold">
                  {summary.counts.membersTrained} / {summary.counts.totalMembers}
                </span>
              </Badge>
              <Badge variant="outline" className="gap-1.5">
                <span className="text-muted-foreground">MFA on devices</span>
                <span className="font-semibold">
                  {summary.counts.mfaDevices} / {summary.counts.totalDevices}
                </span>
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {MODULES.map((m) => {
          const data = summary.modules[m.key];
          const Icon = m.icon;
          return (
            <Link key={m.key} href={m.href}>
              <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className={`text-2xl font-bold ${scoreColor(data.score)}`}>
                    {data.score}
                  </div>
                </div>
                <div className="font-semibold mb-1">{data.label}</div>
                <div className="text-sm text-muted-foreground mb-2">{data.detail}</div>
                <div className="flex items-center text-sm text-primary font-medium">
                  Open <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <Link href="/security/playbooks">
        <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center">
              <ScrollText className="h-6 w-6 text-destructive" />
            </div>
            <div className="flex-1">
              <div className="font-semibold">Incident Response Playbooks</div>
              <div className="text-sm text-muted-foreground">
                {summary.counts.openIncidents} open · step-by-step runbooks for ransomware, lost devices, phishing, and data leaks
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>
      </Link>
    </AppLayout>
  );
}
