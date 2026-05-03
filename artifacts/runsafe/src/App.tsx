import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getClerkAppearance } from "@/lib/clerk-appearance";
import { LandingPage } from "@/pages/landing";
import NotFound from "@/pages/not-found";

import { useGetWorkspace, getGetWorkspaceQueryKey } from "@workspace/api-client-react";

import { Dashboard } from "@/pages/dashboard";
import { Sops } from "@/pages/sops";
import { SopDetail } from "@/pages/sop-detail";
import { Tasks } from "@/pages/tasks";
import { Compliance } from "@/pages/compliance";
import { Team } from "@/pages/team";
import { Settings } from "@/pages/settings";
import { Onboarding } from "@/pages/onboarding";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');

const appearance = getClerkAppearance(basePath);

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);
  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in"><Redirect to="/dashboard" /></Show>
      <Show when="signed-out"><LandingPage /></Show>
    </>
  );
}

function useWorkspaceRole() {
  const { data: workspace, isLoading, error } = useGetWorkspace({
    query: { retry: false, queryKey: getGetWorkspaceQueryKey() },
  });
  const isOwner = workspace?.userRole === "owner";
  return { workspace, isOwner, isLoading, error };
}

/** Requires sign-in + workspace. Redirects to /onboarding if no workspace. */
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isLoading, error } = useWorkspaceRole();
  const [location] = useLocation();

  return (
    <>
      <Show when="signed-in">
        {isLoading ? (
          <div className="min-h-screen flex items-center justify-center bg-background">Loading…</div>
        ) : error && (error as unknown as { status?: number }).status === 404 && location !== "/onboarding" ? (
          <Redirect to="/onboarding" />
        ) : (
          <Component />
        )}
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

/** Requires sign-in + workspace owner role. Redirects members to /dashboard. */
function OwnerRoute({ component: Component }: { component: React.ComponentType }) {
  const { isOwner, isLoading, error } = useWorkspaceRole();
  const [location] = useLocation();

  return (
    <>
      <Show when="signed-in">
        {isLoading ? (
          <div className="min-h-screen flex items-center justify-center bg-background">Loading…</div>
        ) : error && (error as unknown as { status?: number }).status === 404 && location !== "/onboarding" ? (
          <Redirect to="/onboarding" />
        ) : !isLoading && !isOwner ? (
          <Redirect to="/dashboard" />
        ) : (
          <Component />
        )}
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={appearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />

          <Route path="/onboarding">
            <Show when="signed-in"><Onboarding /></Show>
            <Show when="signed-out"><Redirect to="/" /></Show>
          </Route>

          {/* Member-accessible routes */}
          <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
          <Route path="/tasks"><ProtectedRoute component={Tasks} /></Route>

          {/* Owner-only routes — members redirected to /dashboard */}
          <Route path="/sops"><OwnerRoute component={Sops} /></Route>
          <Route path="/sops/:sopId"><OwnerRoute component={SopDetail} /></Route>
          <Route path="/compliance"><OwnerRoute component={Compliance} /></Route>
          <Route path="/team"><OwnerRoute component={Team} /></Route>
          <Route path="/settings"><OwnerRoute component={Settings} /></Route>

          <Route component={NotFound} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
