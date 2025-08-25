import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle,
  Loader2,
  MapPin,
  Package,
  PlusCircle,
  Truck,
  TruckIcon,
  Edit,
  Settings,
  Info,
  HelpCircle,
  Globe,
  DollarSign,
  Home,
} from "lucide-react";
import ApprovalCheck from "@/components/ui/approval-check";

// Define validation schema for shipping settings
const shippingSettingsSchema = z.object({
  enableCustomShipping: z.boolean().default(false),
  defaultShippingMethodId: z.number().optional(),
  freeShippingThreshold: z.number().optional(),
  processingTime: z.string().optional(),
  shippingPolicy: z.string().optional(),
  returnPolicy: z.string().optional(),
  internationalShipping: z.boolean().default(false),
});

// Define validation schema for product shipping override
const productShippingOverrideSchema = z.object({
  productId: z.number(),
  customPrice: z.number().optional(),
  freeShipping: z.boolean().default(false),
  additionalProcessingDays: z.number().default(0),
  shippingRestrictions: z.string().optional(),
});

export default function SellerShippingPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("general");
  const [isGeneralSettingsDialogOpen, setIsGeneralSettingsDialogOpen] =
    useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isProductOverrideDialogOpen, setIsProductOverrideDialogOpen] =
    useState(false);

  // Fetch seller shipping settings
  const { data: shippingSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["/api/seller/shipping-settings", user?.id],
    queryFn: async () => {
      try {
        const res = await fetch("/api/seller/shipping-settings");
        if (!res.ok) {
          throw new Error("Failed to fetch shipping settings");
        }
        return res.json();
      } catch (error) {
        console.error("Error fetching shipping settings:", error);
        return {
          enableCustomShipping: false,
          defaultShippingMethodId: 1, // Default to standard shipping
          freeShippingThreshold: 0,
          processingTime: "1-2 business days",
          shippingPolicy: "",
          returnPolicy: "",
          internationalShipping: false,
        };
      }
    },
  });

  // Fetch shipping methods
  const { data: shippingMethods, isLoading: isLoadingMethods } = useQuery({
    queryKey: ["/api/shipping/methods"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/shipping/methods");
        if (!res.ok) {
          throw new Error("Failed to fetch shipping methods");
        }
        return res.json();
      } catch (error) {
        console.error("Error fetching shipping methods:", error);
        return [
          {
            id: 1,
            name: "Standard Shipping",
            price: 4000,
            estimatedDays: "3-5 business days",
          },
          {
            id: 2,
            name: "Express Shipping",
            price: 9000,
            estimatedDays: "1-2 business days",
          },
          {
            id: 3,
            name: "Economy Shipping",
            price: 2900,
            estimatedDays: "5-8 business days",
          },
        ];
      }
    },
  });

  // Fetch shipping zones
  const { data: shippingZones, isLoading: isLoadingZones } = useQuery({
    queryKey: ["/api/shipping/zones"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/shipping/zones");
        if (!res.ok) {
          throw new Error("Failed to fetch shipping zones");
        }
        return res.json();
      } catch (error) {
        console.error("Error fetching shipping zones:", error);
        return [
          { id: 1, name: "All India", description: "All regions across India" },
          {
            id: 2,
            name: "North India",
            description: "Northern states of India",
          },
          {
            id: 3,
            name: "South India",
            description: "Southern states of India",
          },
          {
            id: 4,
            name: "Metro Cities",
            description: "Major metropolitan cities",
          },
        ];
      }
    },
  });

  // Fetch seller products
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["/api/seller/products", user?.id],
    queryFn: async () => {
      try {
        const res = await fetch("/api/seller/products");
        if (!res.ok) {
          throw new Error("Failed to fetch products");
        }
        return res.json();
      } catch (error) {
        console.error("Error fetching products:", error);
        return [];
      }
    },
  });

  // Fetch product shipping overrides
  const { data: productOverrides, isLoading: isLoadingOverrides } = useQuery({
    queryKey: ["/api/seller/product-shipping-overrides", user?.id],
    queryFn: async () => {
      try {
        const res = await fetch("/api/seller/product-shipping-overrides");
        if (!res.ok) {
          throw new Error("Failed to fetch product shipping overrides");
        }
        return res.json();
      } catch (error) {
        console.error("Error fetching product shipping overrides:", error);
        return [];
      }
    },
  });

  // Form setup for general shipping settings
  const generalForm = useForm<z.infer<typeof shippingSettingsSchema>>({
    resolver: zodResolver(shippingSettingsSchema),
    defaultValues: {
      enableCustomShipping: shippingSettings?.enableCustomShipping || false,
      defaultShippingMethodId: shippingSettings?.defaultShippingMethodId || 1,
      freeShippingThreshold: shippingSettings?.freeShippingThreshold || 0,
      processingTime: shippingSettings?.processingTime || "1-2 business days",
      shippingPolicy: shippingSettings?.shippingPolicy || "",
      returnPolicy: shippingSettings?.returnPolicy || "",
      internationalShipping: shippingSettings?.internationalShipping || false,
    },
  });

  // Update form values when data is loaded
  useEffect(() => {
    if (shippingSettings) {
      generalForm.reset({
        enableCustomShipping: shippingSettings.enableCustomShipping,
        defaultShippingMethodId: shippingSettings.defaultShippingMethodId,
        freeShippingThreshold: shippingSettings.freeShippingThreshold,
        processingTime: shippingSettings.processingTime,
        shippingPolicy: shippingSettings.shippingPolicy,
        returnPolicy: shippingSettings.returnPolicy,
        internationalShipping: shippingSettings.internationalShipping,
      });
    }
  }, [shippingSettings, generalForm]);

  // Form setup for product shipping override
  const productOverrideForm = useForm<
    z.infer<typeof productShippingOverrideSchema>
  >({
    resolver: zodResolver(productShippingOverrideSchema),
    defaultValues: {
      productId: 0,
      customPrice: 0,
      freeShipping: false,
      additionalProcessingDays: 0,
      shippingRestrictions: "",
    },
  });

  // Update product override form when a product is selected
  useEffect(() => {
    if (selectedProduct) {
      const existingOverride = productOverrides?.find(
        (override: any) => override.productId === selectedProduct.id
      );

      productOverrideForm.reset({
        productId: selectedProduct.id,
        customPrice: existingOverride?.customPrice || 0,
        freeShipping: existingOverride?.freeShipping || false,
        additionalProcessingDays:
          existingOverride?.additionalProcessingDays || 0,
        shippingRestrictions: existingOverride?.shippingRestrictions || "",
      });
    }
  }, [selectedProduct, productOverrides, productOverrideForm]);

  // Mutation for saving general shipping settings
  const saveShippingSettingsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof shippingSettingsSchema>) => {
      const response = await fetch("/api/seller/shipping-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save shipping settings");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/seller/shipping-settings", user?.id],
      });
      toast({
        title: "Settings saved",
        description: "Your shipping settings have been updated successfully.",
      });
      setIsGeneralSettingsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save settings: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for saving product shipping override
  const saveProductOverrideMutation = useMutation({
    mutationFn: async (data: z.infer<typeof productShippingOverrideSchema>) => {
      const response = await fetch("/api/seller/product-shipping-override", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save product shipping override");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/seller/product-shipping-overrides", user?.id],
      });
      toast({
        title: "Override saved",
        description: "Product shipping override has been updated successfully.",
      });
      setIsProductOverrideDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save override: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle general settings form submission
  const onSubmitGeneralSettings = (
    values: z.infer<typeof shippingSettingsSchema>
  ) => {
    saveShippingSettingsMutation.mutate(values);
  };

  // Handle product override form submission
  const onSubmitProductOverride = (
    values: z.infer<typeof productShippingOverrideSchema>
  ) => {
    saveProductOverrideMutation.mutate(values);
  };

  // Format price from paise/cents to rupees/dollars with currency symbol
  const formatPrice = (price: number) => {
    return `₹${(price / 100).toFixed(2)}`;
  };

  // Find product by ID
  const findProduct = (productId: number) => {
    return products?.find((product: any) => product.id === productId);
  };

  // Find shipping method by ID
  const findShippingMethod = (methodId: number) => {
    return shippingMethods?.find((method: any) => method.id === methodId);
  };

  return (
    <SellerDashboardLayout>
      <ApprovalCheck>
        <div className="container mx-auto py-4 md:py-6 px-4 md:px-0">
          <div className="mb-6">
            <h1 className="text-xl md:text-2xl font-bold">
              Shipping Management
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Configure your shipping settings and policies
            </p>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4 md:space-y-6"
          >
            <div className="overflow-x-auto">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 min-w-max">
                <TabsTrigger value="general" className="text-xs md:text-sm">
                  <Truck className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">General Settings</span>
                  <span className="sm:hidden">General</span>
                </TabsTrigger>
                <TabsTrigger value="products" className="text-xs md:text-sm">
                  <Package className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Product Overrides</span>
                  <span className="sm:hidden">Products</span>
                </TabsTrigger>
                <TabsTrigger value="zones" className="text-xs md:text-sm">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Shipping Zones</span>
                  <span className="sm:hidden">Zones</span>
                </TabsTrigger>
                <TabsTrigger value="methods" className="text-xs md:text-sm">
                  <TruckIcon className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Shipping Methods</span>
                  <span className="sm:hidden">Methods</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* General Settings Tab */}
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base md:text-lg">
                    General Shipping Settings
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Configure your default shipping preferences and policies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingSettings ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-4 md:space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              <Truck className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-medium text-sm md:text-base">
                                Default Shipping Method
                              </h3>
                              <p className="text-xs md:text-sm text-muted-foreground">
                                {isLoadingMethods
                                  ? "Loading..."
                                  : findShippingMethod(
                                      shippingSettings?.defaultShippingMethodId ||
                                        1
                                    )?.name || "Standard Shipping"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              <Package className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-medium text-sm md:text-base">
                                Processing Time
                              </h3>
                              <p className="text-xs md:text-sm text-muted-foreground">
                                {shippingSettings?.processingTime ||
                                  "1-2 business days"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-medium text-sm md:text-base">
                                Free Shipping Threshold
                              </h3>
                              <p className="text-xs md:text-sm text-muted-foreground">
                                {shippingSettings?.freeShippingThreshold
                                  ? `Orders above ₹${shippingSettings.freeShippingThreshold}`
                                  : "No free shipping threshold set"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              <Globe className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-medium text-sm md:text-base">
                                International Shipping
                              </h3>
                              <p className="text-xs md:text-sm text-muted-foreground">
                                {shippingSettings?.internationalShipping
                                  ? "Enabled"
                                  : "Disabled"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h3 className="font-medium text-sm md:text-base">
                              Shipping Policy
                            </h3>
                            <div className="mt-2 p-3 bg-muted rounded-md text-xs md:text-sm">
                              {shippingSettings?.shippingPolicy ? (
                                <p>{shippingSettings.shippingPolicy}</p>
                              ) : (
                                <p className="text-muted-foreground italic">
                                  No shipping policy set
                                </p>
                              )}
                            </div>
                          </div>

                          <div>
                            <h3 className="font-medium text-sm md:text-base">
                              Return Policy
                            </h3>
                            <div className="mt-2 p-3 bg-muted rounded-md text-xs md:text-sm">
                              {shippingSettings?.returnPolicy ? (
                                <p>{shippingSettings.returnPolicy}</p>
                              ) : (
                                <p className="text-muted-foreground italic">
                                  No return policy set
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-100 rounded-md p-3 md:p-4 flex items-start gap-3">
                        <Info className="h-4 w-4 md:h-5 md:w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-blue-700 text-sm md:text-base">
                            Shipping Tips
                          </h3>
                          <ul className="mt-2 space-y-1 text-xs md:text-sm text-blue-600 list-disc pl-4">
                            <li>
                              Clear shipping policies help set customer
                              expectations
                            </li>
                            <li>
                              Consider offering free shipping for orders above a
                              threshold to increase average order value
                            </li>
                            <li>
                              Set realistic processing times to avoid customer
                              disappointment
                            </li>
                            <li>
                              Different shipping zones may require different
                              shipping methods
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button
                    onClick={() => setIsGeneralSettingsDialogOpen(true)}
                    className="flex items-center gap-2 text-xs md:text-sm"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Settings
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Product Overrides Tab */}
            <TabsContent value="products">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base md:text-lg">
                    Product Shipping Overrides
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Configure special shipping options for specific products
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingProducts || isLoadingOverrides ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <Button
                          onClick={() => {
                            setSelectedProduct(null);
                            setIsProductOverrideDialogOpen(true);
                          }}
                          className="flex items-center gap-2 text-xs md:text-sm"
                        >
                          <PlusCircle className="h-4 w-4" />
                          Add Override
                        </Button>
                      </div>

                      {productOverrides?.length > 0 ? (
                        <div className="border rounded-md overflow-hidden">
                          {/* Desktop Table */}
                          <div className="hidden md:block">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-sm">
                                    Product
                                  </TableHead>
                                  <TableHead className="text-sm">
                                    Custom Price
                                  </TableHead>
                                  <TableHead className="text-sm">
                                    Free Shipping
                                  </TableHead>
                                  <TableHead className="text-sm">
                                    Additional Days
                                  </TableHead>
                                  <TableHead className="text-sm">
                                    Actions
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {productOverrides.map((override: any) => {
                                  const product = findProduct(
                                    override.productId
                                  );
                                  return (
                                    <TableRow key={override.id}>
                                      <TableCell className="font-medium text-sm">
                                        {product
                                          ? product.name
                                          : `Product #${override.productId}`}
                                      </TableCell>
                                      <TableCell className="text-sm">
                                        {override.customPrice
                                          ? formatPrice(override.customPrice)
                                          : "Default"}
                                      </TableCell>
                                      <TableCell className="text-sm">
                                        {override.freeShipping ? (
                                          <span className="flex items-center text-green-600">
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                            Yes
                                          </span>
                                        ) : (
                                          "No"
                                        )}
                                      </TableCell>
                                      <TableCell className="text-sm">
                                        {override.additionalProcessingDays > 0
                                          ? `+${override.additionalProcessingDays} days`
                                          : "None"}
                                      </TableCell>
                                      <TableCell>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setSelectedProduct(product);
                                            setIsProductOverrideDialogOpen(
                                              true
                                            );
                                          }}
                                        >
                                          <Edit className="h-4 w-4" />
                                          <span className="sr-only">Edit</span>
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>

                          {/* Mobile Cards */}
                          <div className="md:hidden space-y-3 p-4">
                            {productOverrides.map((override: any) => {
                              const product = findProduct(override.productId);
                              return (
                                <div
                                  key={override.id}
                                  className="border rounded-lg p-4 space-y-3"
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <h3 className="font-medium text-sm">
                                        {product
                                          ? product.name
                                          : `Product #${override.productId}`}
                                      </h3>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedProduct(product);
                                        setIsProductOverrideDialogOpen(true);
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div>
                                      <span className="text-muted-foreground">
                                        Custom Price:
                                      </span>
                                      <p className="font-medium">
                                        {override.customPrice
                                          ? formatPrice(override.customPrice)
                                          : "Default"}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">
                                        Free Shipping:
                                      </span>
                                      <p className="font-medium">
                                        {override.freeShipping ? (
                                          <span className="flex items-center text-green-600">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Yes
                                          </span>
                                        ) : (
                                          "No"
                                        )}
                                      </p>
                                    </div>
                                    <div className="col-span-2">
                                      <span className="text-muted-foreground">
                                        Additional Days:
                                      </span>
                                      <p className="font-medium">
                                        {override.additionalProcessingDays > 0
                                          ? `+${override.additionalProcessingDays} days`
                                          : "None"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 border rounded-md bg-muted/40">
                          <Package className="h-8 w-8 mx-auto text-muted-foreground" />
                          <h3 className="mt-4 font-medium text-sm md:text-base">
                            No Product Overrides
                          </h3>
                          <p className="text-xs md:text-sm text-muted-foreground mt-1">
                            Create custom shipping rules for specific products
                            to offer different rates or processing times.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Shipping Methods Tab */}
            <TabsContent value="methods">
              <Card>
                <CardHeader>
                  <CardTitle>Available Shipping Methods</CardTitle>
                  <CardDescription>
                    Shipping options available for your customers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingMethods ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {shippingMethods?.map((method: any) => (
                          <Card
                            key={method.id}
                            className="border border-gray-200 shadow-sm"
                          >
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base flex items-center gap-2">
                                <TruckIcon className="h-5 w-5 text-primary" />
                                {method.name}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2 pb-3">
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Base Price:
                                  </span>
                                  <span className="font-medium">
                                    {formatPrice(method.price)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Estimated Delivery:
                                  </span>
                                  <span>{method.estimatedDays}</span>
                                </div>
                                {method.description && (
                                  <p className="text-muted-foreground italic mt-2">
                                    {method.description}
                                  </p>
                                )}
                              </div>
                            </CardContent>
                            <CardFooter className="border-t bg-muted/40 py-2">
                              <div className="w-full flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">
                                  {method.isActive !== false
                                    ? "Active"
                                    : "Inactive"}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2"
                                >
                                  Details
                                </Button>
                              </div>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>

                      <div className="bg-green-50 border border-green-100 rounded-md p-4 flex items-start gap-3">
                        <Info className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-green-700">
                            About Shipping Methods
                          </h3>
                          <p className="mt-1 text-sm text-green-600">
                            These shipping methods are available platform-wide.
                            You can set your default shipping method in the
                            general settings. The actual shipping cost for
                            customers may vary based on shipping zones and your
                            product-specific overrides.
                          </p>
                          <p className="mt-2 text-sm text-green-600">
                            Need a custom shipping method for your store?
                            Contact our support team.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Shipping Zones Tab */}
            <TabsContent value="zones">
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Zones</CardTitle>
                  <CardDescription>
                    Geographic areas where different shipping rules may apply
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingZones ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {shippingZones?.map((zone: any) => (
                          <Card
                            key={zone.id}
                            className="border border-gray-200 shadow-sm"
                          >
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-primary" />
                                {zone.name}
                              </CardTitle>
                              {zone.description && (
                                <CardDescription>
                                  {zone.description}
                                </CardDescription>
                              )}
                            </CardHeader>
                            <CardContent className="pt-2 pb-3">
                              <div className="space-y-3 text-sm">
                                {zone.countries && (
                                  <div>
                                    <span className="font-medium">
                                      Countries:
                                    </span>
                                    <span className="ml-2">
                                      {zone.countries}
                                    </span>
                                  </div>
                                )}
                                {zone.states && (
                                  <div>
                                    <span className="font-medium">States:</span>
                                    <span className="ml-2">{zone.states}</span>
                                  </div>
                                )}
                                {zone.cities && (
                                  <div>
                                    <span className="font-medium">Cities:</span>
                                    <span className="ml-2">{zone.cities}</span>
                                  </div>
                                )}
                                {zone.zipCodes && (
                                  <div>
                                    <span className="font-medium">
                                      ZIP Codes:
                                    </span>
                                    <span className="ml-2">
                                      {zone.zipCodes}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                            <CardFooter className="border-t bg-muted/40 py-2">
                              <div className="w-full flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">
                                  {zone.isActive !== false
                                    ? "Active"
                                    : "Inactive"}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2"
                                >
                                  Details
                                </Button>
                              </div>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>

                      <div className="bg-purple-50 border border-purple-100 rounded-md p-4 flex items-start gap-3">
                        <Home className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-purple-700">
                            About Shipping Zones
                          </h3>
                          <p className="mt-1 text-sm text-purple-600">
                            Shipping zones allow for different shipping rates
                            and methods depending on the delivery location. The
                            platform has pre-configured these zones based on
                            common shipping regions in India.
                          </p>
                          <p className="mt-2 text-sm text-purple-600">
                            Note that shipping costs and delivery estimates may
                            vary by zone. You can view the exact shipping costs
                            for each zone and method in the shipping settings.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* General Settings Dialog */}
        <Dialog
          open={isGeneralSettingsDialogOpen}
          onOpenChange={setIsGeneralSettingsDialogOpen}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Shipping Settings</DialogTitle>
              <DialogDescription>
                Configure your general shipping preferences and policies
              </DialogDescription>
            </DialogHeader>

            <Form {...generalForm}>
              <form
                onSubmit={generalForm.handleSubmit(onSubmitGeneralSettings)}
                className="space-y-4"
              >
                <FormField
                  control={generalForm.control}
                  name="enableCustomShipping"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Custom Shipping</FormLabel>
                        <FormDescription>
                          Enable custom shipping rules for your products
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={generalForm.control}
                  name="defaultShippingMethodId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Shipping Method</FormLabel>
                      <Select
                        value={field.value?.toString()}
                        onValueChange={(value) =>
                          field.onChange(parseInt(value))
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a shipping method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {shippingMethods?.map((method: any) => (
                            <SelectItem
                              key={method.id}
                              value={method.id.toString()}
                            >
                              {method.name} ({formatPrice(method.price)},{" "}
                              {method.estimatedDays})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        This will be the default shipping method for all your
                        products
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={generalForm.control}
                  name="freeShippingThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Free Shipping Threshold (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? 0
                                : parseInt(e.target.value)
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Orders above this amount will qualify for free shipping
                        (0 = no free shipping)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={generalForm.control}
                  name="processingTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Processing Time</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., 1-2 business days"
                        />
                      </FormControl>
                      <FormDescription>
                        The time needed to prepare and ship orders
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={generalForm.control}
                  name="shippingPolicy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shipping Policy</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe your shipping policy here..."
                          rows={3}
                        />
                      </FormControl>
                      <FormDescription>
                        Clear shipping policies help set customer expectations
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={generalForm.control}
                  name="returnPolicy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Return Policy</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe your return policy here..."
                          rows={3}
                        />
                      </FormControl>
                      <FormDescription>
                        Clear return policies build customer trust
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={generalForm.control}
                  name="internationalShipping"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>International Shipping</FormLabel>
                        <FormDescription>
                          Enable shipping to international addresses
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsGeneralSettingsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saveShippingSettingsMutation.isPending}
                  >
                    {saveShippingSettingsMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Settings
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Product Override Dialog */}
        <Dialog
          open={isProductOverrideDialogOpen}
          onOpenChange={setIsProductOverrideDialogOpen}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Product Shipping Override</DialogTitle>
              <DialogDescription>
                Set special shipping options for a specific product
              </DialogDescription>
            </DialogHeader>

            <Form {...productOverrideForm}>
              <form
                onSubmit={productOverrideForm.handleSubmit(
                  onSubmitProductOverride
                )}
                className="space-y-4"
              >
                <FormField
                  control={productOverrideForm.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product</FormLabel>
                      <Select
                        value={field.value?.toString()}
                        onValueChange={(value) => {
                          field.onChange(parseInt(value));
                          setSelectedProduct(findProduct(parseInt(value)));
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a product" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products?.map((product: any) => (
                            <SelectItem
                              key={product.id}
                              value={product.id.toString()}
                            >
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose the product you want to set special shipping
                        options for
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={productOverrideForm.control}
                  name="customPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Custom Shipping Price (₹, in paise/cents)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? 0
                                : parseInt(e.target.value)
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Override the default shipping price for this product (0
                        = use default price)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={productOverrideForm.control}
                  name="freeShipping"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Free Shipping</FormLabel>
                        <FormDescription>
                          Offer free shipping for this product regardless of
                          order value
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={productOverrideForm.control}
                  name="additionalProcessingDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Processing Days</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? 0
                                : parseInt(e.target.value)
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Extra days needed to process this product (0 = no extra
                        days)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={productOverrideForm.control}
                  name="shippingRestrictions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shipping Restrictions</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="E.g., 'Not available in North East India' or 'Metro cities only'"
                          rows={2}
                        />
                      </FormControl>
                      <FormDescription>
                        Any shipping restrictions or special notes for this
                        product
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsProductOverrideDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saveProductOverrideMutation.isPending}
                  >
                    {saveProductOverrideMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Override
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </ApprovalCheck>
    </SellerDashboardLayout>
  );
}
