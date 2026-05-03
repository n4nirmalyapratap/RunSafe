import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { useGetSops, getGetSopsQueryKey, useCreateSop } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Plus, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";

const createSopSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.string().optional(),
});

export function Sops() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: sops, isLoading } = useGetSops(undefined, {
    query: { queryKey: getGetSopsQueryKey() }
  });

  const createSop = useCreateSop();

  const form = useForm<z.infer<typeof createSopSchema>>({
    resolver: zodResolver(createSopSchema),
    defaultValues: { title: "", description: "", category: "" }
  });

  const onSubmit = (values: z.infer<typeof createSopSchema>) => {
    createSop.mutate(
      { data: values },
      {
        onSuccess: (newSop) => {
          queryClient.invalidateQueries({ queryKey: getGetSopsQueryKey() });
          setIsCreateOpen(false);
          setLocation(`/sops/${newSop.id}`);
        }
      }
    );
  };

  const filteredSops = sops?.filter(sop => 
    sop.title.toLowerCase().includes(search.toLowerCase()) || 
    sop.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">SOP Library</h1>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Create SOP</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New SOP</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem><FormLabel>Category</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" disabled={createSop.isPending} className="w-full">Create</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search SOPs..." 
            className="pl-9 max-w-md"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : filteredSops?.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No SOPs found</h3>
            <p className="text-sm text-muted-foreground">Create an SOP to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSops?.map((sop) => (
              <Link key={sop.id} href={`/sops/${sop.id}`}>
                <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{sop.title}</CardTitle>
                      {sop.category && (
                        <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full font-medium">
                          {sop.category}
                        </span>
                      )}
                    </div>
                    {sop.description && <CardDescription className="line-clamp-2">{sop.description}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {sop.stepCount} steps
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}