import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/admin-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  PackageIcon,
  SettingsIcon,
  RefreshCwIcon,
  ClockIcon,
  CheckIcon,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface ShiprocketSettings {
  email: string;
  password: string;
  defaultCourier: string;
  autoShipEnabled: boolean;
}

interface ShiprocketCourier {
  id: number;
  name: string;
  serviceable_zones: string;
}

interface ShiprocketShipment {
  id: string;
  order_id: string;
  status: string;
  courier: string;
  tracking_id: string;
  created_at: string;
}

interface PendingOrder {
  id: number;
  userId: number;
  status: string;
  total: number;
  date: string;
  shippingDetails: string;
  items: {
    id: number;
    orderId: number;
    productId: number;
    quantity: number;
    price: number;
    product: {
      name: string;
    };
  }[];
}

export default function ShiprocketPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<ShiprocketSettings>({
    email: "",
    password: "",
    defaultCourier: "",
    autoShipEnabled: false,
  });

  const [isConnecting, setIsConnecting] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Fetch Shiprocket connection status
  const {
    data: connectionStatus,
    isLoading: isLoadingStatus,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ["/api/shiprocket/status"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/shiprocket/status");
      if (!res.ok) throw new Error("Failed to fetch Shiprocket status");
      return res.json();
    },
  });

  // Fetch Shiprocket settings
  const {
    data: shiprocketSettings,
    isLoading: isLoadingSettings,
    refetch: refetchSettings,
  } = useQuery({
    queryKey: ["/api/shiprocket/settings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/shiprocket/settings");
      if (!res.ok) throw new Error("Failed to fetch Shiprocket settings");
      return res.json();
    },
  });

  // Fetch Shiprocket couriers
  const { data: couriers, isLoading: isLoadingCouriers } = useQuery({
    queryKey: ["/api/shiprocket/couriers"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/shiprocket/couriers");
      if (!res.ok) throw new Error("Failed to fetch Shiprocket couriers");
      return res.json();
    },
    enabled: connectionStatus?.connected === true,
  });

  // Fetch Shiprocket shipments
  const {
    data: shipments,
    isLoading: isLoadingShipments,
    refetch: refetchShipments,
  } = useQuery({
    queryKey: ["/api/shiprocket/shipments"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/shiprocket/shipments");
      if (!res.ok) throw new Error("Failed to fetch Shiprocket shipments");
      return res.json();
    },
    enabled: connectionStatus?.connected === true,
  });

  // Fetch pending orders
  const {
    data: pendingOrders,
    isLoading: isLoadingPendingOrders,
    refetch: refetchPendingOrders,
  } = useQuery({
    queryKey: ["/api/shiprocket/pending-orders"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/shiprocket/pending-orders");
      if (!res.ok) throw new Error("Failed to fetch pending orders");
      return res.json();
    },
    enabled: connectionStatus?.connected === true,
  });

  // Connect to Shiprocket mutation
  const connectMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const res = await apiRequest(
        "POST",
        "/api/shiprocket/connect",
        credentials
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to connect to Shiprocket");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Connected to Shiprocket",
        description: "Your Shiprocket account has been connected successfully.",
        variant: "default",
      });
      refetchStatus();
      refetchSettings();

      // Redirect to the shipping dashboard after successful connection
      window.location.href = "/admin/shipping-dashboard";
    },
    onError: (error) => {
      toast({
        title: "Connection failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Test Shiprocket connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/shiprocket/test");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.error || "Failed to test Shiprocket connection"
        );
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Connection test successful",
        description: "Your Shiprocket account is properly connected.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Connection test failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: ShiprocketSettings) => {
      const res = await apiRequest(
        "POST",
        "/api/shiprocket/settings",
        newSettings
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save settings");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Your Shiprocket settings have been saved successfully.",
        variant: "default",
      });
      refetchSettings();
    },
    onError: (error) => {
      toast({
        title: "Failed to save settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create shipment mutation
  const createShipmentMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const res = await apiRequest("POST", `/api/orders/${orderId}/shiprocket`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create shipment");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Shipment created",
        description: "The order has been shipped successfully.",
        variant: "default",
      });
      refetchPendingOrders();
      refetchShipments();
    },
    onError: (error) => {
      toast({
        title: "Failed to create shipment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cancel shipment mutation
  const cancelShipmentMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const res = await apiRequest(
        "POST",
        `/api/orders/${orderId}/shiprocket/cancel`
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to cancel shipment");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Shipment cancelled",
        description: "The shipment has been cancelled successfully.",
        variant: "default",
      });
      refetchShipments();
    },
    onError: (error) => {
      toast({
        title: "Failed to cancel shipment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update settings state when data is loaded
  useEffect(() => {
    if (shiprocketSettings) {
      setSettings(shiprocketSettings);
    }
  }, [shiprocketSettings]);

  // Handle connect to Shiprocket
  const handleConnect = async () => {
    if (!settings.email || !settings.password) {
      toast({
        title: "Missing credentials",
        description: "Please provide your Shiprocket email and password.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      await connectMutation.mutateAsync({
        email: settings.email,
        password: settings.password,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle test connection
  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      await testConnectionMutation.mutateAsync();
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Handle save settings
  const handleSaveSettings = async () => {
    await saveSettingsMutation.mutateAsync(settings);
  };

  // Format date helper function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Shipment status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Parse shipping details
  const parseShippingDetails = (shippingDetails: string) => {
    try {
      return typeof shippingDetails === "string"
        ? JSON.parse(shippingDetails)
        : shippingDetails;
    } catch (error) {
      return { address: shippingDetails };
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Shiprocket Integration</h1>
          <div className="flex items-center space-x-2">
            {isLoadingStatus ? (
              <Badge variant="outline" className="bg-gray-100">
                <Skeleton className="h-4 w-20" />
              </Badge>
            ) : connectionStatus?.connected ? (
              <Badge variant="outline" className="bg-green-100 text-green-800">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-100 text-red-800">
                <XCircleIcon className="h-4 w-4 mr-1" />
                Not Connected
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchStatus();
                refetchSettings();
                refetchShipments();
                refetchPendingOrders();
              }}
            >
              <RefreshCwIcon className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        <Tabs defaultValue="settings">
          <TabsList className="mb-4">
            <TabsTrigger value="settings">
              <SettingsIcon className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              disabled={!connectionStatus?.connected}
            >
              <ClockIcon className="h-4 w-4 mr-2" />
              Pending Orders
            </TabsTrigger>
            <TabsTrigger
              value="shipments"
              disabled={!connectionStatus?.connected}
            >
              <TruckIcon className="h-4 w-4 mr-2" />
              Shipments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Shiprocket Account</CardTitle>
                  <CardDescription>
                    Connect your Shiprocket account to automate shipping and
                    order tracking.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={settings.email}
                        onChange={(e) =>
                          setSettings({ ...settings, email: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder={
                          settings.password === "********"
                            ? "********"
                            : "Enter password"
                        }
                        value={settings.password}
                        onChange={(e) =>
                          setSettings({ ...settings, password: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={
                      !connectionStatus?.connected || isTestingConnection
                    }
                  >
                    {isTestingConnection ? (
                      <>
                        <Skeleton className="h-4 w-4 mr-2 rounded-full animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-4 w-4 mr-2" />
                        Test Connection
                      </>
                    )}
                  </Button>
                  <Button onClick={handleConnect} disabled={isConnecting}>
                    {isConnecting ? (
                      <>
                        <Skeleton className="h-4 w-4 mr-2 rounded-full animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        {connectionStatus?.connected
                          ? "Update Connection"
                          : "Connect"}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Shipping Configuration</CardTitle>
                  <CardDescription>
                    Configure default shipping options and automation settings.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="defaultCourier">Default Courier</Label>
                      <Select
                        disabled={!connectionStatus?.connected}
                        value={settings.defaultCourier}
                        onValueChange={(value) =>
                          setSettings({ ...settings, defaultCourier: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a courier" />
                        </SelectTrigger>
                        <SelectContent>
                          {couriers?.map((courier: ShiprocketCourier) => (
                            <SelectItem key={courier.id} value={courier.name}>
                              {courier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground mt-1">
                        This courier will be used by default when creating
                        shipments.
                      </p>
                    </div>
                    <div className="flex items-center justify-between space-y-0 rounded-md border p-4">
                      <div className="space-y-0.5">
                        <Label htmlFor="autoShip">Automatic Shipping</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically create shipments for new orders.
                        </p>
                      </div>
                      <Switch
                        id="autoShip"
                        disabled={!connectionStatus?.connected}
                        checked={settings.autoShipEnabled}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, autoShipEnabled: checked })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={handleSaveSettings}
                    disabled={
                      !connectionStatus?.connected ||
                      saveSettingsMutation.isPending
                    }
                  >
                    {saveSettingsMutation.isPending
                      ? "Saving..."
                      : "Save Settings"}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Orders</CardTitle>
                <CardDescription>
                  Orders that are ready to be shipped via Shiprocket.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPendingOrders ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-center space-x-4 border p-4 rounded-md"
                      >
                        <Skeleton className="h-12 w-12 rounded-md" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-1/4" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                        <Skeleton className="h-9 w-20" />
                      </div>
                    ))}
                  </div>
                ) : pendingOrders?.length > 0 ? (
                  <div className="space-y-4">
                    {pendingOrders.map((order: PendingOrder) => {
                      const shippingDetails = parseShippingDetails(
                        order.shippingDetails
                      );
                      return (
                        <div
                          key={order.id}
                          className="flex flex-col border rounded-md overflow-hidden"
                        >
                          <div className="flex justify-between items-center p-4 bg-muted/50">
                            <div>
                              <h3 className="font-semibold">
                                Order #{order.id}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(order.date)} • {order.items.length}{" "}
                                item(s) • ${order.total.toFixed(2)}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() =>
                                createShipmentMutation.mutate(order.id)
                              }
                              disabled={createShipmentMutation.isPending}
                            >
                              <PackageIcon className="h-4 w-4 mr-2" />
                              {createShipmentMutation.isPending
                                ? "Processing..."
                                : "Ship Now"}
                            </Button>
                          </div>
                          <div className="p-4 border-t">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium text-sm mb-1">
                                  Items
                                </h4>
                                <ul className="space-y-1 text-sm">
                                  {order.items.map((item) => (
                                    <li key={item.id}>
                                      {item.quantity}x {item.product.name} ($
                                      {item.price.toFixed(2)})
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h4 className="font-medium text-sm mb-1">
                                  Shipping Address
                                </h4>
                                <p className="text-sm">
                                  {shippingDetails.name}
                                  <br />
                                  {shippingDetails.address}
                                  <br />
                                  {shippingDetails.city},{" "}
                                  {shippingDetails.state}{" "}
                                  {shippingDetails.zipCode}
                                  <br />
                                  {shippingDetails.phone}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircleIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold">
                      No pending orders
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      All orders have been processed. Great job!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipments">
            <Card>
              <CardHeader>
                <CardTitle>Shipments</CardTitle>
                <CardDescription>
                  Track all your Shiprocket shipments and their current status.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingShipments ? (
                  <div className="w-full space-y-3">
                    <Skeleton className="h-10 w-full" />
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : shipments?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Shipment ID</TableHead>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Courier</TableHead>
                        <TableHead>Tracking ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shipments.map((shipment: ShiprocketShipment) => (
                        <TableRow key={shipment.id}>
                          <TableCell>{shipment.id}</TableCell>
                          <TableCell>{shipment.order_id}</TableCell>
                          <TableCell>{shipment.courier}</TableCell>
                          <TableCell>
                            <a
                              href={`/tracking/${shipment.tracking_id}`}
                              className="text-primary hover:underline"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {shipment.tracking_id}
                            </a>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(shipment.status)}>
                              {shipment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatDate(shipment.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => {
                                // Extract order ID from shipment
                                const orderId = parseInt(
                                  shipment.order_id.replace("SR-", "")
                                );
                                if (!isNaN(orderId)) {
                                  cancelShipmentMutation.mutate(orderId);
                                }
                              }}
                              disabled={
                                shipment.status.toLowerCase() === "delivered" ||
                                shipment.status.toLowerCase() === "cancelled"
                              }
                            >
                              Cancel
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <TruckIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold">
                      No shipments yet
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      No shipments have been created using Shiprocket yet.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() =>
                        document
                          .querySelector('[data-value="pending"]')
                          ?.click()
                      }
                    >
                      View Pending Orders
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
