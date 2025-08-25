import React, { useState } from "react";
import AdminLayout from "@/components/layout/admin-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Package,
  Truck,
  ClipboardCheck,
  AlertCircle,
  TrendingUp,
  Clock,
  Activity,
  ArrowRight,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";

// Type definitions
interface ShipmentStats {
  pending: number;
  shipped: number;
  delivered: number;
  issues: number;
}

interface Shipment {
  id: string;
  orderId: string;
  trackingId: string;
  courierName: string;
  status: string;
  date: string;
  customerName: string;
}

interface PendingOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  date: string;
  items: Array<{
    id: number;
    productId: number;
    name: string;
    quantity: number;
    price: number;
  }>;
  shippingDetails: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
    email: string;
  };
}

interface ShippingConnectionStatus {
  configured: boolean;
  status: "connected" | "not_connected" | "error";
}

const ShippingDashboardPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null);
  const [shipmentDialogOpen, setShipmentDialogOpen] = useState(false);
  const [statsTimeframe, setStatsTimeframe] = useState<
    "week" | "month" | "year"
  >("week");

  // Fetch shipping connection status
  const { data: connectionStatus, isLoading: isLoadingStatus } =
    useQuery<ShippingConnectionStatus>({
      queryKey: ["/api/shipping/status"],
      queryFn: async () => {
        const res = await apiRequest("GET", "/api/shipping/status");
        if (!res.ok) throw new Error("Failed to fetch shipping status");
        return res.json();
      },
    });

  // Fetch shipment statistics
  const { data: shipmentStats, isLoading: isLoadingStats } =
    useQuery<ShipmentStats>({
      queryKey: ["/api/shipping/stats", statsTimeframe],
      queryFn: async () => {
        try {
          const res = await apiRequest(
            "GET",
            `/api/shipping/stats?timeframe=${statsTimeframe}`
          );
          if (!res.ok) {
            // If the backend doesn't have this endpoint yet, use estimated numbers based on orders
            return {
              pending: 0,
              shipped: 0,
              delivered: 0,
              issues: 0,
            };
          }
          return res.json();
        } catch (error) {
          console.error("Error fetching shipment stats:", error);
          // Fallback to empty stats if the endpoint doesn't exist yet
          return {
            pending: 0,
            shipped: 0,
            delivered: 0,
            issues: 0,
          };
        }
      },
    });

  // Fetch recent shipments
  const { data: recentShipments, isLoading: isLoadingShipments } = useQuery<
    Shipment[]
  >({
    queryKey: ["/api/shipping/shipments"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/shipping/shipments");
      if (!res.ok) {
        if (res.status === 404) {
          return []; // Return empty array if no shipments found
        }
        throw new Error("Failed to fetch shipments");
      }
      return res.json();
    },
  });

  // Fetch pending orders
  const { data: pendingOrdersResponse, isLoading: isLoadingPendingOrders } =
    useQuery<{
      orders: PendingOrder[];
      total: number;
      page: number;
      pageSize: number;
    }>({
      queryKey: ["/api/shipping/pending-orders"],
      queryFn: async () => {
        const res = await apiRequest("GET", "/api/shipping/pending-orders");
        if (!res.ok) {
          if (res.status === 404) {
            return { orders: [], total: 0, page: 1, pageSize: 10 }; // Return empty data if no pending orders found
          }
          throw new Error("Failed to fetch pending orders");
        }
        return res.json();
      },
    });

  // Extract the orders from the response
  const pendingOrders = pendingOrdersResponse?.orders || [];

  // Create shipment mutation
  const createShipmentMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const res = await apiRequest("POST", `/api/orders/${orderId}/ship`);
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
      });
      setShipmentDialogOpen(false);
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/shipping/shipments"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/shipping/pending-orders"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shipping/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create shipment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle create shipment
  const handleCreateShipment = () => {
    if (!connectionStatus?.configured) {
      toast({
        title: "Shipping not configured",
        description: "Please configure your shipping settings first.",
        variant: "destructive",
      });
      return;
    }

    if (!pendingOrders || pendingOrders.length === 0) {
      toast({
        title: "No pending orders",
        description: "There are no pending orders that need to be shipped.",
        variant: "destructive",
      });
      return;
    }

    // Show the first pending order in the dialog
    setSelectedOrder(pendingOrders[0]);
    setShipmentDialogOpen(true);
  };

  // Handle confirming a shipment creation
  const confirmShipment = () => {
    if (selectedOrder) {
      createShipmentMutation.mutate(selectedOrder.id);
    }
  };

  // Combine the data for display
  const shippingStats = [
    {
      title: "Pending Shipments",
      value: isLoadingStats ? "..." : (shipmentStats?.pending || 0).toString(),
      icon: Clock,
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      title: "Shipped Today",
      value: isLoadingStats ? "..." : (shipmentStats?.shipped || 0).toString(),
      icon: Truck,
      color: "bg-blue-100 text-blue-800",
    },
    {
      title: "Delivered",
      value: isLoadingStats
        ? "..."
        : (shipmentStats?.delivered || 0).toString(),
      icon: ClipboardCheck,
      color: "bg-green-100 text-green-800",
    },
    {
      title: "Issues",
      value: isLoadingStats ? "..." : (shipmentStats?.issues || 0).toString(),
      icon: AlertCircle,
      color: "bg-red-100 text-red-800",
    },
  ];

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "yyyy-MM-dd");
    } catch (error) {
      return dateString;
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            Shipping Dashboard
          </h1>
          <Button
            onClick={handleCreateShipment}
            disabled={
              isLoadingStatus ||
              !connectionStatus?.configured ||
              !pendingOrders?.length ||
              createShipmentMutation.isPending
            }
          >
            {createShipmentMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Truck className="h-4 w-4 mr-2" />
                Create Shipment
              </>
            )}
          </Button>
        </div>

        {/* Connection Status Alert */}
        {!isLoadingStatus && !connectionStatus?.configured && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
              <div>
                <p className="text-sm text-yellow-700">
                  Shipping is not configured. Please set up your shipping
                  credentials in
                  <Button
                    variant="link"
                    className="px-1 font-medium underline text-yellow-700"
                    onClick={() =>
                      (window.location.href = "/admin/shipping-settings")
                    }
                  >
                    Shipping Settings
                  </Button>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {shippingStats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </p>
                      <h3 className="text-2xl font-bold mt-1">
                        {isLoadingStats ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          stat.value
                        )}
                      </h3>
                    </div>
                    <div className={`p-2 rounded-full ${stat.color}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Shipping Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Shipping Activity</CardTitle>
              <CardDescription>
                Overview of shipping performance
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={statsTimeframe === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatsTimeframe("week")}
              >
                This Week
              </Button>
              <Button
                variant={statsTimeframe === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatsTimeframe("month")}
              >
                This Month
              </Button>
              <Button
                variant={statsTimeframe === "year" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatsTimeframe("year")}
              >
                This Year
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoadingShipments ? (
              <div className="h-[200px] w-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !recentShipments || recentShipments.length === 0 ? (
              <div className="h-[200px] w-full flex items-center justify-center">
                <div className="flex flex-col items-center text-muted-foreground">
                  <Activity className="h-16 w-16 mb-2" />
                  <p>No shipping activity data available</p>
                  <p className="text-sm">
                    Create shipments to see activity chart
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-[200px] w-full flex items-center justify-center">
                <div className="flex flex-col items-center text-muted-foreground">
                  <Activity className="h-16 w-16 mb-2" />
                  <p>Shipping activity chart will appear here</p>
                  <p className="text-sm">
                    Showing data for{" "}
                    {statsTimeframe === "week"
                      ? "this week"
                      : statsTimeframe === "month"
                        ? "this month"
                        : "this year"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Shipments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Shipments</CardTitle>
              <CardDescription>
                Latest shipments processed in the system
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => (window.location.href = "/admin/orders")}
            >
              View All Orders
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingShipments ? (
              <div className="py-6 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !recentShipments || recentShipments.length === 0 ? (
              <div className="py-8 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium">No shipments yet</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Use the Create Shipment button to ship your first order
                </p>
                <Button
                  onClick={handleCreateShipment}
                  disabled={
                    !connectionStatus?.configured || !pendingOrders?.length
                  }
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Create Your First Shipment
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tracking ID</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Shipped Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentShipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell className="font-medium">
                        {shipment.trackingId}
                      </TableCell>
                      <TableCell>{shipment.orderId}</TableCell>
                      <TableCell>{shipment.customerName}</TableCell>
                      <TableCell>{shipment.courierName}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            shipment.status === "Delivered"
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : shipment.status === "In Transit"
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : shipment.status === "Out for Delivery"
                                  ? "bg-purple-100 text-purple-800 border border-purple-200"
                                  : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                          }`}
                        >
                          {shipment.status}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(shipment.date)}</TableCell>
                      <TableCell>
                        <a
                          href={`/admin/tracking/${shipment.trackingId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Track
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pending Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Orders</CardTitle>
            <CardDescription>Orders ready to be shipped</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPendingOrders ? (
              <div className="py-6 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !pendingOrders || pendingOrders.length === 0 ? (
              <div className="py-8 text-center">
                <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium">No pending orders</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  All orders have been shipped or there are no new orders
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingOrders.map((order: PendingOrder) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.orderNumber || `ORD-${order.id}`}
                      </TableCell>
                      <TableCell>
                        {order.customerName ||
                          order.shippingDetails?.name ||
                          "N/A"}
                      </TableCell>
                      <TableCell>{order.items?.length || 0} items</TableCell>
                      <TableCell>₹{order.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>{formatDate(order.date)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShipmentDialogOpen(true);
                          }}
                          disabled={createShipmentMutation.isPending}
                        >
                          {createShipmentMutation.isPending &&
                          selectedOrder?.id === order.id ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Truck className="h-3 w-3 mr-1" />
                          )}
                          Ship
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create Shipment Dialog */}
        <Dialog open={shipmentDialogOpen} onOpenChange={setShipmentDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Shipment</DialogTitle>
              <DialogDescription>
                Confirm shipping details for order #
                {selectedOrder?.orderNumber || `ORD-${selectedOrder?.id}`}
              </DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4 py-4">
                <div className="flex flex-col space-y-1">
                  <h4 className="text-sm font-semibold">Shipping To:</h4>
                  <p className="text-sm">
                    {selectedOrder.shippingDetails?.name}
                  </p>
                  <p className="text-sm">
                    {selectedOrder.shippingDetails?.address}
                  </p>
                  <p className="text-sm">
                    {selectedOrder.shippingDetails?.city},{" "}
                    {selectedOrder.shippingDetails?.state}{" "}
                    {selectedOrder.shippingDetails?.zipCode}
                  </p>
                  <p className="text-sm">
                    {selectedOrder.shippingDetails?.phone}
                  </p>
                </div>

                <div className="flex flex-col space-y-1">
                  <h4 className="text-sm font-semibold">Order Details:</h4>
                  <div className="text-sm space-y-1">
                    <p>Date: {formatDate(selectedOrder.date)}</p>
                    <p>Total: ₹{selectedOrder.totalAmount.toFixed(2)}</p>
                    <p>Items: {selectedOrder.items?.length || 0}</p>
                  </div>
                </div>

                <div className="flex flex-col space-y-1">
                  <h4 className="text-sm font-semibold">Products:</h4>
                  <div className="text-sm space-y-2 max-h-[200px] overflow-y-auto">
                    {selectedOrder.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between border-b pb-2"
                      >
                        <span>
                          {item.name} × {item.quantity}
                        </span>
                        <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-800 font-medium">
                    This order will be processed for shipping.
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShipmentDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmShipment}
                disabled={createShipmentMutation.isPending}
              >
                {createShipmentMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Truck className="h-4 w-4 mr-2" />
                    Create Shipment
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default ShippingDashboardPage;
