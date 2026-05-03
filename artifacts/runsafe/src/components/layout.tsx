import { Link, useLocation } from "wouter";
import { User, FileText, CheckSquare, ShieldCheck, Users, Settings, LogOut, Menu } from "lucide-react";
import { useClerk, useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Sidebar({ mobile = false, close = () => {} }: { mobile?: boolean; close?: () => void }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  
  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: User },
    { href: "/sops", label: "SOPs", icon: FileText },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/compliance", label: "Compliance", icon: ShieldCheck },
    { href: "/team", label: "Team", icon: Users },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const handleSignOut = () => {
    signOut(() => { window.location.href = import.meta.env.BASE_URL; });
  };

  const navContent = (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border w-64 text-sidebar-foreground">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border gap-3">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <span className="font-bold text-lg tracking-tight">RunSafe</span>
      </div>
      <div className="flex-1 py-6 px-4 flex flex-col gap-2 overflow-y-auto">
        <div className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2 px-2">Menu</div>
        {navItems.map((item) => {
          const isActive = location === item.href || location.startsWith(`${item.href}/`);
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                  : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
              onClick={() => { if (mobile) close(); }}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="p-4 border-t border-sidebar-border">
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground" onClick={handleSignOut}>
          <LogOut className="h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  if (mobile) return navContent;
  return <div className="hidden md:block h-screen sticky top-0">{navContent}</div>;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
          <div className="md:hidden flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 border-none">
                <Sidebar mobile close={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))} />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span className="font-bold">RunSafe</span>
            </div>
          </div>
          <div className="hidden md:block text-sm font-medium text-muted-foreground">
            Welcome back, {user?.firstName || 'Owner'}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}