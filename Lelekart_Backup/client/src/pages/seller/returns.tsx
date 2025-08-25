import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowUpDown,
  Search,
  Filter,
  Calendar,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Define status badge colors
const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-300"
        >
          Pending
        </Badge>
      );
    case "approved":
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-300"
        >
          Approved
        </Badge>
      );
    case "rejected":
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-300"
        >
          Rejected
        </Badge>
      );
    case "refunded":
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-300"
        >
          Refunded
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function SellerReturnsPage() {
  const [currentTab, setCurrentTab] = useState("all");
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("last30");

  // Fetch returns data
  const { data: returnsData, isLoading } = useQuery({
    queryKey: ["/api/seller/returns", currentTab, dateRange],
    queryFn: async () => {
      const res = await fetch(
        `/api/seller/returns?status=${currentTab !== "all" ? currentTab : ""}&dateRange=${dateRange}`
      );
      if (!res.ok) {
        throw new Error("Failed to fetch returns");
      }
      return res.json();
    },
  });

  // Filter returns by search query
  const filteredReturns =
    returnsData?.filter((item: any) => {
      if (!searchQuery) return true;

      const query = searchQuery.toLowerCase();
      return (
        item.orderId?.toString().includes(query) ||
        item.productName?.toLowerCase().includes(query) ||
        item.customerName?.toLowerCase().includes(query) ||
        item.reason?.toLowerCase().includes(query)
      );
    }) || [];

  const handleViewDetails = (returnItem: any) => {
    setSelectedReturn(returnItem);
    setShowDetailDialog(true);
  };

  const handleAction = (returnItem: any, action: "approve" | "reject") => {
    setSelectedReturn(returnItem);
    setActionType(action);
    setShowActionDialog(true);
  };

  const submitAction = async () => {
    if (!selectedReturn || !actionType) return;

    try {
      const response = await fetch(`/api/seller/returns/${selectedReturn.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: actionType === "approve" ? "approved" : "rejected",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update return status");
      }

      // Close dialog and refetch data
      setShowActionDialog(false);
      // Invalidate queries to refresh data
    } catch (error) {
      console.error("Error updating return status:", error);
    }
  };

  return (
    <SellerDashboardLayout>
      <div className="container mx-auto py-4 md:py-6 px-4 md:px-0">
        <div className="mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">
            Returns Management
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            View and manage product returns from customers
          </p>
        </div>

        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search returns..."
                className="pl-8 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full sm:w-[180px] text-sm">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last7">Last 7 days</SelectItem>
                <SelectItem value="last30">Last 30 days</SelectItem>
                <SelectItem value="last90">Last 90 days</SelectItem>
                <SelectItem value="year">This year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="sm:w-auto w-full text-sm">
            <Filter className="mr-2 h-4 w-4" />
            Advanced Filters
          </Button>
        </div>

        <Tabs
          defaultValue="all"
          value={currentTab}
          onValueChange={setCurrentTab}
        >
          <div className="overflow-x-auto mb-4">
            <TabsList className="grid w-full grid-cols-5 min-w-max">
              <TabsTrigger value="all" className="text-xs md:text-sm">
                All Returns
              </TabsTrigger>
              <TabsTrigger value="pending" className="text-xs md:text-sm">
                Pending
              </TabsTrigger>
              <TabsTrigger value="approved" className="text-xs md:text-sm">
                Approved
              </TabsTrigger>
              <TabsTrigger value="rejected" className="text-xs md:text-sm">
                Rejected
              </TabsTrigger>
              <TabsTrigger value="refunded" className="text-xs md:text-sm">
                Refunded
              </TabsTrigger>
            </TabsList>
          </div>

          <Card>
            <CardContent className="p-0">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px] text-sm">
                        Return ID
                      </TableHead>
                      <TableHead className="text-sm">Order ID</TableHead>
                      <TableHead className="text-sm">Product</TableHead>
                      <TableHead className="text-sm">Customer</TableHead>
                      <TableHead className="text-sm">Return Date</TableHead>
                      <TableHead className="text-sm">Reason</TableHead>
                      <TableHead className="text-sm">Status</TableHead>
                      <TableHead className="text-right text-sm">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredReturns.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <p className="text-muted-foreground text-sm">
                            No returns found
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReturns.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium text-sm">
                            #{item.id}
                          </TableCell>
                          <TableCell className="text-sm">
                            #{item.orderId}
                          </TableCell>
                          <TableCell className="text-sm">
                            {item.productName}
                          </TableCell>
                          <TableCell className="text-sm">
                            {item.customerName}
                          </TableCell>
                          <TableCell className="text-sm">
                            {item.returnDate
                              ? format(new Date(item.returnDate), "dd MMM yyyy")
                              : "-"}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm">
                            {item.reason}
                          </TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleViewDetails(item)}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                {item.status === "pending" && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleAction(item, "approve")
                                      }
                                    >
                                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                      Approve Return
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleAction(item, "reject")
                                      }
                                    >
                                      <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                      Reject Return
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3 p-4">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : filteredReturns.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm">
                      No returns found
                    </p>
                  </div>
                ) : (
                  filteredReturns.map((item: any) => (
                    <div
                      key={item.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-sm">
                              #{item.id}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              Order #{item.orderId}
                            </span>
                          </div>
                          <h3 className="font-medium text-sm mb-1">
                            {item.productName}
                          </h3>
                          <p className="text-muted-foreground text-xs">
                            {item.customerName}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(item.status)}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleViewDetails(item)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {item.status === "pending" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleAction(item, "approve")
                                    }
                                  >
                                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                    Approve Return
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleAction(item, "reject")}
                                  >
                                    <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                    Reject Return
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-muted-foreground">
                            Return Date:
                          </span>
                          <p className="font-medium">
                            {item.returnDate
                              ? format(new Date(item.returnDate), "dd MMM yyyy")
                              : "-"}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Reason:</span>
                          <p className="font-medium truncate">{item.reason}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </Tabs>
      </div>

      {/* Return Details Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">
              Return Details
            </DialogTitle>
            <DialogDescription className="text-sm">
              Return #{selectedReturn?.id} - Order #{selectedReturn?.orderId}
            </DialogDescription>
          </DialogHeader>

          {selectedReturn && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <div>
                <h3 className="text-xs md:text-sm font-medium text-muted-foreground mb-2">
                  Product Information
                </h3>
                <div className="bg-muted p-3 md:p-4 rounded-lg space-y-3">
                  <div className="flex items-center gap-3">
                    {selectedReturn.productImage && (
                      <img
                        src={selectedReturn.productImage}
                        alt={selectedReturn.productName}
                        className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-md border flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm md:text-base">
                        {selectedReturn.productName}
                      </p>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        SKU: {selectedReturn.productSku}
                      </p>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Quantity: {selectedReturn.quantity}
                      </p>
                    </div>
                  </div>
                </div>

                <h3 className="text-xs md:text-sm font-medium text-muted-foreground mt-4 mb-2">
                  Return Reason
                </h3>
                <div className="bg-muted p-3 md:p-4 rounded-lg">
                  <p className="text-sm md:text-base">
                    {selectedReturn.reason}
                  </p>
                </div>

                {selectedReturn.images && selectedReturn.images.length > 0 && (
                  <>
                    <h3 className="text-xs md:text-sm font-medium text-muted-foreground mt-4 mb-2">
                      Return Images
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedReturn.images.map((img: string, idx: number) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Return image ${idx + 1}`}
                          className="w-full aspect-square object-cover rounded-md border"
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div>
                <h3 className="text-xs md:text-sm font-medium text-muted-foreground mb-2">
                  Customer Information
                </h3>
                <div className="bg-muted p-3 md:p-4 rounded-lg space-y-3">
                  <div>
                    <p className="font-medium text-sm md:text-base">
                      {selectedReturn.customerName}
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {selectedReturn.customerEmail}
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {selectedReturn.customerPhone}
                    </p>
                  </div>
                </div>

                <h3 className="text-xs md:text-sm font-medium text-muted-foreground mt-4 mb-2">
                  Return Status
                </h3>
                <div className="bg-muted p-3 md:p-4 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="font-medium text-sm md:text-base">
                      Current Status:
                    </span>
                    {getStatusBadge(selectedReturn.status)}
                  </div>

                  <div className="mt-4">
                    <span className="text-xs md:text-sm font-medium">
                      Return Timeline:
                    </span>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="h-3 w-3 md:h-4 md:w-4 mt-0.5 rounded-full bg-green-500 flex-shrink-0"></div>
                        <div>
                          <p className="text-xs md:text-sm font-medium">
                            Return Requested
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {selectedReturn.returnDate
                              ? format(
                                  new Date(selectedReturn.returnDate),
                                  "dd MMM yyyy, h:mm a"
                                )
                              : "-"}
                          </p>
                        </div>
                      </div>

                      {selectedReturn.reviewedDate && (
                        <div className="flex items-start gap-2">
                          <div className="h-3 w-3 md:h-4 md:w-4 mt-0.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                          <div>
                            <p className="text-xs md:text-sm font-medium">
                              Return Reviewed
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(
                                new Date(selectedReturn.reviewedDate),
                                "dd MMM yyyy, h:mm a"
                              )}
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedReturn.refundDate && (
                        <div className="flex items-start gap-2">
                          <div className="h-3 w-3 md:h-4 md:w-4 mt-0.5 rounded-full bg-green-500 flex-shrink-0"></div>
                          <div>
                            <p className="text-xs md:text-sm font-medium">
                              Refund Processed
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(
                                new Date(selectedReturn.refundDate),
                                "dd MMM yyyy, h:mm a"
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {selectedReturn.status === "pending" && (
                  <div className="mt-4 md:mt-6 space-y-2 sm:space-y-0 sm:space-x-2 flex flex-col sm:flex-row">
                    <Button
                      variant="success"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm"
                      onClick={() => {
                        setShowDetailDialog(false);
                        handleAction(selectedReturn, "approve");
                      }}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Approve Return
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1 text-sm"
                      onClick={() => {
                        setShowDetailDialog(false);
                        handleAction(selectedReturn, "reject");
                      }}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject Return
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">
              {actionType === "approve"
                ? "Approve Return Request"
                : "Reject Return Request"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {actionType === "approve"
                ? "The customer will be informed that their return has been approved. You will need to process the refund separately once the item is received."
                : "Please provide a reason for rejecting this return request. The customer will be notified of your decision."}
            </DialogDescription>
          </DialogHeader>

          {actionType === "reject" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="rejectionReason"
                  className="text-sm font-medium"
                >
                  Rejection Reason
                </label>
                <Textarea
                  id="rejectionReason"
                  placeholder="Enter the reason for rejecting this return..."
                  rows={4}
                  className="text-sm"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowActionDialog(false)}
              className="text-sm"
            >
              Cancel
            </Button>
            <Button
              variant={actionType === "approve" ? "default" : "destructive"}
              onClick={submitAction}
              className="text-sm"
            >
              {actionType === "approve" ? "Approve Return" : "Reject Return"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SellerDashboardLayout>
  );
}
