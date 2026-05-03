import { AppLayout } from "@/components/layout";
import {
  useGetWorkspace,
  getGetWorkspaceQueryKey,
  useUpdateWorkspace,
  useGetComplianceMeta,
  getGetComplianceMetaQueryKey,
  useSyncComplianceFromCatalog,
  getGetComplianceItemsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";

const settingsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  industry: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  employeeCount: z.coerce.number().min(1).optional(),
});

export function Settings() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: workspace, isLoading } = useGetWorkspace({ query: { queryKey: getGetWorkspaceQueryKey() } });
  const { data: meta } = useGetComplianceMeta({ query: { queryKey: getGetComplianceMetaQueryKey() } });
  const updateWorkspace = useUpdateWorkspace();
  const syncCompliance = useSyncComplianceFromCatalog();

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { name: "", industry: "", country: "", state: "", employeeCount: 1 },
  });

  useEffect(() => {
    if (workspace) {
      form.reset({
        name: workspace.name,
        industry: workspace.industry || "",
        country: workspace.country || "",
        state: workspace.state || "",
        employeeCount: workspace.employeeCount || 1,
      });
    }
  }, [workspace, form]);

  const selectedCountry = form.watch("country");
  const states = meta?.countries.find((c) => c.code === selectedCountry)?.states ?? [];

  if (isLoading) return <AppLayout><Skeleton className="h-64" /></AppLayout>;

  const handleSync = () => {
    syncCompliance.mutate(undefined, {
      onSuccess: (data) => {
        qc.invalidateQueries({ queryKey: getGetComplianceItemsQueryKey() });
        toast({
          title: "Compliance checklist synced",
          description: `${data.added} new item${data.added === 1 ? "" : "s"} added · ${data.skipped} already present.`,
        });
      },
      onError: (err) => {
        toast({
          title: "Sync failed",
          description: err instanceof Error ? err.message : "Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">Workspace Settings</h1>

        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>
              Your country, state, and industry drive which compliance items are auto-loaded.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((v) => {
                  updateWorkspace.mutate(
                    { data: v },
                    {
                      onSuccess: () => {
                        qc.invalidateQueries({ queryKey: getGetWorkspaceQueryKey() });
                        toast({ title: "Settings updated successfully" });
                      },
                    },
                  );
                })}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <Select
                          onValueChange={(val) => {
                            field.onChange(val);
                            form.setValue("state", "");
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(meta?.countries ?? []).map((c) => (
                              <SelectItem key={c.code} value={c.code}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State / Region</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={states.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={states.length === 0 ? "—" : "Select state"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {states.map((s) => (
                              <SelectItem key={s.code} value={s.code}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(meta?.industries ?? []).map((i) => (
                            <SelectItem key={i.code} value={i.code}>
                              {i.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="employeeCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Employees</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={updateWorkspace.isPending}>
                  Save Changes
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance Checklist Sync</CardTitle>
            <CardDescription>
              Pull the latest catalog items for your country, state, and industry. Existing items
              and their completion history are preserved — only missing items are added.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={handleSync}
              disabled={syncCompliance.isPending || workspace?.plan === "starter"}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncCompliance.isPending ? "animate-spin" : ""}`} />
              {syncCompliance.isPending ? "Syncing..." : "Sync compliance checklist"}
            </Button>
            {workspace?.plan === "starter" && (
              <FormDescription className="mt-2">
                Upgrade to Growth or Pro to use Compliance Autopilot.
              </FormDescription>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-md">
              <div>
                <div className="font-semibold flex items-center gap-2">
                  Current Plan: <Badge className="uppercase">{workspace?.plan}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {workspace?.plan === "starter"
                    ? "Delegation OS only. Upgrade to unlock Compliance Autopilot."
                    : "You have access to all features."}
                </p>
              </div>
              <Button variant="outline">Upgrade Plan</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
