import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
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
  PlusCircle,
  Trash2,
  Edit,
  MapPin,
  Globe,
  Settings,
  Truck,
  Info,
  AlertCircle,
  TruckIcon,
  CheckCircle,
  Package,
  DollarSign,
  Loader2,
} from "lucide-react";

// Define validation schema for shipping method
const shippingMethodSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  description: z.string().optional(),
  price: z.coerce
    .number()
    .min(0, { message: "Price must be a positive number" }),
  estimatedDays: z.string().min(1, { message: "Estimated days is required" }),
  isActive: z.boolean().default(true),
  icon: z.string().optional(),
  priority: z.coerce.number().default(0),
});

// Define validation schema for shipping zone
const shippingZoneSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  description: z.string().optional(),
  regions: z.string().min(1, { message: "Regions list is required" }),
  isActive: z.boolean().default(true),
});

// Define validation schema for shipping rule
const shippingRuleSchema = z.object({
  methodId: z.coerce
    .number()
    .min(1, { message: "Shipping method is required" }),
  zoneId: z.coerce.number().min(1, { message: "Shipping zone is required" }),
  price: z.coerce
    .number()
    .min(0, { message: "Price must be a positive number" }),
  minOrderValue: z.coerce.number().default(0),
  maxOrderValue: z.coerce.number().optional(),
  minWeight: z.coerce.number().default(0),
  maxWeight: z.coerce.number().optional(),
  additionalDays: z.coerce.number().default(0),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

export default function AdminShippingManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("methods");

  // Dialog states
  const [isMethodDialogOpen, setIsMethodDialogOpen] = useState(false);
  const [isZoneDialogOpen, setIsZoneDialogOpen] = useState(false);
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);

  // Selected item states for editing
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [selectedRule, setSelectedRule] = useState<any>(null);

  // Delete confirmation dialog states
  const [isMethodDeleteDialogOpen, setIsMethodDeleteDialogOpen] =
    useState(false);
  const [isZoneDeleteDialogOpen, setIsZoneDeleteDialogOpen] = useState(false);
  const [isRuleDeleteDialogOpen, setIsRuleDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  // Fetch shipping methods
  const {
    data: shippingMethods,
    isLoading: isLoadingMethods,
    isError: isErrorMethods,
  } = useQuery({
    queryKey: ["/api/shipping/methods"],
    queryFn: async () => {
      const res = await fetch("/api/shipping/methods");
      if (!res.ok) {
        throw new Error("Failed to fetch shipping methods");
      }
      return res.json();
    },
  });

  // Fetch shipping zones
  const {
    data: shippingZones,
    isLoading: isLoadingZones,
    isError: isErrorZones,
  } = useQuery({
    queryKey: ["/api/shipping/zones"],
    queryFn: async () => {
      const res = await fetch("/api/shipping/zones");
      if (!res.ok) {
        throw new Error("Failed to fetch shipping zones");
      }
      return res.json();
    },
  });

  // Fetch shipping rules
  const {
    data: shippingRules,
    isLoading: isLoadingRules,
    isError: isErrorRules,
  } = useQuery({
    queryKey: ["/api/shipping/rules"],
    queryFn: async () => {
      const res = await fetch("/api/shipping/rules");
      if (!res.ok) {
        throw new Error("Failed to fetch shipping rules");
      }
      return res.json();
    },
  });

  // Form setup for shipping method
  const methodForm = useForm<z.infer<typeof shippingMethodSchema>>({
    resolver: zodResolver(shippingMethodSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      estimatedDays: "",
      isActive: true,
      icon: "",
      priority: 0,
    },
  });

  // Form setup for shipping zone
  const zoneForm = useForm<z.infer<typeof shippingZoneSchema>>({
    resolver: zodResolver(shippingZoneSchema),
    defaultValues: {
      name: "",
      description: "",
      regions: "",
      isActive: true,
    },
  });

  // Form setup for shipping rule
  const ruleForm = useForm<z.infer<typeof shippingRuleSchema>>({
    resolver: zodResolver(shippingRuleSchema),
    defaultValues: {
      methodId: 0,
      zoneId: 0,
      price: 0,
      minOrderValue: 0,
      maxOrderValue: undefined,
      minWeight: 0,
      maxWeight: undefined,
      additionalDays: 0,
      notes: "",
      isActive: true,
    },
  });

  // Reset method form when selected method changes
  const resetMethodForm = (method: any = null) => {
    methodForm.reset(
      method
        ? {
            name: method.name,
            description: method.description || "",
            price: method.price,
            estimatedDays: method.estimatedDays,
            isActive: method.isActive,
            icon: method.icon || "",
            priority: method.priority || 0,
          }
        : {
            name: "",
            description: "",
            price: 0,
            estimatedDays: "",
            isActive: true,
            icon: "",
            priority: 0,
          }
    );
  };

  // Reset zone form when selected zone changes
  const resetZoneForm = (zone: any = null) => {
    zoneForm.reset(
      zone
        ? {
            name: zone.name,
            description: zone.description || "",
            regions: zone.regions,
            isActive: zone.isActive,
          }
        : {
            name: "",
            description: "",
            regions: "",
            isActive: true,
          }
    );
  };

  // Reset rule form when selected rule changes
  const resetRuleForm = (rule: any = null) => {
    ruleForm.reset(
      rule
        ? {
            methodId: rule.methodId,
            zoneId: rule.zoneId,
            price: rule.price,
            minOrderValue: rule.minOrderValue || 0,
            maxOrderValue: rule.maxOrderValue || undefined,
            minWeight: rule.minWeight || 0,
            maxWeight: rule.maxWeight || undefined,
            additionalDays: rule.additionalDays || 0,
            notes: rule.notes || "",
            isActive: rule.isActive,
          }
        : {
            methodId: 0,
            zoneId: 0,
            price: 0,
            minOrderValue: 0,
            maxOrderValue: undefined,
            minWeight: 0,
            maxWeight: undefined,
            additionalDays: 0,
            notes: "",
            isActive: true,
          }
    );
  };

  // Mutation for creating/updating shipping method
  const shippingMethodMutation = useMutation({
    mutationFn: async (data: z.infer<typeof shippingMethodSchema>) => {
      const url = selectedMethod
        ? `/api/shipping/methods/${selectedMethod.id}`
        : "/api/shipping/methods";
      const method = selectedMethod ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error(
          `Failed to ${selectedMethod ? "update" : "create"} shipping method`
        );
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shipping/methods"] });
      toast({
        title: `Shipping method ${selectedMethod ? "updated" : "created"}`,
        description: `Shipping method has been successfully ${selectedMethod ? "updated" : "created"}.`,
      });
      setIsMethodDialogOpen(false);
      setSelectedMethod(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for creating/updating shipping zone
  const shippingZoneMutation = useMutation({
    mutationFn: async (data: z.infer<typeof shippingZoneSchema>) => {
      const url = selectedZone
        ? `/api/shipping/zones/${selectedZone.id}`
        : "/api/shipping/zones";
      const method = selectedZone ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error(
          `Failed to ${selectedZone ? "update" : "create"} shipping zone`
        );
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shipping/zones"] });
      toast({
        title: `Shipping zone ${selectedZone ? "updated" : "created"}`,
        description: `Shipping zone has been successfully ${selectedZone ? "updated" : "created"}.`,
      });
      setIsZoneDialogOpen(false);
      setSelectedZone(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for creating/updating shipping rule
  const shippingRuleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof shippingRuleSchema>) => {
      const url = selectedRule
        ? `/api/shipping/rules/${selectedRule.id}`
        : "/api/shipping/rules";
      const method = selectedRule ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error(
          `Failed to ${selectedRule ? "update" : "create"} shipping rule`
        );
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shipping/rules"] });
      toast({
        title: `Shipping rule ${selectedRule ? "updated" : "created"}`,
        description: `Shipping rule has been successfully ${selectedRule ? "updated" : "created"}.`,
      });
      setIsRuleDialogOpen(false);
      setSelectedRule(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting shipping method
  const deleteMethodMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/shipping/methods/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete shipping method");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shipping/methods"] });
      toast({
        title: "Shipping method deleted",
        description: "Shipping method has been successfully deleted.",
      });
      setIsMethodDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsMethodDeleteDialogOpen(false);
    },
  });

  // Mutation for deleting shipping zone
  const deleteZoneMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/shipping/zones/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete shipping zone");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shipping/zones"] });
      toast({
        title: "Shipping zone deleted",
        description: "Shipping zone has been successfully deleted.",
      });
      setIsZoneDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsZoneDeleteDialogOpen(false);
    },
  });

  // Mutation for deleting shipping rule
  const deleteRuleMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/shipping/rules/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete shipping rule");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shipping/rules"] });
      toast({
        title: "Shipping rule deleted",
        description: "Shipping rule has been successfully deleted.",
      });
      setIsRuleDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsRuleDeleteDialogOpen(false);
    },
  });

  // Handle form submissions
  const onSubmitMethod = (values: z.infer<typeof shippingMethodSchema>) => {
    shippingMethodMutation.mutate(values);
  };

  const onSubmitZone = (values: z.infer<typeof shippingZoneSchema>) => {
    shippingZoneMutation.mutate(values);
  };

  const onSubmitRule = (values: z.infer<typeof shippingRuleSchema>) => {
    shippingRuleMutation.mutate(values);
  };

  // Format price from paise/cents to rupees/dollars with currency symbol
  const formatPrice = (price: number) => {
    return `₹${(price / 100).toFixed(2)}`;
  };

  // Handle opening method dialog for create/edit
  const handleOpenMethodDialog = (method: any = null) => {
    setSelectedMethod(method);
    resetMethodForm(method);
    setIsMethodDialogOpen(true);
  };

  // Handle opening zone dialog for create/edit
  const handleOpenZoneDialog = (zone: any = null) => {
    setSelectedZone(zone);
    resetZoneForm(zone);
    setIsZoneDialogOpen(true);
  };

  // Handle opening rule dialog for create/edit
  const handleOpenRuleDialog = (rule: any = null) => {
    setSelectedRule(rule);
    resetRuleForm(rule);
    setIsRuleDialogOpen(true);
  };

  // Handle opening delete confirmation dialogs
  const handleOpenDeleteMethodDialog = (id: number) => {
    setItemToDelete(id);
    setIsMethodDeleteDialogOpen(true);
  };

  const handleOpenDeleteZoneDialog = (id: number) => {
    setItemToDelete(id);
    setIsZoneDeleteDialogOpen(true);
  };

  const handleOpenDeleteRuleDialog = (id: number) => {
    setItemToDelete(id);
    setIsRuleDeleteDialogOpen(true);
  };

  // Find shipping method name by ID
  const getMethodName = (id: number) => {
    const method = shippingMethods?.find((m: any) => m.id === id);
    return method ? method.name : `Method #${id}`;
  };

  // Find shipping zone name by ID
  const getZoneName = (id: number) => {
    const zone = shippingZones?.find((z: any) => z.id === id);
    return zone ? zone.name : `Zone #${id}`;
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Shipping Management</h1>
            <p className="text-muted-foreground">
              Configure shipping methods, zones, and rules for the marketplace
            </p>
          </div>
        </div>

        <Tabs
          defaultValue="methods"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="methods">Methods</TabsTrigger>
            <TabsTrigger value="zones">Zones</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
          </TabsList>

          {/* Methods Tab */}
          <TabsContent value="methods">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Shipping Methods</CardTitle>
                  <CardDescription>
                    Manage available shipping methods for the marketplace
                  </CardDescription>
                </div>
                <Button
                  onClick={() => handleOpenMethodDialog()}
                  className="flex items-center gap-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Method
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingMethods ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : isErrorMethods ? (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-red-700">
                        Error Loading Methods
                      </h3>
                      <p className="text-sm text-red-600 mt-1">
                        There was an error loading shipping methods. Please try
                        refreshing the page.
                      </p>
                    </div>
                  </div>
                ) : shippingMethods?.length > 0 ? (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Delivery Time</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {shippingMethods.map((method: any) => (
                          <TableRow key={method.id}>
                            <TableCell className="font-medium">
                              {method.name}
                            </TableCell>
                            <TableCell>{formatPrice(method.price)}</TableCell>
                            <TableCell>{method.estimatedDays}</TableCell>
                            <TableCell>
                              {method.isActive ? (
                                <span className="flex items-center text-green-600">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Active
                                </span>
                              ) : (
                                <span className="text-muted-foreground">
                                  Inactive
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenMethodDialog(method)}
                                >
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleOpenDeleteMethodDialog(method.id)
                                  }
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-md bg-muted/40">
                    <Truck className="h-8 w-8 mx-auto text-muted-foreground" />
                    <h3 className="mt-4 font-medium">No Shipping Methods</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                      You haven't created any shipping methods yet. Add a method
                      to get started.
                    </p>
                    <Button
                      onClick={() => handleOpenMethodDialog()}
                      className="mt-4 flex items-center gap-2"
                      variant="outline"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Add Shipping Method
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Zones Tab */}
          <TabsContent value="zones">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Shipping Zones</CardTitle>
                  <CardDescription>
                    Manage geographic shipping zones for different pricing
                  </CardDescription>
                </div>
                <Button
                  onClick={() => handleOpenZoneDialog()}
                  className="flex items-center gap-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Zone
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingZones ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : isErrorZones ? (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-red-700">
                        Error Loading Zones
                      </h3>
                      <p className="text-sm text-red-600 mt-1">
                        There was an error loading shipping zones. Please try
                        refreshing the page.
                      </p>
                    </div>
                  </div>
                ) : shippingZones?.length > 0 ? (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Regions</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {shippingZones.map((zone: any) => (
                          <TableRow key={zone.id}>
                            <TableCell className="font-medium">
                              {zone.name}
                            </TableCell>
                            <TableCell>
                              {zone.regions && zone.regions.length > 80
                                ? `${zone.regions.substring(0, 80)}...`
                                : zone.regions}
                            </TableCell>
                            <TableCell>
                              {zone.isActive ? (
                                <span className="flex items-center text-green-600">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Active
                                </span>
                              ) : (
                                <span className="text-muted-foreground">
                                  Inactive
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenZoneDialog(zone)}
                                >
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleOpenDeleteZoneDialog(zone.id)
                                  }
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-md bg-muted/40">
                    <MapPin className="h-8 w-8 mx-auto text-muted-foreground" />
                    <h3 className="mt-4 font-medium">No Shipping Zones</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                      You haven't created any shipping zones yet. Add a zone to
                      get started.
                    </p>
                    <Button
                      onClick={() => handleOpenZoneDialog()}
                      className="mt-4 flex items-center gap-2"
                      variant="outline"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Add Shipping Zone
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rules Tab */}
          <TabsContent value="rules">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Shipping Rules</CardTitle>
                  <CardDescription>
                    Set pricing rules for method and zone combinations
                  </CardDescription>
                </div>
                <Button
                  onClick={() => handleOpenRuleDialog()}
                  className="flex items-center gap-2"
                  disabled={!shippingMethods?.length || !shippingZones?.length}
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Rule
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingRules || isLoadingMethods || isLoadingZones ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : isErrorRules ? (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-red-700">
                        Error Loading Rules
                      </h3>
                      <p className="text-sm text-red-600 mt-1">
                        There was an error loading shipping rules. Please try
                        refreshing the page.
                      </p>
                    </div>
                  </div>
                ) : !shippingMethods?.length || !shippingZones?.length ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-start gap-3">
                    <Info className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-amber-700">
                        Cannot Create Rules Yet
                      </h3>
                      <p className="text-sm text-amber-600 mt-1">
                        You need to create at least one shipping method and one
                        shipping zone before you can create rules.
                      </p>
                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setActiveTab("methods")}
                          className="text-amber-600 border-amber-200 hover:bg-amber-50"
                        >
                          <Truck className="h-4 w-4 mr-2" />
                          Add Method
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setActiveTab("zones")}
                          className="text-amber-600 border-amber-200 hover:bg-amber-50"
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          Add Zone
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : shippingRules?.length > 0 ? (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Method</TableHead>
                          <TableHead>Zone</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Order Range</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {shippingRules.map((rule: any) => (
                          <TableRow key={rule.id}>
                            <TableCell className="font-medium">
                              {getMethodName(rule.methodId)}
                            </TableCell>
                            <TableCell>{getZoneName(rule.zoneId)}</TableCell>
                            <TableCell>{formatPrice(rule.price)}</TableCell>
                            <TableCell>
                              {rule.minOrderValue > 0 && rule.maxOrderValue
                                ? `${formatPrice(rule.minOrderValue)} - ${formatPrice(rule.maxOrderValue)}`
                                : rule.minOrderValue > 0
                                  ? `Min: ${formatPrice(rule.minOrderValue)}`
                                  : rule.maxOrderValue
                                    ? `Max: ${formatPrice(rule.maxOrderValue)}`
                                    : "Any"}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenRuleDialog(rule)}
                                >
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleOpenDeleteRuleDialog(rule.id)
                                  }
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-md bg-muted/40">
                    <Settings className="h-8 w-8 mx-auto text-muted-foreground" />
                    <h3 className="mt-4 font-medium">No Shipping Rules</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                      You haven't created any shipping rules yet. Rules connect
                      methods to zones with specific pricing.
                    </p>
                    <Button
                      onClick={() => handleOpenRuleDialog()}
                      className="mt-4 flex items-center gap-2"
                      variant="outline"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Add Shipping Rule
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Shipping Method Dialog */}
        <Dialog open={isMethodDialogOpen} onOpenChange={setIsMethodDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {selectedMethod
                  ? "Edit Shipping Method"
                  : "Add Shipping Method"}
              </DialogTitle>
              <DialogDescription>
                {selectedMethod
                  ? "Update the details of this shipping method"
                  : "Add a new shipping method for your marketplace"}
              </DialogDescription>
            </DialogHeader>
            <Form {...methodForm}>
              <form
                onSubmit={methodForm.handleSubmit(onSubmitMethod)}
                className="space-y-4"
              >
                <FormField
                  control={methodForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Method Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Standard Shipping"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={methodForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Brief description of the shipping method"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={methodForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Price (in paise)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="1" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter the price in paise (e.g., ₹100 = 10000 paise)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={methodForm.control}
                  name="estimatedDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Delivery Time</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 3-5 business days"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={methodForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Priority</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="1" {...field} />
                      </FormControl>
                      <FormDescription>
                        Higher numbers will appear first in the list (0 = lowest
                        priority)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={methodForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <FormDescription>
                          Inactive methods will not be available to customers
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
                    onClick={() => setIsMethodDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={shippingMethodMutation.isPending}
                  >
                    {shippingMethodMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {selectedMethod ? "Update Method" : "Add Method"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Shipping Zone Dialog */}
        <Dialog open={isZoneDialogOpen} onOpenChange={setIsZoneDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {selectedZone ? "Edit Shipping Zone" : "Add Shipping Zone"}
              </DialogTitle>
              <DialogDescription>
                {selectedZone
                  ? "Update the details of this shipping zone"
                  : "Add a new shipping zone for your marketplace"}
              </DialogDescription>
            </DialogHeader>
            <Form {...zoneForm}>
              <form
                onSubmit={zoneForm.handleSubmit(onSubmitZone)}
                className="space-y-4"
              >
                <FormField
                  control={zoneForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zone Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., North India" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={zoneForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Brief description of the zone"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={zoneForm.control}
                  name="regions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Regions</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="List of regions, states, or pincodes covered by this zone"
                          {...field}
                          rows={4}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter regions, states, or pincode ranges covered by this
                        zone, separated by commas or line breaks
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={zoneForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <FormDescription>
                          Inactive zones will not be used for shipping
                          calculations
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
                    onClick={() => setIsZoneDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={shippingZoneMutation.isPending}
                  >
                    {shippingZoneMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {selectedZone ? "Update Zone" : "Add Zone"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Shipping Rule Dialog */}
        <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {selectedRule ? "Edit Shipping Rule" : "Add Shipping Rule"}
              </DialogTitle>
              <DialogDescription>
                {selectedRule
                  ? "Update the details of this shipping rule"
                  : "Add a new shipping rule connecting methods to zones"}
              </DialogDescription>
            </DialogHeader>
            <Form {...ruleForm}>
              <form
                onSubmit={ruleForm.handleSubmit(onSubmitRule)}
                className="space-y-4"
              >
                <FormField
                  control={ruleForm.control}
                  name="methodId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shipping Method</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(parseInt(value))
                        }
                        defaultValue={
                          field.value > 0 ? field.value.toString() : undefined
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
                              {method.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={ruleForm.control}
                  name="zoneId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shipping Zone</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(parseInt(value))
                        }
                        defaultValue={
                          field.value > 0 ? field.value.toString() : undefined
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a shipping zone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {shippingZones?.map((zone: any) => (
                            <SelectItem
                              key={zone.id}
                              value={zone.id.toString()}
                            >
                              {zone.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={ruleForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (in paise)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="1" {...field} />
                      </FormControl>
                      <FormDescription>
                        Override the base price of the shipping method for this
                        zone
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={ruleForm.control}
                    name="minOrderValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Order Value</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={ruleForm.control}
                    name="maxOrderValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Order Value</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={field.value === undefined ? "" : field.value}
                            onChange={(e) => {
                              const value =
                                e.target.value === ""
                                  ? undefined
                                  : Number(e.target.value);
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={ruleForm.control}
                  name="additionalDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Processing Days</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="1" {...field} />
                      </FormControl>
                      <FormDescription>
                        Extra days to add to the method's estimated delivery
                        time for this zone
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={ruleForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any notes or special instructions for this rule"
                          {...field}
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={ruleForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <FormDescription>
                          Inactive rules will not be used for shipping
                          calculations
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
                    onClick={() => setIsRuleDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={shippingRuleMutation.isPending}
                  >
                    {shippingRuleMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {selectedRule ? "Update Rule" : "Add Rule"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialogs for Delete */}
        <Dialog
          open={isMethodDeleteDialogOpen}
          onOpenChange={setIsMethodDeleteDialogOpen}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete Shipping Method</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this shipping method? This
                action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="border rounded-md p-4 bg-red-50 text-red-700">
              <p className="text-sm">
                <AlertCircle className="h-4 w-4 inline-block mr-2" />
                Deleting a shipping method will also affect any shipping rules
                using this method.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsMethodDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  itemToDelete && deleteMethodMutation.mutate(itemToDelete)
                }
                disabled={deleteMethodMutation.isPending}
              >
                {deleteMethodMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Delete Method
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isZoneDeleteDialogOpen}
          onOpenChange={setIsZoneDeleteDialogOpen}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete Shipping Zone</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this shipping zone? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="border rounded-md p-4 bg-red-50 text-red-700">
              <p className="text-sm">
                <AlertCircle className="h-4 w-4 inline-block mr-2" />
                Deleting a shipping zone will also affect any shipping rules
                using this zone.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsZoneDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  itemToDelete && deleteZoneMutation.mutate(itemToDelete)
                }
                disabled={deleteZoneMutation.isPending}
              >
                {deleteZoneMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Delete Zone
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isRuleDeleteDialogOpen}
          onOpenChange={setIsRuleDeleteDialogOpen}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete Shipping Rule</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this shipping rule? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsRuleDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  itemToDelete && deleteRuleMutation.mutate(itemToDelete)
                }
                disabled={deleteRuleMutation.isPending}
              >
                {deleteRuleMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Delete Rule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
