import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  Filter,
  FileText,
  HelpCircle,
  MoreHorizontal,
  FileDown,
  Search,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "processing":
      return (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-300"
        >
          Processing
        </Badge>
      );
    case "paid":
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-300"
        >
          Paid
        </Badge>
      );
    case "failed":
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-300"
        >
          Failed
        </Badge>
      );
    case "pending":
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-300"
        >
          Pending
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function SellerPaymentsPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("last30");
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showFAQDialog, setShowFAQDialog] = useState(false);
  const [showSupportDialog, setShowSupportDialog] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    minAmount: "",
    maxAmount: "",
    type: "all",
    dateStart: "",
    dateEnd: "",
  });
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [payoutSchedule, setPayoutSchedule] = useState<{
    cycle: string;
    day: string;
  }>({ cycle: "Weekly", day: "Monday" });
  const [tempSchedule, setTempSchedule] = useState<{
    cycle: string;
    day: string;
  }>(payoutSchedule);
  const [showFilters, setShowFilters] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawError, setWithdrawError] = useState("");

  // Fetch payments summary
  const { data: summaryData, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["/api/seller/payments-summary"],
    queryFn: async () => {
      const res = await fetch("/api/seller/payments-summary");
      if (!res.ok) {
        throw new Error("Failed to fetch payments summary");
      }
      return res.json();
    },
  });

  // Fetch payments data
  const { data: paymentsData, isLoading: isPaymentsLoading } = useQuery({
    queryKey: ["/api/seller/payments", currentTab, dateRange],
    queryFn: async () => {
      const status = currentTab !== "all" ? currentTab : "";
      const res = await fetch(
        `/api/seller/payments?status=${status}&dateRange=${dateRange}`
      );
      if (!res.ok) {
        throw new Error("Failed to fetch payments data");
      }
      return res.json();
    },
  });

  // Filter payments by search query
  const filteredPayments =
    paymentsData?.filter((payment: any) => {
      if (!searchQuery) return true;

      const query = searchQuery.toLowerCase();
      return (
        payment.id?.toString().includes(query) ||
        payment.transactionId?.toLowerCase().includes(query) ||
        payment.amount?.toString().includes(query)
      );
    }) || [];

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleViewPaymentDetails = (payment: any) => {
    setSelectedPayment(payment);
    setShowDetailDialog(true);
  };

  const savePayoutScheduleMutation = useMutation({
    mutationFn: async (schedule: { cycle: string; day: string }) => {
      const res = await fetch("/api/seller/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutSchedule: JSON.stringify(schedule) }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save payout schedule");
      }
      return res.json();
    },
  });

  return (
    <SellerDashboardLayout>
      <div className="container mx-auto py-1 md:py-2 px-4 md:px-0">
        <div className="mb-2 md:mb-3">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">
            Payments
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            View and manage your payment transactions
          </p>
        </div>

        {/* Purchase Price Information */}
        <Card className="mb-2 md:mb-3 border-primary/20 bg-primary/5">
          <CardContent className="pt-4 md:pt-6 pb-4 md:pb-6">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="p-2 md:p-3 rounded-full bg-primary/10">
                <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm md:text-base font-medium mb-1">
                  Vendor Payment Information
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  You receive payments based on the{" "}
                  <strong>Purchase Price</strong> of your products. For each
                  product sold, you will be paid exactly the amount specified in
                  the Purchase Price field, regardless of the final selling
                  price to the customer.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 mb-2 md:mb-3">
          {/* Available Balance */}
          <Card>
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="text-xs md:text-sm font-medium">
                Available Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold">
                {isSummaryLoading ? (
                  <div className="h-6 md:h-7 w-20 md:w-24 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  formatCurrency(summaryData?.availableBalance || 0)
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Available for withdrawal
              </p>
            </CardContent>
            <CardFooter className="pt-0">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs md:text-sm"
                onClick={() => setShowWithdrawDialog(true)}
              >
                Withdraw Funds
              </Button>
            </CardFooter>
          </Card>

          {/* Pending Balance */}
          <Card>
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="text-xs md:text-sm font-medium">
                Pending Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold">
                {isSummaryLoading ? (
                  <div className="h-6 md:h-7 w-20 md:w-24 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  formatCurrency(summaryData?.pendingBalance || 0)
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Will be available after order processing
              </p>
            </CardContent>
            <CardFooter className="pt-0">
              <div className="w-full">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Releasing soon</span>
                  <span>{formatCurrency(summaryData?.releasingSoon || 0)}</span>
                </div>
                <Progress value={60} className="h-2" />
              </div>
            </CardFooter>
          </Card>

          {/* Lifetime Earnings */}
          <Card>
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="text-xs md:text-sm font-medium">
                Lifetime Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold">
                {isSummaryLoading ? (
                  <div className="h-6 md:h-7 w-20 md:w-24 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  formatCurrency(summaryData?.lifetimeEarnings || 0)
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total earnings to date
              </p>
            </CardContent>
            <CardFooter className="pt-0">
              <div className="flex items-center text-xs md:text-sm text-green-600">
                <ArrowUp className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                <span>{summaryData?.growthRate || 0}% from last month</span>
              </div>
            </CardFooter>
          </Card>

          {/* Next Payout */}
          <Card>
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="text-xs md:text-sm font-medium">
                Next Payout
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold">
                {isSummaryLoading ? (
                  <div className="h-6 md:h-7 w-20 md:w-24 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  formatCurrency(summaryData?.nextPayoutAmount || 0)
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Estimated on{" "}
                {summaryData?.nextPayoutDate
                  ? format(new Date(summaryData.nextPayoutDate), "dd MMM yyyy")
                  : "loading..."}
              </p>
            </CardContent>
            <CardFooter className="pt-0">
              <Button
                variant="link"
                size="sm"
                className="px-0 h-auto text-primary text-xs md:text-sm"
                onClick={() => setShowScheduleDialog(true)}
              >
                <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                View payout schedule
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Payment Transactions */}
        <div className="mb-4 md:mb-6">
          <div className="mb-4 flex flex-col gap-3 md:gap-4">
            {/* Mobile Filter Toggle */}
            <div className="md:hidden">
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => setShowFilters(!showFilters)}
              >
                <span className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters & Search
                </span>
                {showFilters ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Search and Filters */}
            <div
              className={`${showFilters ? "block" : "hidden"} md:flex flex-col sm:flex-row justify-between gap-3 md:gap-4`}
            >
              <div className="flex flex-col sm:flex-row gap-2 md:gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search payments..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <Calendar className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last7">Last 7 days</SelectItem>
                    <SelectItem value="last30">Last 30 days</SelectItem>
                    <SelectItem value="last90">Last 90 days</SelectItem>
                    <SelectItem value="year">This year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilterDialog(true)}
                  className="flex-1 md:flex-none"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Filter</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Create CSV content for export
                    const csvHeader =
                      [
                        "Transaction ID",
                        "Date",
                        "Type",
                        "Description",
                        "Amount",
                        "Status",
                      ].join(",") + "\n";
                    const csvRows = filteredPayments
                      .map((payment: any) => {
                        return [
                          payment.transactionId,
                          format(new Date(payment.date), "yyyy-MM-dd"),
                          payment.type,
                          `"${payment.description?.replace(/"/g, '""') || ""}"`,
                          payment.amount,
                          payment.status,
                        ].join(",");
                      })
                      .join("\n");

                    const csvContent = csvHeader + csvRows;

                    // Create a blob and download link
                    const blob = new Blob([csvContent], {
                      type: "text/csv;charset=utf-8;",
                    });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.setAttribute("href", url);
                    link.setAttribute(
                      "download",
                      `payment-transactions-${format(new Date(), "yyyy-MM-dd")}.csv`
                    );
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex-1 md:flex-none"
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </div>
            </div>
          </div>

          <Tabs
            defaultValue="all"
            value={currentTab}
            onValueChange={setCurrentTab}
          >
            <div className="overflow-x-auto">
              <TabsList className="mb-4 min-w-max">
                <TabsTrigger value="all" className="text-xs md:text-sm">
                  All Transactions
                </TabsTrigger>
                <TabsTrigger value="pending" className="text-xs md:text-sm">
                  Pending
                </TabsTrigger>
                <TabsTrigger value="processing" className="text-xs md:text-sm">
                  Processing
                </TabsTrigger>
                <TabsTrigger value="paid" className="text-xs md:text-sm">
                  Paid
                </TabsTrigger>
                <TabsTrigger value="failed" className="text-xs md:text-sm">
                  Failed
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isPaymentsLoading ? (
                        Array.from({ length: 5 }).map((_, idx) => (
                          <TableRow key={idx}>
                            <TableCell colSpan={7} className="py-3">
                              <div className="h-10 bg-gray-100 animate-pulse rounded"></div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : filteredPayments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                              <CreditCard className="h-10 w-10 mb-2" />
                              <p>No payment transactions found</p>
                              <p className="text-sm">
                                Try adjusting your filters or search term
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPayments.map((payment: any) => (
                          <TableRow key={payment.id}>
                            <TableCell className="font-medium">
                              {payment.transactionId}
                            </TableCell>
                            <TableCell>
                              {format(new Date(payment.date), "dd MMM yyyy")}
                            </TableCell>
                            <TableCell>
                              {payment.type === "payout" ? (
                                <Badge
                                  variant="outline"
                                  className="bg-blue-50 text-blue-700 border-blue-300"
                                >
                                  Payout
                                </Badge>
                              ) : payment.type === "order" ? (
                                <Badge
                                  variant="outline"
                                  className="bg-green-50 text-green-700 border-green-300"
                                >
                                  Order
                                </Badge>
                              ) : (
                                <Badge variant="outline">{payment.type}</Badge>
                              )}
                            </TableCell>
                            <TableCell className="max-w-[240px] truncate">
                              {payment.description}
                            </TableCell>
                            <TableCell className="text-right">
                              <span
                                className={
                                  payment.amount < 0
                                    ? "text-red-600"
                                    : "text-green-600"
                                }
                              >
                                {payment.amount < 0 ? "-" : "+"}
                                {formatCurrency(Math.abs(payment.amount))}
                              </span>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(payment.status)}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleViewPaymentDetails(payment)
                                    }
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  {payment.type === "payout" &&
                                    payment.status === "paid" && (
                                      <DropdownMenuItem>
                                        <FileText className="mr-2 h-4 w-4" />
                                        Download Receipt
                                      </DropdownMenuItem>
                                    )}
                                  {payment.status === "failed" && (
                                    <DropdownMenuItem className="text-red-600">
                                      <AlertCircle className="mr-2 h-4 w-4" />
                                      View Issue
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Mobile Payment Cards */}
            <div className="md:hidden space-y-3">
              {isPaymentsLoading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <Card key={idx} className="bg-white">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 animate-pulse rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 animate-pulse rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : filteredPayments.length === 0 ? (
                <Card className="bg-white">
                  <CardContent className="p-8 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <CreditCard className="h-12 w-12 mb-3" />
                      <p className="text-sm">No payment transactions found</p>
                      <p className="text-xs mt-1">
                        Try adjusting your filters or search term
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                filteredPayments.map((payment: any) => (
                  <Card key={payment.id} className="bg-white">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-sm font-medium">
                            {payment.transactionId}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(payment.date), "dd MMM yyyy")}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-sm font-semibold ${
                              payment.amount < 0
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {payment.amount < 0 ? "-" : "+"}
                            {formatCurrency(Math.abs(payment.amount))}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">
                            Type:
                          </span>
                          <div>
                            {payment.type === "payout" ? (
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700 border-blue-300 text-xs"
                              >
                                Payout
                              </Badge>
                            ) : payment.type === "order" ? (
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 border-green-300 text-xs"
                              >
                                Order
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                {payment.type}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">
                            Status:
                          </span>
                          <div>{getStatusBadge(payment.status)}</div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground mb-1">
                            Description:
                          </span>
                          <p className="text-sm text-gray-900">
                            {payment.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <div className="flex gap-2 w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => handleViewPaymentDetails(payment)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                        {payment.type === "payout" &&
                          payment.status === "paid" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 text-xs"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Receipt
                            </Button>
                          )}
                        {payment.status === "failed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs text-red-600"
                          >
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Issue
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          </Tabs>
        </div>

        {/* Help & Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm md:text-base">
                Payout Schedule
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                When you'll receive your funds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs md:text-sm text-muted-foreground mb-2">
                Your current payout cycle is set to{" "}
                <span className="font-semibold">{payoutSchedule.cycle}</span>
                {payoutSchedule.cycle === "Weekly" ? (
                  <>
                    {" "}
                    on{" "}
                    <span className="font-semibold">{payoutSchedule.day}</span>
                  </>
                ) : null}
                .
              </p>
              <p className="text-xs md:text-sm text-muted-foreground">
                Funds are typically processed within 1-2 business days after the
                payout is initiated.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTempSchedule(payoutSchedule);
                  setShowScheduleDialog(true);
                }}
                className="text-xs md:text-sm"
              >
                Change Schedule
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm md:text-base">Need Help?</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Get support with payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs md:text-sm text-muted-foreground mb-3">
                Having issues with payments or need to understand the process
                better?
              </p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFAQDialog(true)}
                  className="w-full justify-start text-xs md:text-sm"
                >
                  <HelpCircle className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                  View FAQs
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSupportDialog(true)}
                  className="w-full justify-start text-xs md:text-sm"
                >
                  <ExternalLink className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm md:text-base">
                Payment Methods
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                How you receive payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs md:text-sm text-muted-foreground mb-3">
                Currently supporting bank transfers and UPI payments for Indian
                sellers.
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-xs md:text-sm">
                  <CreditCard className="h-3 w-3 md:h-4 md:w-4 mr-2 text-green-600" />
                  Bank Transfer
                </div>
                <div className="flex items-center text-xs md:text-sm">
                  <CreditCard className="h-3 w-3 md:h-4 md:w-4 mr-2 text-blue-600" />
                  UPI Payments
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                size="sm"
                className="text-xs md:text-sm"
                onClick={() => navigate("/seller/profile?tab=banking")}
              >
                Update Payment Method
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Payment Details Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Transaction Details</DialogTitle>
            <DialogDescription>
              Transaction {selectedPayment?.transactionId}
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Transaction Information
                </h3>
                <div className="bg-muted p-3 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Transaction ID:</span>
                    <span className="text-sm font-medium">
                      {selectedPayment.transactionId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Date:</span>
                    <span className="text-sm font-medium">
                      {format(
                        new Date(selectedPayment.date),
                        "dd MMM yyyy, h:mm a"
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Type:</span>
                    <span className="text-sm font-medium">
                      {selectedPayment.type}
                    </span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between">
                    <span className="text-sm">Amount:</span>
                    <span
                      className={`text-sm font-medium ${selectedPayment.amount < 0 ? "text-red-600" : "text-green-600"}`}
                    >
                      {selectedPayment.amount < 0 ? "-" : "+"}
                      {formatCurrency(Math.abs(selectedPayment.amount))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Status:</span>
                    <span className="text-sm font-medium">
                      {getStatusBadge(selectedPayment.status)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Payment Details
                </h3>
                <div className="bg-muted p-3 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Payment Method:</span>
                    <span className="text-sm font-medium">
                      {selectedPayment.paymentMethod || "Bank Transfer"}
                    </span>
                  </div>
                  {selectedPayment.type === "order" && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm">Order ID:</span>
                        <span className="text-sm font-medium">
                          #{selectedPayment.orderId || "123456"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Products:</span>
                        <span className="text-sm font-medium">
                          {selectedPayment.productCount || "3"} items
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm">Reference:</span>
                    <span className="text-sm font-medium">
                      {selectedPayment.reference || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {selectedPayment.type === "payout" &&
                selectedPayment.status === "paid" && (
                  <div className="flex justify-center">
                    <Button className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Download Receipt
                    </Button>
                  </div>
                )}

              {selectedPayment.status === "failed" && (
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-red-800">
                        Transaction Failed
                      </h4>
                      <p className="text-xs text-red-700 mt-1">
                        {selectedPayment.failureReason ||
                          "This transaction failed due to insufficient funds in the customer's account. No action is required from your side."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filter Payments</DialogTitle>
            <DialogDescription>
              Apply filters to narrow down your payment transactions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="min-amount" className="text-sm font-medium">
                  Min Amount
                </label>
                <Input
                  id="min-amount"
                  type="number"
                  placeholder="₹0"
                  value={filterOptions.minAmount}
                  onChange={(e) =>
                    setFilterOptions({
                      ...filterOptions,
                      minAmount: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="max-amount" className="text-sm font-medium">
                  Max Amount
                </label>
                <Input
                  id="max-amount"
                  type="number"
                  placeholder="₹100,000"
                  value={filterOptions.maxAmount}
                  onChange={(e) =>
                    setFilterOptions({
                      ...filterOptions,
                      maxAmount: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Transaction Type</label>
              <Select
                value={filterOptions.type}
                onValueChange={(value) =>
                  setFilterOptions({ ...filterOptions, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All transaction types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All transaction types</SelectItem>
                  <SelectItem value="payout">Payouts</SelectItem>
                  <SelectItem value="order">Order payments</SelectItem>
                  <SelectItem value="refund">Refunds</SelectItem>
                  <SelectItem value="fee">Service fees</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Custom Date Range</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="date-start"
                    className="text-xs text-muted-foreground"
                  >
                    Start Date
                  </label>
                  <Input
                    id="date-start"
                    type="date"
                    value={filterOptions.dateStart}
                    onChange={(e) =>
                      setFilterOptions({
                        ...filterOptions,
                        dateStart: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="date-end"
                    className="text-xs text-muted-foreground"
                  >
                    End Date
                  </label>
                  <Input
                    id="date-end"
                    type="date"
                    value={filterOptions.dateEnd}
                    onChange={(e) =>
                      setFilterOptions({
                        ...filterOptions,
                        dateEnd: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setFilterOptions({
                  minAmount: "",
                  maxAmount: "",
                  type: "all",
                  dateStart: "",
                  dateEnd: "",
                });
              }}
            >
              Reset Filters
            </Button>
            <Button onClick={() => setShowFilterDialog(false)}>
              Apply Filters
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment FAQs Dialog */}
      <Dialog open={showFAQDialog} onOpenChange={setShowFAQDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment FAQs</DialogTitle>
            <DialogDescription>
              Frequently asked questions about payments and payouts
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                Understanding the Purchase Price Payment Model
              </h3>

              <div className="border rounded-lg mb-6">
                <div className="p-4 border-b">
                  <h4 className="font-medium flex items-center">
                    <HelpCircle className="h-5 w-5 mr-2 text-primary" />
                    How is my payment calculated for each sale?
                  </h4>
                  <p className="text-sm text-muted-foreground mt-2">
                    You'll receive payment based on the{" "}
                    <strong>Purchase Price</strong> of your products. This is
                    the amount you'll be paid for each product sold, regardless
                    of the final selling price to the customer. The difference
                    between the selling price and purchase price represents the
                    platform's commission.
                  </p>
                </div>

                <div className="p-4 border-b">
                  <h4 className="font-medium flex items-center">
                    <HelpCircle className="h-5 w-5 mr-2 text-primary" />
                    What's the difference between Purchase Price and Selling
                    Price?
                  </h4>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>Purchase Price</strong>: The exact amount you
                    receive when a product sells. This is your earnings per
                    product.
                    <br />
                    <strong>Selling Price</strong>: The amount customers pay for
                    your product. The platform may apply discounts or promotions
                    to this price without affecting your Purchase Price.
                  </p>
                </div>

                <div className="p-4 border-b">
                  <h4 className="font-medium flex items-center">
                    <HelpCircle className="h-5 w-5 mr-2 text-primary" />
                    Do platform discounts affect my payment?
                  </h4>
                  <p className="text-sm text-muted-foreground mt-2">
                    No. When the platform offers discounts or promotions, they
                    do not affect your Purchase Price. You will always receive
                    the full Purchase Price amount for each product sold, even
                    during sales or discount events.
                  </p>
                </div>
              </div>

              <h3 className="text-lg font-semibold">
                General Payment Information
              </h3>

              <div className="border rounded-lg">
                <div className="p-4 border-b">
                  <h4 className="font-medium flex items-center">
                    <HelpCircle className="h-5 w-5 mr-2 text-primary" />
                    How often will I receive payments from Lelekart?
                  </h4>
                  <p className="text-sm text-muted-foreground mt-2">
                    Lelekart processes payments on a weekly basis. The default
                    payout schedule is set to weekly (every Monday), but you can
                    change this to bi-weekly or monthly through your payment
                    settings.
                  </p>
                </div>

                <div className="p-4 border-b">
                  <h4 className="font-medium flex items-center">
                    <HelpCircle className="h-5 w-5 mr-2 text-primary" />
                    How long does it take for payments to reach my bank account?
                  </h4>
                  <p className="text-sm text-muted-foreground mt-2">
                    Once a payout is initiated, funds typically reach your bank
                    account within 1-2 business days, depending on your bank's
                    processing times. If you haven't received your payment after
                    3 business days, please contact our support team.
                  </p>
                </div>

                <div className="p-4 border-b">
                  <h4 className="font-medium flex items-center">
                    <HelpCircle className="h-5 w-5 mr-2 text-primary" />
                    Is there a minimum payout amount?
                  </h4>
                  <p className="text-sm text-muted-foreground mt-2">
                    Yes, the minimum payout amount is ₹100. If your available
                    balance is below this threshold, it will be rolled over to
                    the next payout cycle until the minimum amount is reached.
                  </p>
                </div>

                <div className="p-4">
                  <h4 className="font-medium flex items-center">
                    <HelpCircle className="h-5 w-5 mr-2 text-primary" />
                    How are my earnings calculated?
                  </h4>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your earnings for each product are exactly equal to the{" "}
                    <strong>Purchase Price</strong> you set when listing your
                    product. This is the exact amount you receive for each unit
                    sold, regardless of any discounts, promotions, or final
                    selling price displayed to customers. The platform's
                    commission is the difference between the selling price and
                    the purchase price.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                Bank Account Information
              </h3>

              <div className="border rounded-lg">
                <div className="p-4 border-b">
                  <h4 className="font-medium flex items-center">
                    <HelpCircle className="h-5 w-5 mr-2 text-primary" />
                    How do I update my bank account details?
                  </h4>
                  <p className="text-sm text-muted-foreground mt-2">
                    You can update your bank account details by going to the
                    "Bank Account" card in the payments section and clicking
                    "Update Details". For security reasons, any changes to your
                    bank account information may require additional
                    verification, and payouts may be temporarily held during
                    this period.
                  </p>
                </div>

                <div className="p-4 border-b">
                  <h4 className="font-medium flex items-center">
                    <HelpCircle className="h-5 w-5 mr-2 text-primary" />
                    What bank details are required for receiving payments?
                  </h4>
                  <p className="text-sm text-muted-foreground mt-2">
                    You need to provide your bank account number, IFSC code,
                    account holder name, and bank name. Ensure that the account
                    is in the same name as the registered seller to avoid
                    payment issues.
                  </p>
                </div>

                <div className="p-4">
                  <h4 className="font-medium flex items-center">
                    <HelpCircle className="h-5 w-5 mr-2 text-primary" />
                    Can I have multiple bank accounts for receiving payments?
                  </h4>
                  <p className="text-sm text-muted-foreground mt-2">
                    Currently, Lelekart only supports one bank account per
                    seller. If you need to change your account, you can update
                    your bank details as mentioned above.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                Troubleshooting Payment Issues
              </h3>

              <div className="border rounded-lg">
                <div className="p-4 border-b">
                  <h4 className="font-medium flex items-center">
                    <HelpCircle className="h-5 w-5 mr-2 text-primary" />
                    My payment is marked as "Failed". What should I do?
                  </h4>
                  <p className="text-sm text-muted-foreground mt-2">
                    If your payment is marked as "Failed", it could be due to
                    incorrect bank details, bank account restrictions, or
                    temporary banking system issues. Check the error message for
                    specific details. You can view the error in the payment
                    details by clicking on the payment. After resolving the
                    issue, the system will automatically attempt to process the
                    payment in the next cycle.
                  </p>
                </div>

                <div className="p-4 border-b">
                  <h4 className="font-medium flex items-center">
                    <HelpCircle className="h-5 w-5 mr-2 text-primary" />
                    Why is my payment amount different from the order total?
                  </h4>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your payment is based on the <strong>Purchase Price</strong>{" "}
                    of your products, not the final selling price or order
                    total. The payment you receive will be the sum of the
                    Purchase Prices for all products sold in that order, which
                    is generally lower than the total amount paid by the
                    customer. The difference represents the platform's
                    commission. You can see a detailed breakdown of each
                    transaction by clicking on it in your payment history.
                  </p>
                </div>

                <div className="p-4">
                  <h4 className="font-medium flex items-center">
                    <HelpCircle className="h-5 w-5 mr-2 text-primary" />I have
                    more questions about my payments. How can I get help?
                  </h4>
                  <p className="text-sm text-muted-foreground mt-2">
                    For specific questions about your payments or issues not
                    covered in the FAQs, please click the "Contact Support"
                    button to reach our dedicated seller support team. They
                    typically respond within 24 hours on business days.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Support Dialog */}
      <Dialog open={showSupportDialog} onOpenChange={setShowSupportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Payment Support</DialogTitle>
            <DialogDescription>
              Submit your payment-related query to our dedicated seller support
              team
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="query-type" className="text-sm font-medium">
                Issue Type
              </label>
              <Select defaultValue="payment-delay">
                <SelectTrigger>
                  <SelectValue placeholder="Select issue type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payment-delay">Payment Delay</SelectItem>
                  <SelectItem value="incorrect-amount">
                    Incorrect Payment Amount
                  </SelectItem>
                  <SelectItem value="failed-payment">Failed Payment</SelectItem>
                  <SelectItem value="bank-update">
                    Bank Details Update
                  </SelectItem>
                  <SelectItem value="other">Other Payment Issue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="transaction-id" className="text-sm font-medium">
                Transaction ID (Optional)
              </label>
              <Input id="transaction-id" placeholder="e.g., TRX12345678" />
              <p className="text-xs text-muted-foreground">
                If your query is about a specific transaction, please provide
                the ID
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Describe your issue
              </label>
              <Textarea
                id="description"
                placeholder="Please provide details about your payment issue..."
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <Checkbox id="attach-statement" />
                <label
                  htmlFor="attach-statement"
                  className="ml-2 text-sm font-medium"
                >
                  Attach bank statement (recommended for payment verification)
                </label>
              </div>
              <Input id="statement-file" type="file" className="mt-2" />
              <p className="text-xs text-muted-foreground">
                Upload a screenshot or PDF of your bank statement (max 2MB)
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowSupportDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowSupportDialog(false);
                toast({
                  title: "Support request submitted",
                  description:
                    "We've received your query and will respond within 24 hours.",
                });
              }}
            >
              Submit Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dummy Change Payout Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Payout Schedule</DialogTitle>
            <DialogDescription>
              Select your preferred payout cycle. This will be saved to your
              account settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">Payout Cycle</label>
              <Select
                value={tempSchedule.cycle}
                onValueChange={(v) =>
                  setTempSchedule((s) => ({ ...s, cycle: v }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Bi-Weekly">Bi-Weekly</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {tempSchedule.cycle === "Weekly" && (
              <div>
                <label className="text-sm font-medium">Payout Day</label>
                <Select
                  value={tempSchedule.day}
                  onValueChange={(v) =>
                    setTempSchedule((s) => ({ ...s, day: v }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monday">Monday</SelectItem>
                    <SelectItem value="Tuesday">Tuesday</SelectItem>
                    <SelectItem value="Wednesday">Wednesday</SelectItem>
                    <SelectItem value="Thursday">Thursday</SelectItem>
                    <SelectItem value="Friday">Friday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowScheduleDialog(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={savePayoutScheduleMutation.isLoading}
              onClick={async () => {
                try {
                  await savePayoutScheduleMutation.mutateAsync(tempSchedule);
                  setPayoutSchedule(tempSchedule);
                  setShowScheduleDialog(false);
                  toast({
                    title: "Payout schedule updated",
                    description: `Now set to ${tempSchedule.cycle}${tempSchedule.cycle === "Weekly" ? ` on ${tempSchedule.day}` : ""}.`,
                    duration: 2500,
                  });
                } catch (err: any) {
                  toast({
                    title: "Failed to update payout schedule",
                    description: err.message,
                    variant: "destructive",
                  });
                }
              }}
            >
              {savePayoutScheduleMutation.isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Funds Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>
              Enter the amount you wish to withdraw. Minimum withdrawal amount
              is ₹10,000.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex justify-between">
              <span className="text-sm">Available Balance:</span>
              <span className="text-sm font-medium">
                {formatCurrency(summaryData?.availableBalance || 0)}
              </span>
            </div>
            <div>
              <label htmlFor="withdraw-amount" className="text-sm font-medium">
                Withdrawal Amount
              </label>
              <Input
                id="withdraw-amount"
                type="number"
                min={10000}
                placeholder="Enter amount (min ₹10,000)"
                value={withdrawAmount}
                onChange={(e) => {
                  setWithdrawAmount(e.target.value);
                  setWithdrawError("");
                }}
              />
              {withdrawError && (
                <p className="text-xs text-red-600 mt-1">{withdrawError}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowWithdrawDialog(false);
                setWithdrawAmount("");
                setWithdrawError("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const amount = Number(withdrawAmount);
                const available = summaryData?.availableBalance || 0;
                if (!withdrawAmount || isNaN(amount)) {
                  setWithdrawError("Please enter a valid amount.");
                  return;
                }
                if (amount < 10000) {
                  setWithdrawError("Minimum withdrawal amount is ₹10,000.");
                  return;
                }
                if (amount > available) {
                  setWithdrawError("Amount exceeds available balance.");
                  return;
                }
                setShowWithdrawDialog(false);
                setWithdrawAmount("");
                setWithdrawError("");
                toast({
                  title: "Withdrawal Requested",
                  description: `You have requested to withdraw ₹${amount}. (Demo only, no backend call)`,
                });
              }}
            >
              Confirm Withdrawal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SellerDashboardLayout>
  );
}
