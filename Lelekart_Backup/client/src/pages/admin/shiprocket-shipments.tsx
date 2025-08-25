import React from "react";
import AdminLayout from "@/components/layout/admin-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  TruckIcon,
  Package,
  RefreshCw,
  Search,
  ExternalLink,
} from "lucide-react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { formatCurrency } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";
import ShiprocketErrorDisplay from "@/components/shiprocket/shiprocket-error-display";

const ShiprocketShipments = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Generate token mutation for troubleshooting
  const generateTokenMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/shiprocket/token");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Token refreshed",
        description: "Shiprocket API token has been refreshed successfully.",
        variant: "default",
      });
      // Refresh all Shiprocket data
      queryClient.invalidateQueries({ queryKey: ["/api/shiprocket/orders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error refreshing token",
        description:
          error.message || "There was an error refreshing the token.",
        variant: "destructive",
      });
    },
  });

  // Get shipped orders
  const {
    data: shippedOrders,
    isLoading: isLoadingOrders,
    isError: isErrorOrders,
    error: shippedOrdersError,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ["/api/shiprocket/orders"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/shiprocket/orders");
        const text = await response.text();

        // Check for HTML response first
        if (text.includes("<!DOCTYPE") || text.includes("<html")) {
          throw new Error(
            "The API returned HTML instead of JSON. Please try generating a new API token."
          );
        }

        try {
          // Try to parse as JSON
          const data = JSON.parse(text);
          return data;
        } catch (parseError) {
          // If it's not HTML but not valid JSON either
          throw new Error(
            `Invalid API response format: ${text.substring(0, 100)}...`
          );
        }
      } catch (error) {
        console.error("Shipped orders API error:", error);
        throw error;
      }
    },
    retry: (failureCount, error) => {
      // Don't retry if we get HTML response
      if (
        error instanceof Error &&
        (error.message.includes("<!DOCTYPE") ||
          error.message.includes("<html") ||
          error.message.includes("returned HTML"))
      ) {
        return false;
      }
      // For other errors, retry up to 2 times
      return failureCount < 2;
    },
  });

  // Function to get status badge color
  const getStatusBadge = (status: string) => {
    const statusMap: {
      [key: string]: {
        variant: "default" | "secondary" | "destructive" | "outline";
        bgColor: string;
        textColor: string;
        borderColor: string;
      };
    } = {
      shipped: {
        variant: "outline",
        bgColor: "bg-blue-50",
        textColor: "text-blue-700",
        borderColor: "border-blue-200",
      },
      delivered: {
        variant: "outline",
        bgColor: "bg-green-50",
        textColor: "text-green-700",
        borderColor: "border-green-200",
      },
      processing: {
        variant: "outline",
        bgColor: "bg-amber-50",
        textColor: "text-amber-700",
        borderColor: "border-amber-200",
      },
      intransit: {
        variant: "outline",
        bgColor: "bg-purple-50",
        textColor: "text-purple-700",
        borderColor: "border-purple-200",
      },
      outfordelivery: {
        variant: "outline",
        bgColor: "bg-indigo-50",
        textColor: "text-indigo-700",
        borderColor: "border-indigo-200",
      },
      delayed: {
        variant: "outline",
        bgColor: "bg-yellow-50",
        textColor: "text-yellow-700",
        borderColor: "border-yellow-200",
      },
      failed: {
        variant: "outline",
        bgColor: "bg-red-50",
        textColor: "text-red-700",
        borderColor: "border-red-200",
      },
    };

    const lowerStatus = (status || "").toLowerCase().replace(/[^a-z]/g, "");
    return (
      statusMap[lowerStatus] || {
        variant: "outline",
        bgColor: "bg-gray-50",
        textColor: "text-gray-700",
        borderColor: "border-gray-200",
      }
    );
  };

  // Function to determine tracking URL
  const getTrackingUrl = (order: any) => {
    if (!order.courierName || !order.awbCode) return null;

    // Map of courier names to tracking URLs
    const trackingUrls: { [key: string]: string } = {
      Delhivery: "https://www.delhivery.com/track/package/{}",
      "Ecom Express": "https://ecomexpress.in/tracking/?awb_field={}",
      DTDC: "https://www.dtdc.in/tracking/tracking.asp?Type=AWB&strCnno={}",
      Bluedart: "https://www.bluedart.com/tracking?trackfor={}&trackid=",
      Shadowfax: "https://deliveries.shadowfax.in/track/{}",
      XpressBees: "https://www.xpressbees.com/track?isawb=true&trackid={}",
    };

    // Default Shiprocket tracking
    const defaultUrl = "https://shiprocket.co/tracking/{}";

    const urlTemplate = trackingUrls[order.courierName] || defaultUrl;
    return urlTemplate.replace("{}", order.awbCode);
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <TruckIcon className="h-5 w-5" />
            Shiprocket Shipments
          </CardTitle>
          <CardDescription>
            Orders that have been shipped using Shiprocket
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchOrders()}
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {isLoadingOrders ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isErrorOrders ? (
          <div className="py-4">
            <ShiprocketErrorDisplay
              error={shippedOrdersError}
              onRetry={() => {
                refetchOrders();
                // Also try regenerating the token if the error is related to the token
                if (
                  String(shippedOrdersError).includes("token") ||
                  String(shippedOrdersError).includes("<!DOCTYPE") ||
                  String(shippedOrdersError).includes("<html")
                ) {
                  generateTokenMutation.mutate();
                }
              }}
            />
          </div>
        ) : shippedOrders?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium">No Shipments Found</h3>
            <p className="mt-1">
              No orders have been shipped using Shiprocket yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Courier</TableHead>
                  <TableHead>Tracking</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shippedOrders?.map((order: any) => {
                  const statusBadge = getStatusBadge(order.shippingStatus);
                  const trackingUrl = getTrackingUrl(order);

                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        #{order.id}
                        <div className="text-xs text-gray-500">
                          SR: {order.shiprocketOrderId}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(order.date).toLocaleDateString()}{" "}
                        <span className="text-xs text-gray-500 block">
                          {formatDistanceToNow(new Date(order.date), {
                            addSuffix: true,
                          })}
                        </span>
                      </TableCell>
                      <TableCell>
                        {order.courierName || "Not assigned"}
                      </TableCell>
                      <TableCell>
                        {order.awbCode ? (
                          <span className="font-mono text-xs">
                            {order.awbCode}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs">
                            Not assigned
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(order.total)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={statusBadge.variant}
                          className={`${statusBadge.bgColor} ${statusBadge.textColor} ${statusBadge.borderColor}`}
                        >
                          {order.shippingStatus || order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {trackingUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(trackingUrl, "_blank")}
                              className="flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" /> Track
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(`/admin/orders/${order.id}`, "_blank")
                            }
                            className="flex items-center gap-1"
                          >
                            <Search className="h-3 w-3" /> Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ShiprocketShipmentsPage = () => {
  return (
    <AdminLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ShiprocketShipments />
      </div>
    </AdminLayout>
  );
};

export default ShiprocketShipmentsPage;
