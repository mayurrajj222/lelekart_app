import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Order } from "@shared/schema";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  RefreshCw,
  MoreVertical,
  Eye,
  Loader2,
  PackageCheck,
  Filter,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Printer,
  Truck,
  AlertCircle,
  XCircle,
  RefreshCcw,
  ImageIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define GST details type
interface GstDetails {
  gstRate: number;
  basePrice: number;
  gstAmount: number;
}

// Define Product type with GST details
interface AdminProduct {
  id: number;
  name: string;
  price: number;
  description: string;
  category: string;
  sellerId: number;
  approved: boolean;
  createdAt: string;
  imageUrl?: string;
  image_url?: string;
  images?: string;
  specifications?: string;
  gstDetails?: GstDetails;
}

// Define type for order items with product info
type OrderItemWithProduct = {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  product: AdminProduct;
  variant?: ProductVariant;
  variantId?: number;
};

interface ProductVariant {
  id: number;
  productId: number;
  sku: string;
  color: string;
  size: string;
  price: number;
  mrp?: number;
  stock: number;
  images?: string;
}

// Define shipping details type
interface ShippingDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  notes?: string;
}

// Define type for order with items
type OrderWithItems = Order & {
  items?: OrderItemWithProduct[];
  shippingDetails: string | ShippingDetails;
  shippingCharges?: number;
  discount?: number;
};

// Add a type guard for AdminShippingDetails
interface AdminShippingDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  notes?: string;
}

function isAdminShippingDetails(details: any): details is AdminShippingDetails {
  return (
    details &&
    typeof details === "object" &&
    "name" in details &&
    "address" in details
  );
}

export default function AdminOrders() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [viewOrder, setViewOrder] = useState<OrderWithItems | null>(null);
  const [dateFilter, setDateFilter] = useState<{
    start: string | null;
    end: string | null;
  }>({ start: null, end: null });
  const [returnInfo, setReturnInfo] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const shippingLabelRef = useRef<HTMLDivElement>(null);

  // Fetch orders data
  const {
    data: orders,
    isLoading,
    isError,
    refetch,
  } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: number;
      status: string;
    }) => {
      const res = await apiRequest("PUT", `/api/orders/${orderId}/status`, {
        status,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order updated",
        description: "Order status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch order details when viewing an order
  const fetchOrderDetails = async (orderId: number) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) throw new Error("Failed to fetch order details");
      const orderData = await res.json();
      setViewOrder(orderData);

      // If order has return status, fetch return information
      if (
        orderData.status === "marked_for_return" ||
        orderData.status === "approve_return" ||
        orderData.status === "reject_return" ||
        orderData.status === "process_return" ||
        orderData.status === "completed_return"
      ) {
        try {
          const returnRes = await fetch(`/api/returns?orderId=${orderId}`, {
            credentials: "include",
          });
          if (returnRes.ok) {
            const returnData = await returnRes.json();
            if (returnData.length > 0) {
              setReturnInfo(returnData[0]);
            }
          }
        } catch (error) {
          console.error("Error fetching return info:", error);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch order details",
        variant: "destructive",
      });
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    await updateStatusMutation.mutateAsync({ orderId, status: newStatus });

    // If we're viewing the order details, update the local state too
    if (viewOrder && viewOrder.id === orderId) {
      setViewOrder({ ...viewOrder, status: newStatus });
    }
  };

  // Filter orders
  const filteredOrders = orders
    ?.filter((order) => {
      // Status filter
      const matchesStatus = !statusFilter
        ? true
        : order.status === statusFilter;

      // Date filter
      let matchesDate = true;
      if (dateFilter.start) {
        const startDate = new Date(dateFilter.start);
        const orderDate = new Date(order.date);
        matchesDate = orderDate >= startDate;
      }
      if (dateFilter.end && matchesDate) {
        const endDate = new Date(dateFilter.end);
        endDate.setHours(23, 59, 59, 999); // End of the day
        const orderDate = new Date(order.date);
        matchesDate = orderDate <= endDate;
      }

      // Search filter (search by order ID, customer name, or email)
      const searchLower = search.trim().toLowerCase();
      let matchesSearch = true;
      if (searchLower) {
        // Remove leading '#' for order ID search
        const searchId = searchLower.startsWith("#")
          ? searchLower.slice(1)
          : searchLower;
        const idMatch = order.id.toString().includes(searchId);
        let nameMatch = false;
        let emailMatch = false;
        if (isAdminShippingDetails(order.shippingDetails)) {
          nameMatch = order.shippingDetails.name
            ?.toLowerCase()
            .includes(searchLower);
          emailMatch = order.shippingDetails.email
            ?.toLowerCase()
            .includes(searchLower);
        }
        matchesSearch = idMatch || nameMatch || emailMatch;
      }

      return matchesStatus && matchesDate && matchesSearch;
    })
    .sort((a, b) => {
      // Sort by newest first
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  // Order counts by status
  const orderCounts = orders?.reduce(
    (acc, order) => {
      acc.total += 1;
      const status = order.status || "unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    { total: 0 } as Record<string, number>
  ) || { total: 0 };

  // Calculate today's orders
  const todayOrders =
    orders?.filter((order) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const orderDate = new Date(order.date);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    }).length || 0;

  // Get status badge based on order status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="h-3 w-3 mr-1" /> Pending
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <RefreshCw className="h-3 w-3 mr-1" /> Processing
          </Badge>
        );
      case "shipped":
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            <Truck className="h-3 w-3 mr-1" /> Shipped
          </Badge>
        );
      case "delivered":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Delivered
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" /> Cancelled
          </Badge>
        );
      case "marked_for_return":
        return (
          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
            <RefreshCcw className="h-3 w-3 mr-1" /> Marked for Return
          </Badge>
        );
      case "approve_return":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Return Approved
          </Badge>
        );
      case "reject_return":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" /> Return Rejected
          </Badge>
        );
      case "process_return":
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            <Truck className="h-3 w-3 mr-1" /> Processing Return
          </Badge>
        );
      case "completed_return":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Return Completed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            {status}
          </Badge>
        );
    }
  };

  // Format payment method for display
  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case "cod":
        return "Cash on Delivery";
      case "card":
        return "Credit/Debit Card";
      case "upi":
        return "UPI";
      case "netbanking":
        return "Net Banking";
      default:
        return method;
    }
  };

  // Print invoice
  const printInvoice = () => {
    if (!invoiceRef.current || !viewOrder) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        title: "Error",
        description:
          "Could not open print window. Please check your browser settings.",
        variant: "destructive",
      });
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice #${viewOrder.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .invoice-container { max-width: 800px; margin: 0 auto; }
            .invoice-header { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .company-details { text-align: right; }
            .invoice-title { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
            .customer-details, .order-details { margin-bottom: 20px; }
            .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f9f9f9; }
            .total-section { margin-top: 20px; text-align: right; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
            @media print { @page { margin: 0.5cm; } }
          </style>
        </head>
        <body>
          ${invoiceRef.current.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  // Download invoice as PDF
  const downloadInvoice = async () => {
    if (!viewOrder) return;

    try {
      toast({
        title: "Preparing Invoice",
        description: "Your invoice is being generated...",
      });

      // Create a blob from the fetch response and open it in a new window
      const response = await fetch(`/api/orders/${viewOrder.id}/invoice`, {
        method: "GET",
        credentials: "include", // Important: Include credentials for authentication
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      // Get the PDF blob and create an object URL
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");

      toast({
        title: "Invoice Generated",
        description:
          "Your invoice has been opened in a new tab. You can save it from there.",
      });
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast({
        title: "Download Failed",
        description: "Failed to generate the invoice. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Download tax invoice as PDF
  const downloadTaxInvoice = async () => {
    if (!viewOrder) return;

    try {
      toast({
        title: "Preparing Tax Invoice",
        description: "Your tax invoice is being generated...",
      });

      // Create a blob from the fetch response and open it in a new window
      const response = await fetch(`/api/orders/${viewOrder.id}/tax-invoice`, {
        method: "GET",
        credentials: "include", // Important: Include credentials for authentication
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      // Get the PDF blob and create an object URL
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");

      toast({
        title: "Tax Invoice Generated",
        description:
          "Your tax invoice has been opened in a new tab. You can save it from there.",
      });
    } catch (error) {
      console.error("Error downloading tax invoice:", error);
      toast({
        title: "Download Failed",
        description: "Failed to generate the tax invoice. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Print shipping label
  const printShippingLabel = () => {
    if (!shippingLabelRef.current || !viewOrder) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        title: "Error",
        description:
          "Could not open print window. Please check your browser settings.",
        variant: "destructive",
      });
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Shipping Label #${viewOrder.id}</title>
          <style>
            body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; background: #fff; }
            .shipping-container { width: 100%; max-width: 800px; margin: 0 auto; }
            .meesho-header { background: #f43397; color: white; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; }
            .meesho-logo { font-size: 24px; font-weight: bold; letter-spacing: 1px; }
            .label-type { background: #333; color: white; padding: 3px 8px; border-radius: 4px; font-size: 12px; }
            .order-box { border: 2px solid #000; margin: 0; padding: 0; }
            .order-header { display: flex; justify-content: space-between; padding: 10px 15px; border-bottom: 1px solid #ddd; }
            .order-id { font-size: 18px; font-weight: bold; }
            .order-date { font-size: 14px; color: #666; }
            .shipping-info { display: flex; padding: 0; }
            .address-box { flex: 1; padding: 15px; }
            .address-box.to { border-right: 1px dashed #ccc; }
            .address-title { background: #f0f0f0; padding: 5px 10px; margin-bottom: 10px; font-weight: bold; border-left: 4px solid #f43397; }
            .address-content { font-size: 14px; line-height: 1.5; }
            .customer-name { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
            .barcode-section { text-align: center; padding: 15px; border-top: 1px solid #ddd; }
            .barcode-text { font-family: 'Courier New', monospace; font-size: 18px; letter-spacing: 2px; margin: 10px 0; font-weight: bold; }
            .product-details { padding: 15px; border-top: 1px solid #ddd; }
            .product-title { font-weight: bold; margin-bottom: 10px; }
            .product-table { width: 100%; border-collapse: collapse; font-size: 14px; }
            .product-table th { background: #f0f0f0; text-align: left; padding: 8px; }
            .product-table td { padding: 8px; border-bottom: 1px solid #eee; }
            .delivery-info { background: #f8f8f8; padding: 10px 15px; margin-top: 10px; border-top: 1px solid #ddd; font-size: 13px; }
            .cod-badge { display: inline-block; background: #ffeb3b; color: #000; padding: 2px 8px; border-radius: 3px; font-weight: bold; }
            .footer { text-align: center; font-size: 12px; color: #999; padding: 10px; border-top: 1px solid #eee; }
            @media print { @page { margin: 0; } body { margin: 0.5cm; } }
          </style>
        </head>
        <body>
          ${shippingLabelRef.current.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  // Download shipping label as PDF
  const downloadShippingLabel = () => {
    if (!viewOrder) return;

    try {
      // Open the PDF in a new tab
      window.open(
        `/api/orders/${viewOrder.id}/shipping-label?format=pdf`,
        "_blank"
      );

      toast({
        title: "Shipping Label Generated",
        description:
          "Your shipping label has been opened in a new tab. You can save it from there.",
      });
    } catch (error) {
      console.error("Error downloading shipping label:", error);
      toast({
        title: "Download Failed",
        description: "Failed to generate the shipping label. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-4 lg:px-6">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight">
            Order Management
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm lg:text-base">
            View and manage all customer orders
          </p>
        </div>

        {/* Order Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          {isLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">
                      <Skeleton className="h-3 sm:h-4 w-16 sm:w-24" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-6 sm:h-8 w-10 sm:w-12" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">
                    Total Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">
                    {orderCounts.total}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">
                    Pending
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">
                    {orderCounts.pending || 0}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">
                    Delivered
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">
                    {orderCounts.delivered || 0}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">
                    Today's Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">
                    {todayOrders}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3 sm:h-4 sm:w-4" />
            <Input
              placeholder="Search orders by ID, customer name, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 sm:pl-10 h-9 sm:h-10 text-xs sm:text-sm"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              value={statusFilter || "all"}
              onValueChange={(value) =>
                setStatusFilter(value === "all" ? null : value)
              }
            >
              <SelectTrigger className="w-full sm:w-[160px] lg:w-[180px] h-9 sm:h-10 text-xs sm:text-sm">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
              className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
            >
              {isLoading ? (
                <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              )}
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Orders Table */}
        {isLoading ? (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] sm:w-[100px]">
                    <Skeleton className="h-3 sm:h-4 w-12 sm:w-16" />
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">
                    <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">
                    <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-3 sm:h-4 w-12 sm:w-16" />
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
                  </TableHead>
                  <TableHead className="w-[80px] sm:w-[100px]">
                    <Skeleton className="h-3 sm:h-4 w-12 sm:w-16" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-3 sm:h-4 w-12 sm:w-16" />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-3 sm:h-4 w-12 sm:w-16" />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-3 sm:h-4 w-12 sm:w-16" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] sm:w-[100px] text-xs sm:text-sm">
                    Order ID
                  </TableHead>
                  <TableHead className="hidden sm:table-cell text-xs sm:text-sm">
                    Customer
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm">Date</TableHead>
                  <TableHead className="hidden sm:table-cell text-xs sm:text-sm">
                    Total
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm">Status</TableHead>
                  <TableHead className="hidden lg:table-cell text-xs sm:text-sm">
                    Payment
                  </TableHead>
                  <TableHead className="w-[80px] sm:w-[100px] text-xs sm:text-sm">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 sm:py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <PackageCheck className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                        <p className="text-muted-foreground text-xs sm:text-sm">
                          No orders found
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders?.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">
                        #{order.id}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] sm:max-w-[300px]">
                          <div className="font-medium truncate">
                            {isAdminShippingDetails(order.shippingDetails)
                              ? order.shippingDetails.name
                              : "Unknown Customer"}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {isAdminShippingDetails(order.shippingDetails)
                              ? order.shippingDetails.email
                              : "No email"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(order.date), "MMM dd, yyyy")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(order.date), "HH:mm")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          ₹{order.total?.toLocaleString() || "0"}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatPaymentMethod(order.paymentMethod)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => fetchOrderDetails(order.id)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                fetchOrderDetails(order.id);
                                setTimeout(() => {
                                  if (invoiceRef.current) {
                                    printInvoice();
                                  }
                                }, 1000);
                              }}
                            >
                              <Printer className="mr-2 h-4 w-4" />
                              Print Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                fetchOrderDetails(order.id);
                                setTimeout(() => {
                                  if (shippingLabelRef.current) {
                                    printShippingLabel();
                                  }
                                }, 1000);
                              }}
                            >
                              <Truck className="mr-2 h-4 w-4" />
                              Print Shipping Label
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                updateOrderStatus(order.id, "processing")
                              }
                              disabled={updateStatusMutation.isPending}
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              Mark Processing
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                updateOrderStatus(order.id, "shipped")
                              }
                              disabled={updateStatusMutation.isPending}
                            >
                              <Truck className="mr-2 h-4 w-4" />
                              Mark Shipped
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                updateOrderStatus(order.id, "delivered")
                              }
                              disabled={updateStatusMutation.isPending}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Mark Delivered
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Order Details Dialog */}
        <Dialog
          open={!!viewOrder}
          onOpenChange={() => {
            setViewOrder(null);
            setReturnInfo(null);
            setSelectedImage(null);
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
              <DialogDescription>
                Order #{viewOrder?.id} - {viewOrder?.date}
              </DialogDescription>
            </DialogHeader>

            {viewOrder && (
              <div className="space-y-6">
                {/* Order Status */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Order Status</h3>
                    <div className="mt-2">
                      {getStatusBadge(viewOrder.status)}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">₹{viewOrder.total}</p>
                    <p className="text-sm text-gray-500">
                      {formatPaymentMethod(viewOrder.paymentMethod)}
                    </p>
                  </div>
                </div>

                {/* Return Information */}
                {returnInfo && (
                  <div className="border rounded-lg p-4 bg-orange-50">
                    <h3 className="text-lg font-semibold text-orange-800 mb-3 flex items-center">
                      <RefreshCcw className="h-5 w-5 mr-2" />
                      Return Request Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Return Details
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">Reason:</span>{" "}
                            {returnInfo.reasonText}
                          </div>
                          <div>
                            <span className="font-medium">Description:</span>
                            <p className="text-gray-600 mt-1">
                              {returnInfo.description}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">Request Type:</span>{" "}
                            {returnInfo.requestType}
                          </div>
                          <div>
                            <span className="font-medium">Submitted:</span>{" "}
                            {new Date(
                              returnInfo.createdAt
                            ).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* Return Images */}
                      {returnInfo.mediaUrls &&
                        returnInfo.mediaUrls.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">
                              Return Images
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              {returnInfo.mediaUrls.map(
                                (url: string, index: number) => (
                                  <div
                                    key={index}
                                    className="relative cursor-pointer"
                                    onClick={() => setSelectedImage(url)}
                                  >
                                    <img
                                      src={url}
                                      alt={`Return image ${index + 1}`}
                                      className="w-full h-24 object-cover rounded border"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all rounded flex items-center justify-center">
                                      <ImageIcon className="h-6 w-6 text-white opacity-0 hover:opacity-100" />
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                )}

                {/* Customer Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Customer Information
                  </h3>
                  {isAdminShippingDetails(viewOrder.shippingDetails) ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="font-medium">
                          {viewOrder.shippingDetails.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">
                          {viewOrder.shippingDetails.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">
                          {viewOrder.shippingDetails.phone}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="font-medium">
                          {viewOrder.shippingDetails.address},{" "}
                          {viewOrder.shippingDetails.city},{" "}
                          {viewOrder.shippingDetails.state}{" "}
                          {viewOrder.shippingDetails.zipCode}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      Shipping details not available
                    </p>
                  )}
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Order Items</h3>
                  <div className="space-y-3">
                    {viewOrder.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-4 p-3 border rounded-lg"
                      >
                        <img
                          src={
                            item.product.image ||
                            "https://placehold.co/100x100?text=No+Image"
                          }
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium">{item.product.name}</h4>
                          <p className="text-sm text-gray-500">
                            Quantity: {item.quantity} × ₹{item.price}
                          </p>
                          <p className="text-sm text-gray-500">
                            Seller: {item.product.sellerName || "Unknown"}
                          </p>
                          {/* Display variant information if available */}
                          {item.variant && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.variant.color && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  Color: {item.variant.color}
                                </span>
                              )}
                              {item.variant.size && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  Size:{" "}
                                  {(() => {
                                    // Handle size display - if it's a range, show a more user-friendly message
                                    const sizeValue = item.variant.size;
                                    if (sizeValue && sizeValue.includes(",")) {
                                      // This is a size range - we should show the selected size
                                      // For now, show the first size as a fallback
                                      // TODO: Store selected size in order items for better accuracy
                                      const sizes = sizeValue
                                        .split(",")
                                        .map((s) => s.trim());
                                      return sizes[0];
                                    }
                                    return sizeValue;
                                  })()}
                                </span>
                              )}
                              {item.variant.sku && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  SKU: {item.variant.sku}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            ₹{item.quantity * item.price}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (invoiceRef.current) {
                        printInvoice();
                      }
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Print Invoice
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (shippingLabelRef.current) {
                        printShippingLabel();
                      }
                    }}
                  >
                    <Truck className="mr-2 h-4 w-4" />
                    Print Shipping Label
                  </Button>

                  {/* Return Action Buttons */}
                  {returnInfo && (
                    <>
                      <Button
                        variant="default"
                        onClick={() =>
                          updateOrderStatus(viewOrder.id, "approve_return")
                        }
                        disabled={updateStatusMutation.isPending}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Approve Return
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() =>
                          updateOrderStatus(viewOrder.id, "reject_return")
                        }
                        disabled={updateStatusMutation.isPending}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject Return
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          updateOrderStatus(viewOrder.id, "process_return")
                        }
                        disabled={updateStatusMutation.isPending}
                      >
                        <Truck className="mr-2 h-4 w-4" />
                        Process Return
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Image Viewer Dialog */}
        <Dialog
          open={!!selectedImage}
          onOpenChange={() => setSelectedImage(null)}
        >
          <DialogContent className="max-w-3xl p-0 overflow-hidden">
            <div className="relative w-full max-h-[80vh] overflow-auto">
              {selectedImage && (
                <img
                  src={selectedImage}
                  alt="Return image"
                  className="w-full h-auto"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Hidden divs for printing */}
        <div style={{ display: "none" }}>
          <div ref={invoiceRef} className="p-8">
            {/* Invoice content will be rendered here */}
          </div>
          <div ref={shippingLabelRef} className="p-8">
            {/* Shipping label content will be rendered here */}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
