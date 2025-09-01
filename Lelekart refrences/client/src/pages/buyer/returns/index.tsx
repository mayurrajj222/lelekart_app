import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarIcon,
  Loader2Icon,
  RefreshCcwIcon,
  Package,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import React from "react";

// Order interface
interface Order {
  id: number;
  date: string;
  status: string;
  total: number;
  paymentMethod: string;
  items: any[];
}

// Return status badge colors
const statusColors = {
  marked_for_return: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approve_return: "bg-blue-100 text-blue-800 border-blue-200",
  process_return: "bg-purple-100 text-purple-800 border-purple-200",
  completed_return: "bg-green-100 text-green-800 border-green-200",
  reject_return: "bg-red-100 text-red-800 border-red-200",
};

// Format status labels for display
const formatStatus = (status: string) => {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Format payment method
const formatPaymentMethod = (method: string) => {
  switch (method) {
    case "cod":
      return "Cash on Delivery";
    case "online":
      return "Online Payment";
    default:
      return method.charAt(0).toUpperCase() + method.slice(1);
  }
};

export default function ReturnsList() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user's orders
  const {
    data: orders,
    isLoading,
    error,
  } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders", { credentials: "include" });
      if (!res.ok) return [];
      const data = await res.json();
      return data || [];
    },
    enabled: !!user,
  });

  // Only show orders with these return statuses
  const allowedStatuses = [
    "marked_for_return",
    "approve_return",
    "reject_return",
    "process_return",
    "completed_return",
  ];

  const filteredOrders = (orders || []).filter((order) =>
    allowedStatuses.includes(order.status)
  );

  useEffect(() => {
    if (error) {
      toast({
        title: "Error fetching orders",
        description: "Could not load your orders. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-lg text-gray-600 mb-4">
          Please login to view your returns
        </p>
        <Button asChild>
          <Link to="/auth">Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F5E4]">
      <DashboardLayout>
        <div className="container max-w-6xl mx-auto py-6 px-2 sm:px-4 lg:px-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6 sm:mb-8 text-center sm:text-left">
            My Returns
          </h1>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredOrders.length > 0 ? (
            <>
              {/* Desktop Table Layout */}
              <div className="hidden sm:block">
                <Card className="overflow-x-auto rounded-lg">
                  <CardHeader className="px-4 sm:px-6">
                    <CardTitle className="text-lg sm:text-xl">
                      Orders with Return Status
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base">
                      {filteredOrders.length} order
                      {filteredOrders.length === 1 ? "" : "s"} with return status
                      found
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-0">
                    <div className="w-full overflow-x-auto">
                      <Table className="min-w-[700px] text-xs sm:text-sm">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Payment</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredOrders.map((order: Order) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-medium">
                                #{order.id}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                                  {format(new Date(order.date), "MMM d, yyyy")}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <Package className="mr-2 h-4 w-4 text-gray-500" />
                                  {order.items?.length || 0} item
                                  {(order.items?.length || 0) === 1 ? "" : "s"}
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                ₹{order.total.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                {formatPaymentMethod(order.paymentMethod)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={`${statusColors[order.status as keyof typeof statusColors] || ""} font-normal text-xs sm:text-sm px-2 py-1 rounded`}
                                >
                                  {formatStatus(order.status)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  asChild
                                  variant="outline"
                                  size="sm"
                                  className="w-full sm:w-auto text-xs sm:text-sm px-2 py-1"
                                >
                                  <Link to={`/orders/${order.id}`}>
                                    View Order
                                  </Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
              {/* Mobile Card/List Layout */}
              <div className="sm:hidden space-y-4">
                {filteredOrders.map((order: Order) => (
                  <Card key={order.id} className="p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-base">
                        Order #{order.id}
                      </span>
                      <Badge
                        className={`${statusColors[order.status as keyof typeof statusColors] || ""} font-normal text-xs px-2 py-1 rounded`}
                      >
                        {formatStatus(order.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mb-1">
                      <CalendarIcon className="mr-1 h-4 w-4" />
                      {format(new Date(order.date), "MMM d, yyyy")}
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mb-1">
                      <Package className="mr-1 h-4 w-4" />
                      {order.items?.length || 0} item
                      {(order.items?.length || 0) === 1 ? "" : "s"}
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                      <span className="text-sm">
                        <span className="font-medium">Total:</span> ₹
                        {order.total.toFixed(2)}
                      </span>
                      <span className="text-sm">
                        <span className="font-medium">Payment:</span>{" "}
                        {formatPaymentMethod(order.paymentMethod)}
                      </span>
                    </div>
                    <div className="mt-2">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-full text-xs px-2 py-1"
                      >
                        <Link to={`/orders/${order.id}`}>View Order</Link>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center px-2">
              <RefreshCcwIcon className="h-8 w-8 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                No orders with return status found
              </h3>
              <p className="text-gray-500 mt-1 text-sm">
                You have no orders with return statuses (marked_for_return,
                approve_return, reject_return, process_return, completed_return).
              </p>
              <Button asChild variant="outline" className="mt-4 w-full max-w-xs">
                <Link to="/orders">View All Orders</Link>
              </Button>
            </div>
          )}
        </div>
      </DashboardLayout>
    </div>
  );
}
