import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateWorkspace } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const COUNTRIES: { code: string; name: string; states: { code: string; name: string }[] }[] = [
  {
    code: "US",
    name: "United States",
    states: [
      { code: "CA", name: "California" },
      { code: "NY", name: "New York" },
      { code: "TX", name: "Texas" },
      { code: "FL", name: "Florida" },
      { code: "IL", name: "Illinois" },
      { code: "WA", name: "Washington" },
      { code: "OTHER", name: "Other state" },
    ],
  },
  {
    code: "IN",
    name: "India",
    states: [
      { code: "MH", name: "Maharashtra" },
      { code: "KA", name: "Karnataka" },
      { code: "DL", name: "Delhi" },
      { code: "TN", name: "Tamil Nadu" },
      { code: "GJ", name: "Gujarat" },
      { code: "WB", name: "West Bengal" },
      { code: "UP", name: "Uttar Pradesh" },
      { code: "OTHER", name: "Other state" },
    ],
  },
  {
    code: "GB",
    name: "United Kingdom",
    states: [
      { code: "ENG", name: "England" },
      { code: "SCT", name: "Scotland" },
      { code: "WLS", name: "Wales" },
      { code: "NIR", name: "Northern Ireland" },
    ],
  },
  {
    code: "DE",
    name: "Germany",
    states: [
      { code: "BY", name: "Bayern" },
      { code: "BE", name: "Berlin" },
      { code: "NW", name: "Nordrhein-Westfalen" },
      { code: "OTHER", name: "Other Bundesland" },
    ],
  },
  {
    code: "FR",
    name: "France",
    states: [
      { code: "IDF", name: "Île-de-France" },
      { code: "ARA", name: "Auvergne-Rhône-Alpes" },
      { code: "OTHER", name: "Other région" },
    ],
  },
  {
    code: "JP",
    name: "Japan",
    states: [
      { code: "13", name: "Tokyo" },
      { code: "27", name: "Osaka" },
      { code: "OTHER", name: "Other prefecture" },
    ],
  },
  {
    code: "AU",
    name: "Australia",
    states: [
      { code: "NSW", name: "New South Wales" },
      { code: "VIC", name: "Victoria" },
      { code: "QLD", name: "Queensland" },
      { code: "WA", name: "Western Australia" },
      { code: "OTHER", name: "Other state/territory" },
    ],
  },
  { code: "OTHER", name: "Other country", states: [] },
];

const formSchema = z.object({
  name: z.string().min(2, { message: "Workspace name is required." }),
  industry: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  employeeCount: z.coerce.number().min(1, "Must have at least 1 employee").optional(),
});

export function Onboarding() {
  const [, setLocation] = useLocation();
  const createWorkspace = useCreateWorkspace();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      industry: "",
      country: "",
      state: "",
      employeeCount: 1,
    },
  });

  const selectedCountry = form.watch("country");
  const states = COUNTRIES.find((c) => c.code === selectedCountry)?.states ?? [];

  function onSubmit(values: z.infer<typeof formSchema>) {
    createWorkspace.mutate(
      { data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/workspace"] });
          setLocation("/dashboard");
        },
      },
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border rounded-xl p-8 shadow-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-center">Set up your workspace</h1>
          <p className="text-muted-foreground text-center mt-2">
            Tell us where you operate — we'll auto-load the right compliance checklist for you.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Corp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Drives which national compliance items get loaded.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {states.length > 0 && (
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State / Region</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select state / region" />
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
            )}

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
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="restaurant">Restaurant / F&B</SelectItem>
                      <SelectItem value="salon">Salon / Spa</SelectItem>
                      <SelectItem value="services">Professional Services</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
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
            <Button type="submit" className="w-full" disabled={createWorkspace.isPending}>
              {createWorkspace.isPending ? "Creating..." : "Create Workspace"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
