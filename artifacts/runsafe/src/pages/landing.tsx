import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ShieldCheck, CheckCircle2, ArrowRight, Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$29",
    period: "/mo",
    description: "Perfect for solo operators getting organized.",
    features: [
      "Delegation OS (SOPs + Tasks)",
      "Up to 5 team members",
      "Unlimited SOPs",
      "Task tracking & progress",
      "Email support",
    ],
    cta: "Start Free Trial",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$79",
    period: "/mo",
    description: "For growing teams that need compliance coverage.",
    features: [
      "Everything in Starter",
      "Compliance Autopilot",
      "Regulatory deadline alerts",
      "Audit trail & history",
      "Up to 20 team members",
      "Priority support",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "$149",
    period: "/mo",
    description: "Full-featured for multi-location businesses.",
    features: [
      "Everything in Growth",
      "Unlimited team members",
      "Multi-location support",
      "Custom compliance templates",
      "Dedicated account manager",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-16 px-6 flex items-center justify-between border-b bg-card">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl text-foreground tracking-tight">RunSafe</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="text-sm font-medium hover:text-primary transition-colors">Sign In</Link>
          <Link href="/sign-up">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-24 px-6 text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground mb-6">
            The calm co-founder you always wished you had.
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Keep your team aligned and the regulators happy without the chaos. 
            RunSafe is your command center for SOPs, task delegation, and compliance tracking.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg" className="w-full sm:w-auto gap-2 text-base h-14 px-8">
                Start Free Trial <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>

        <section className="py-24 bg-card border-y">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Delegation OS</h3>
              <p className="text-muted-foreground">Create SOPs, assign tasks, and track completions in real-time.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Compliance Autopilot</h3>
              <p className="text-muted-foreground">Never miss a deadline. Automated alerts for regulatory requirements.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Audit Trails</h3>
              <p className="text-muted-foreground">A dependable record of who did what, and when. Perfect for inspections.</p>
            </div>
          </div>
        </section>

        <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl font-bold text-center tracking-tight mb-4">Pricing</h2>
            <p className="text-center text-muted-foreground mb-14 text-lg">
              Simple, transparent pricing. No hidden fees.
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-2xl border p-8 flex flex-col ${
                    plan.highlighted
                      ? "bg-primary text-primary-foreground border-primary shadow-xl scale-105"
                      : "bg-card border-border"
                  }`}
                >
                  <div className="mb-6">
                    <div className={`text-sm font-semibold uppercase tracking-widest mb-2 ${plan.highlighted ? "text-primary-foreground/80" : "text-primary"}`}>
                      {plan.name}
                    </div>
                    <div className="flex items-end gap-1 mb-2">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className={`text-base mb-1 ${plan.highlighted ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{plan.period}</span>
                    </div>
                    <p className={`text-sm ${plan.highlighted ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      {plan.description}
                    </p>
                  </div>

                  <ul className="space-y-3 flex-1 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className={`h-4 w-4 mt-0.5 shrink-0 ${plan.highlighted ? "text-primary-foreground" : "text-primary"}`} />
                        <span className={plan.highlighted ? "text-primary-foreground/90" : ""}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href="/sign-up">
                    <Button
                      className="w-full"
                      variant={plan.highlighted ? "secondary" : "default"}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 text-center text-sm text-muted-foreground border-t bg-card">
        &copy; {new Date().getFullYear()} RunSafe Inc. All rights reserved.
      </footer>
    </div>
  );
}
