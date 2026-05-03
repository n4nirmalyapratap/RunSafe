import { AppLayout } from "@/components/layout";
import { useGetTeamMembers, getGetTeamMembersQueryKey, getGetDashboardSummaryQueryKey, useInviteTeamMember, useRemoveTeamMember } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const inviteSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  role: z.enum(["owner", "employee"]).default("employee")
});

export function Team() {
  const qc = useQueryClient();
  const { data: team, isLoading } = useGetTeamMembers({ query: { queryKey: getGetTeamMembersQueryKey() } });
  const inviteMember = useInviteTeamMember();
  const removeMember = useRemoveTeamMember();
  const [inviteOpen, setInviteOpen] = useState(false);

  const form = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { name: "", email: "", role: "employee" }
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild><Button><UserPlus className="h-4 w-4 mr-2" /> Invite Member</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Invite Team Member</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((v) => {
                  inviteMember.mutate(
                    { data: v },
                    {
                      onSuccess: () => {
                        qc.invalidateQueries({ queryKey: getGetTeamMembersQueryKey() });
                        // Team count is shown on the dashboard summary card.
                        qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
                        setInviteOpen(false);
                        form.reset();
                      },
                    },
                  );
                })} className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="role" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="owner">Owner</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" disabled={inviteMember.isPending} className="w-full">Send Invite</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="border rounded-lg bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="py-8"><Skeleton className="h-8" /></TableCell></TableRow>
              ) : team?.map(member => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell className="text-muted-foreground">{member.email}</TableCell>
                  <TableCell className="capitalize">{member.role}</TableCell>
                  <TableCell>
                    <Badge variant={member.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                      {member.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => {
                      if (confirm("Are you sure you want to remove this member?")) {
                        removeMember.mutate(
                          { memberId: member.id },
                          {
                            onSuccess: () => {
                              qc.invalidateQueries({ queryKey: getGetTeamMembersQueryKey() });
                              // Removing a member shrinks the team count card.
                              qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
                            },
                          },
                        );
                      }
                    }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}