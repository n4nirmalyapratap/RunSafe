import { AppLayout } from "@/components/layout";
import { useGetWorkspace, getGetWorkspaceQueryKey, useUpdateWorkspace } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const settingsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  industry: z.string().optional(),
  state: z.string().optional(),
  employeeCount: z.coerce.number().min(1).optional(),
});

export function Settings() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: workspace, isLoading } = useGetWorkspace({ query: { queryKey: getGetWorkspaceQueryKey() } });
  const updateWorkspace = useUpdateWorkspace();

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { name: "", industry: "", employeeCount: 1 }
  });

  useEffect(() => {
    if (workspace) {
      form.reset({
        name: workspace.name,
        industry: workspace.industry || "",
        state: workspace.state || "",
        employeeCount: workspace.employeeCount || 1,
      });
    }
  }, [workspace, form]);

  if (isLoading) return <AppLayout><Skeleton className="h-64" /></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">Workspace Settings</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Update your workspace details.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((v) => {
                updateWorkspace.mutate(
                  { data: v },
                  { onSuccess: () => { 
                      qc.invalidateQueries({ queryKey: getGetWorkspaceQueryKey() });
                      toast({ title: "Settings updated successfully" });
                    } 
                  }
                );
              })} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="industry" render={({ field }) => (
                    <FormItem><FormLabel>Industry</FormLabel><FormControl><Input placeholder="e.g. Food & Beverage" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="state" render={({ field }) => (
                    <FormItem><FormLabel>State / Province</FormLabel><FormControl><Input placeholder="e.g. CA" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="employeeCount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Employees</FormLabel>
                    <FormControl><Input type="number" min={1} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" disabled={updateWorkspace.isPending}>Save Changes</Button>
              </form>
            </Form>
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
                  {workspace?.plan === 'starter' ? "Delegation OS only. Upgrade to unlock Compliance Autopilot." : "You have access to all features."}
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