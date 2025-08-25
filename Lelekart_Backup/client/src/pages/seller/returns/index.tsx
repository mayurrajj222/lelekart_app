import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Loader2Icon,
  Package,
  ClockIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  TruckIcon,
  CheckIcon,
  XCircleIcon,
  XIcon,
  RefreshCcwIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  TagIcon,
  FileTextIcon,
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import { StatCard } from "@/components/dashboard/stat-card";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Order interface
interface Order {
  id: number;
  date: string;
  status: string;
  total: number;
  paymentMethod: string;
  customer: string;
  items: OrderItem[];
  sellerId?: number;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  shippingAddress?: any;
  returnReason?: string;
  returnDescription?: string;
  returnRequestDate?: string;
}

// OrderItem interface
interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  variantId?: number;
  product?: {
    id: number;
    name: string;
    images?: string;
    description?: string;
  };
}

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

// Format status for display
const formatStatus = (status: string) => {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Helper function to get product image
const getProductImage = (images: string) => {
  try {
    const imagesArray = JSON.parse(images);
    if (Array.isArray(imagesArray) && imagesArray.length > 0) {
      return imagesArray[0];
    }
  } catch {
    // If JSON parsing fails, try using it directly
    return images;
  }
  return "https://placehold.co/100x100?text=No+Image";
};

export default function SellerReturnManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for action dialogs
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionType, setActionType] = useState<string>("");
  const [actionNote, setActionNote] = useState("");

  // State for details dialog
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] =
    useState<Order | null>(null);

  // Fetch all orders for this seller
  const {
    data: orders,
    isLoading,
    error,
  } = useQuery<Order[]>({
    queryKey: ["/api/orders", user?.id],
    queryFn: async () => {
      const res = await fetch("/api/orders", { credentials: "include" });
      if (!res.ok) return [];
      const data = await res.json();

      // Fetch items for each order
      const ordersWithItems = await Promise.all(
        data.map(async (order: Order) => {
          try {
            // Fetch items
            const itemsRes = await fetch(`/api/orders/${order.id}/items`, {
              credentials: "include",
            });
            const items = itemsRes.ok ? await itemsRes.json() : [];

            return {
              ...order,
              items,
            };
          } catch (error) {
            console.error(`Error fetching items for order ${order.id}:`, error);
            return { ...order, items: [] };
          }
        })
      );

      return ordersWithItems || [];
    },
    enabled: !!user && user.role === "seller",
  });

  // Only show orders with these return statuses
  const allowedStatuses = [
    "marked_for_return",
    "approve_return",
    "process_return",
    "reject_return",
    "completed_return",
    "return_rejected",
    "return_approved",
  ];

  // Filter orders by return statuses
  const filteredOrders = (orders || []).filter((order) =>
    allowedStatuses.includes(order.status)
  );

  // Get status counts for stats
  const getStatusCounts = () => {
    const counts = {
      marked_for_return: 0,
      approve_return: 0,
      process_return: 0,
      completed_return: 0,
      reject_return: 0,
      return_rejected: 0,
      return_approved: 0,
    };
    filteredOrders.forEach((order) => {
      if (counts.hasOwnProperty(order.status)) {
        counts[order.status as keyof typeof counts]++;
      }
    });
    return counts;
  };

  const statusCounts = getStatusCounts();
  const totalCount = filteredOrders.length;

  if (!user || user.role !== "seller") {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-lg text-gray-600 mb-4">
          Access denied. Seller privileges required.
        </p>
      </div>
    );
  }

  // Mutation for handling return actions
  const handleReturnAction = useMutation({
    mutationFn: async ({
      orderId,
      action,
      note,
    }: {
      orderId: number;
      action: string;
      note?: string;
    }) => {
      const response = await fetch(`/api/seller/returns/${orderId}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ note }),
      });

      if (!response.ok) {
        throw new Error("Failed to process return action");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders", user?.id] });
      setActionDialogOpen(false);
      setSelectedOrder(null);
      setActionType("");
      setActionNote("");
      toast({
        title: "Success",
        description: "Return action processed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process return action",
        variant: "destructive",
      });
    },
  });

  const handleActionClick = (order: Order, action: string) => {
    setSelectedOrder(order);
    setActionType(action);
    setActionDialogOpen(true);
  };

  const handleActionSubmit = () => {
    if (!selectedOrder) return;

    handleReturnAction.mutate({
      orderId: selectedOrder.id,
      action: actionType,
      note: actionNote,
    });
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrderForDetails(order);
    setDetailsDialogOpen(true);
  };

  const getAvailableActions = (status: string) => {
    if (status === "marked_for_return") {
      return [
        {
          label: "Accept",
          action: "accept",
          icon: <CheckIcon className="mr-2 h-4 w-4" />,
          variant: "default" as const,
        },
        {
          label: "Reject",
          action: "reject",
          icon: <XIcon className="mr-2 h-4 w-4" />,
          variant: "destructive" as const,
        },
      ];
    }

    if (status === "approve_return") {
      return [
        {
          label: "Process Return",
          action: "process",
          icon: <RefreshCcwIcon className="mr-2 h-4 w-4" />,
          variant: "default" as const,
        },
      ];
    }

    // Handle return_approved and return_rejected statuses
    if (status === "return_approved") {
      return [
        {
          label: "Process Return",
          action: "process",
          icon: <RefreshCcwIcon className="mr-2 h-4 w-4" />,
          variant: "default" as const,
        },
      ];
    }

    if (status === "return_rejected") {
      return [
        {
          label: "Review Again",
          action: "review",
          icon: <RefreshCcwIcon className="mr-2 h-4 w-4" />,
          variant: "outline" as const,
        },
      ];
    }

    return [];
  };

  return (
    <SellerDashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight mb-6">
          Return Management
        </h1>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6">
          <StatCard
            title="Marked for Return"
            value={statusCounts.marked_for_return.toString()}
            icon={<AlertTriangleIcon className="h-4 w-4" />}
            description="Orders marked for return"
          />
          <StatCard
            title="Approved Returns"
            value={statusCounts.approve_return.toString()}
            icon={<CheckCircleIcon className="h-4 w-4" />}
            description="Returns approved"
          />
          <StatCard
            title="Processing Returns"
            value={statusCounts.process_return.toString()}
            icon={<TruckIcon className="h-4 w-4" />}
            description="Returns in process"
          />
          <StatCard
            title="Completed Returns"
            value={statusCounts.completed_return.toString()}
            icon={<CheckIcon className="h-4 w-4" />}
            description="Returns completed"
          />
          <StatCard
            title="Rejected Returns"
            value={statusCounts.reject_return.toString()}
            icon={<XCircleIcon className="h-4 w-4" />}
            description="Returns rejected"
          />
          <StatCard
            title="Return Approved"
            value={statusCounts.return_approved.toString()}
            icon={<CheckCircleIcon className="h-4 w-4" />}
            description="Returns approved"
          />
          <StatCard
            title="Return Rejected"
            value={statusCounts.return_rejected.toString()}
            icon={<XCircleIcon className="h-4 w-4" />}
            description="Returns rejected"
          />
        </div>
        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Orders with Return Status</CardTitle>
            <CardDescription>
              {totalCount} {totalCount === 1 ? "order" : "orders"} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : totalCount > 0 ? (
              <div className="overflow-x-auto">
                <Table>
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
                    {filteredOrders.map((order: Order) => {
                      const availableActions = getAvailableActions(
                        order.status
                      );
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            #{order.id}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <ClockIcon className="mr-2 h-4 w-4 text-gray-500" />
                              {format(new Date(order.date), "MMM d, yyyy")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Package className="mr-2 h-4 w-4 text-gray-500" />
                              {Array.isArray(order.items)
                                ? order.items.length
                                : 0}{" "}
                              item
                              {(Array.isArray(order.items)
                                ? order.items.length
                                : 0) === 1
                                ? ""
                                : "s"}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            ₹{order.total.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {formatPaymentMethod(order.paymentMethod)}
                          </TableCell>
                          <TableCell>{formatStatus(order.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {availableActions.map(
                                ({ label, action, icon, variant }) => (
                                  <Button
                                    key={action}
                                    variant={variant}
                                    size="sm"
                                    onClick={() =>
                                      handleActionClick(order, action)
                                    }
                                    disabled={handleReturnAction.isPending}
                                  >
                                    {icon}
                                    {label}
                                  </Button>
                                )
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(order)}
                              >
                                View Details
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex justify-center items-center h-32 text-gray-500">
                No orders with return status found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "accept" && "Accept Return Request"}
              {actionType === "reject" && "Reject Return Request"}
              {actionType === "process" && "Process Return"}
              {actionType === "review" && "Review Return Request"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "accept" &&
                "Accept this return request and proceed with the return process."}
              {actionType === "reject" &&
                "Reject this return request with a reason."}
              {actionType === "process" &&
                "Process this return and initiate refund/replacement."}
              {actionType === "review" &&
                "Review this rejected return request again."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="action-note">
                {actionType === "reject"
                  ? "Reason for Rejection"
                  : actionType === "review"
                    ? "Review Notes"
                    : "Notes (Optional)"}
              </Label>
              <Textarea
                id="action-note"
                placeholder={
                  actionType === "reject"
                    ? "Please provide a reason for rejecting this return"
                    : actionType === "review"
                      ? "Add notes for reviewing this return request"
                      : "Add any additional notes"
                }
                className="resize-none min-h-[100px] mt-2"
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setActionDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleActionSubmit}
                disabled={
                  ((actionType === "reject" || actionType === "review") &&
                    !actionNote) ||
                  handleReturnAction.isPending
                }
              >
                {handleReturnAction.isPending && (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirm
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileTextIcon className="h-5 w-5" />
              Return Details - Order #{selectedOrderForDetails?.id}
            </DialogTitle>
            <DialogDescription>
              Comprehensive information about this return request
            </DialogDescription>
          </DialogHeader>

          {selectedOrderForDetails && (
            <div className="space-y-6">
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          Order Date:
                        </span>
                        <span className="font-medium">
                          {format(
                            new Date(selectedOrderForDetails.date),
                            "PPP"
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TagIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          Order Total:
                        </span>
                        <span className="font-medium">
                          ₹{selectedOrderForDetails.total.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Items:</span>
                        <span className="font-medium">
                          {Array.isArray(selectedOrderForDetails.items)
                            ? selectedOrderForDetails.items.length
                            : 0}{" "}
                          item
                          {(Array.isArray(selectedOrderForDetails.items)
                            ? selectedOrderForDetails.items.length
                            : 0) === 1
                            ? ""
                            : "s"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          Payment Method:
                        </span>
                        <span className="font-medium">
                          {formatPaymentMethod(
                            selectedOrderForDetails.paymentMethod
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangleIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          Return Status:
                        </span>
                        <Badge variant="outline">
                          {formatStatus(selectedOrderForDetails.status)}
                        </Badge>
                      </div>
                      {selectedOrderForDetails.returnRequestDate && (
                        <div className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Return Requested:
                          </span>
                          <span className="font-medium">
                            {format(
                              new Date(
                                selectedOrderForDetails.returnRequestDate
                              ),
                              "PPP"
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Name:</span>
                        <span className="font-medium">
                          {selectedOrderForDetails.buyerName ||
                            selectedOrderForDetails.customer ||
                            "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MailIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Email:</span>
                        <span className="font-medium">
                          {selectedOrderForDetails.buyerEmail || "N/A"}
                        </span>
                      </div>
                      {selectedOrderForDetails.buyerPhone && (
                        <div className="flex items-center gap-2">
                          <PhoneIcon className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Phone:</span>
                          <span className="font-medium">
                            {selectedOrderForDetails.buyerPhone}
                          </span>
                        </div>
                      )}
                    </div>
                    {selectedOrderForDetails.shippingAddress && (
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <MapPinIcon className="h-4 w-4 text-gray-500 mt-0.5" />
                          <div>
                            <span className="text-sm text-gray-600">
                              Shipping Address:
                            </span>
                            <div className="font-medium text-sm">
                              {selectedOrderForDetails.shippingAddress.street}
                              <br />
                              {
                                selectedOrderForDetails.shippingAddress.city
                              }, {selectedOrderForDetails.shippingAddress.state}
                              <br />
                              {selectedOrderForDetails.shippingAddress.pincode}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Return Information */}
              {(selectedOrderForDetails.returnReason ||
                selectedOrderForDetails.returnDescription) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Return Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedOrderForDetails.returnReason && (
                        <div>
                          <Label className="text-sm text-gray-600">
                            Return Reason:
                          </Label>
                          <p className="font-medium mt-1">
                            {selectedOrderForDetails.returnReason}
                          </p>
                        </div>
                      )}
                      {selectedOrderForDetails.returnDescription && (
                        <div>
                          <Label className="text-sm text-gray-600">
                            Description:
                          </Label>
                          <p className="text-sm mt-1 bg-gray-50 p-3 rounded-md">
                            {selectedOrderForDetails.returnDescription}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Order Items */}
              {Array.isArray(selectedOrderForDetails.items) &&
                selectedOrderForDetails.items.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Order Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedOrderForDetails.items.map(
                          (item: OrderItem, index: number) => (
                            <div
                              key={item.id || index}
                              className="flex items-center gap-4 p-3 border rounded-lg"
                            >
                              {item.product?.images && (
                                <img
                                  src={getProductImage(item.product.images)}
                                  alt={item.product.name}
                                  className="w-16 h-16 object-cover rounded-md"
                                />
                              )}
                              <div className="flex-1">
                                <h4 className="font-medium">
                                  {item.product?.name ||
                                    `Product ${item.productId}`}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  Quantity: {item.quantity} | Price: ₹
                                  {item.price}
                                </p>
                                {item.variantId && (
                                  <p className="text-sm text-gray-500">
                                    Variant ID: {item.variantId}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-medium">
                                  ₹{(item.price * item.quantity).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailsDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SellerDashboardLayout>
  );
}
