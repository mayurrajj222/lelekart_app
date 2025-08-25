import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import AdminLayout from "@/components/layout/admin-layout";

// Schema for product display settings form
const displaySettingsSchema = z.object({
  displayType: z.enum([
    "recent",
    "vendor",
    "category",
    "price_asc",
    "price_desc",
    "rotation_vendor",
    "rotation_category",
  ]),
  isActive: z.boolean().default(true),
  config: z.record(z.any()).default({}),
});

type DisplaySettingsFormValues = z.infer<typeof displaySettingsSchema>;

export default function ProductDisplaySettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [preferredVendorIds, setPreferredVendorIds] = useState<string[]>([]);
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);

  // Fetch product display settings
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["/api/product-display-settings"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/product-display-settings");
        return await res.json();
      } catch (error) {
        // If settings don't exist yet, return null
        return null;
      }
    },
  });

  // Fetch vendors and categories for the select dropdowns
  const { data: vendors = [] } = useQuery({
    queryKey: ["/api/sellers/approved"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/sellers/approved");
      return await res.json();
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/categories");
      return await res.json();
    },
  });

  // Form setup
  const form = useForm<DisplaySettingsFormValues>({
    resolver: zodResolver(displaySettingsSchema),
    defaultValues: {
      displayType: "recent",
      isActive: true,
      config: {},
    },
  });

  // Initialize form with existing settings when data is loaded
  useEffect(() => {
    if (settings) {
      form.reset({
        displayType: settings.displayType,
        isActive: settings.isActive,
        config: settings.config,
      });

      // Set vendor and category selections
      if (settings.config.preferredVendorIds) {
        setPreferredVendorIds(settings.config.preferredVendorIds.map(String));
      }

      if (settings.config.preferredCategories) {
        setPreferredCategories(settings.config.preferredCategories);
      }
    }
  }, [settings, form]);

  const vendorOptions = vendors.map((vendor: any) => ({
    label: vendor.username,
    value: String(vendor.id),
  }));

  const categoryOptions = categories.map((category: any) => ({
    label: category.name,
    value: category.name,
  }));

  // Watch displayType to conditionally show configuration options
  const displayType = form.watch("displayType");

  // Create/update mutation
  const mutation = useMutation({
    mutationFn: async (values: DisplaySettingsFormValues) => {
      // Prepare the config object based on display type
      let config = {};

      if (values.displayType === "vendor") {
        config = {
          ...values.config,
          preferredVendorIds: preferredVendorIds.map(Number),
        };
      } else if (values.displayType === "category") {
        config = {
          ...values.config,
          preferredCategories,
        };
      }

      const data = {
        ...values,
        config,
      };

      // If settings exist, update them
      if (settings?.id) {
        const res = await apiRequest(
          "PUT",
          `/api/admin/product-display-settings/${settings.id}`,
          data
        );
        return await res.json();
      }

      // Otherwise create new settings
      const res = await apiRequest(
        "POST",
        "/api/admin/product-display-settings",
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product display settings have been saved",
        variant: "default",
      });
      // Invalidate the query to refetch the settings
      queryClient.invalidateQueries({
        queryKey: ["/api/product-display-settings"],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to save settings: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: DisplaySettingsFormValues) => {
    mutation.mutate(values);
  };

  const displayTypeLabels: Record<string, string> = {
    recent: "Most Recent Products First (Default)",
    vendor: "Preferred Vendors First",
    category: "Preferred Categories First",
    price_asc: "Lowest Price First",
    price_desc: "Highest Price First",
    rotation_vendor: "Rotation by Vendor",
    rotation_category: "Rotation by Category",
  };

  return (
    <AdminLayout>
      <div className="container px-2 sm:px-4 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Product Display Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure how products are displayed in the All Products tab
            </p>
          </div>
        </div>

        {isLoadingSettings ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card className="w-full max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle>Display Configuration</CardTitle>
              <CardDescription>
                Choose how products should be displayed on the all products page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="displayType"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Display Order</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            {Object.entries(displayTypeLabels).map(
                              ([value, label]) => (
                                <div
                                  key={value}
                                  className="flex items-center space-x-2"
                                >
                                  <RadioGroupItem value={value} id={value} />
                                  <Label htmlFor={value}>{label}</Label>
                                </div>
                              )
                            )}
                          </RadioGroup>
                        </FormControl>
                        <FormDescription>
                          Select how products should be ordered on the All
                          Products page
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {displayType === "vendor" && (
                    <div className="space-y-3">
                      <FormLabel>Preferred Vendors</FormLabel>
                      <MultiSelect
                        options={vendorOptions}
                        selected={preferredVendorIds}
                        onChange={setPreferredVendorIds}
                        placeholder="Select preferred vendors"
                        className="w-full"
                      />
                      <FormDescription>
                        Products from these vendors will be shown first, in the
                        order selected
                      </FormDescription>
                    </div>
                  )}

                  {displayType === "category" && (
                    <div className="space-y-3">
                      <FormLabel>Preferred Categories</FormLabel>
                      <MultiSelect
                        options={categoryOptions}
                        selected={preferredCategories}
                        onChange={setPreferredCategories}
                        placeholder="Select preferred categories"
                        className="w-full"
                      />
                      <FormDescription>
                        Products from these categories will be shown first, in
                        the order selected
                      </FormDescription>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Active</FormLabel>
                          <FormDescription>
                            Toggle to activate or deactivate these display
                            settings
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <Button
                      type="submit"
                      disabled={mutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      {mutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Settings
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-between border-t px-6 py-4">
              <p className="text-sm text-muted-foreground">
                {settings
                  ? "Last updated: " +
                    new Date(settings.updatedAt).toLocaleString()
                  : "No settings saved yet"}
              </p>
              {settings?.isActive && (
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Active
                </div>
              )}
            </CardFooter>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
