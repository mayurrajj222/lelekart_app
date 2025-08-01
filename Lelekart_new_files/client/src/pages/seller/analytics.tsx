import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  LineChart,
  PieChart,
  DonutChart,
} from "@/components/ui/charts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  BarChart3,
  Download,
  FileDown,
  Filter,
  Image,
  Layers,
  Package,
  PieChart as PieChartIcon,
  RefreshCw,
  ShoppingBag,
  Users,
} from "lucide-react";

export default function SellerAnalyticsPage() {
  const [dateRange, setDateRange] = useState("last30");
  const [dataTab, setDataTab] = useState("overview");
  const [chartType, setChartType] = useState("bar");

  // Fetch analytics data based on date range
  const {
    data: analyticsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["/api/seller/analytics", dateRange],
    queryFn: async () => {
      const res = await fetch(`/api/seller/analytics?range=${dateRange}`);
      if (!res.ok) {
        throw new Error("Failed to fetch analytics data");
      }
      return res.json();
    },
  });

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate percentage change
  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Convert date range to human-readable text
  const getDateRangeText = () => {
    switch (dateRange) {
      case "last7":
        return "Last 7 days";
      case "last30":
        return "Last 30 days";
      case "last90":
        return "Last 90 days";
      case "year":
        return "This year";
      default:
        return "Last 30 days";
    }
  };

  // Get trend indicator component
  const getTrendIndicator = (percentChange: number) => {
    if (percentChange > 0) {
      return (
        <div className="flex items-center text-green-600">
          <ArrowUp className="h-4 w-4 mr-1" />
          <span>{Math.abs(percentChange).toFixed(1)}%</span>
        </div>
      );
    } else if (percentChange < 0) {
      return (
        <div className="flex items-center text-red-600">
          <ArrowDown className="h-4 w-4 mr-1" />
          <span>{Math.abs(percentChange).toFixed(1)}%</span>
        </div>
      );
    }
    return <span>0%</span>;
  };

  // Prepare chart data
  const revenueChartData = analyticsData?.revenueData || [];
  const orderChartData = analyticsData?.orderData || [];
  const categoryChartData = analyticsData?.categoryData || [];
  const productPerformanceData = analyticsData?.topProducts || [];

  return (
    <SellerDashboardLayout>
      <div className="container min-h-screen flex flex-col flex-1 min-h-0 py-0">
        <div className="mb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Seller Analytics
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Track your store's performance metrics and sales trends
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Select time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last7">Last 7 days</SelectItem>
                <SelectItem value="last30">Last 30 days</SelectItem>
                <SelectItem value="last90">Last 90 days</SelectItem>
                <SelectItem value="year">This year</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                className="flex-1 sm:flex-none"
                onClick={() => {
                  const endpoint = `/api/seller/analytics/export?range=${dateRange}`;
                  window.open(endpoint, "_blank");
                }}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Key Metrics Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-2">
              {/* Total Revenue Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Revenue
                  </CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(analyticsData?.totals?.revenue || 0)}
                  </div>
                  <div className="flex items-center pt-1 text-xs text-muted-foreground justify-between">
                    <span>vs. previous period</span>
                    {getTrendIndicator(
                      getPercentageChange(
                        analyticsData?.totals?.revenue || 0,
                        analyticsData?.previousTotals?.revenue || 0
                      )
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Total Orders Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Orders
                  </CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsData?.totals?.orders || 0}
                  </div>
                  <div className="flex items-center pt-1 text-xs text-muted-foreground justify-between">
                    <span>vs. previous period</span>
                    {getTrendIndicator(
                      getPercentageChange(
                        analyticsData?.totals?.orders || 0,
                        analyticsData?.previousTotals?.orders || 0
                      )
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Average Order Value Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Avg. Order Value
                  </CardTitle>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(analyticsData?.totals?.avgOrderValue || 0)}
                  </div>
                  <div className="flex items-center pt-1 text-xs text-muted-foreground justify-between">
                    <span>vs. previous period</span>
                    {getTrendIndicator(
                      getPercentageChange(
                        analyticsData?.totals?.avgOrderValue || 0,
                        analyticsData?.previousTotals?.avgOrderValue || 0
                      )
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Conversion Rate Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Conversion Rate
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(analyticsData?.totals?.conversionRate || 0).toFixed(2)}%
                  </div>
                  <div className="flex items-center pt-1 text-xs text-muted-foreground justify-between">
                    <span>vs. previous period</span>
                    {getTrendIndicator(
                      getPercentageChange(
                        analyticsData?.totals?.conversionRate || 0,
                        analyticsData?.previousTotals?.conversionRate || 0
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <Tabs value={dataTab} onValueChange={setDataTab} className="mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <TabsList className="grid w-full grid-cols-4 sm:w-auto">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="orders">Orders</TabsTrigger>
                  <TabsTrigger value="revenue">Revenue</TabsTrigger>
                  <TabsTrigger value="products">Products</TabsTrigger>
                </TabsList>
                <div className="flex w-full sm:w-auto justify-center sm:justify-end">
                  <Button
                    variant={chartType === "bar" ? "default" : "outline"}
                    size="sm"
                    className="rounded-r-none"
                    onClick={() => setChartType("bar")}
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={chartType === "line" ? "default" : "outline"}
                    size="sm"
                    className="rounded-l-none"
                    onClick={() => setChartType("line")}
                  >
                    <Image className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>Sales Overview - {getDateRangeText()}</CardTitle>
                    <CardDescription>
                      Key sales performance indicators over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-40 sm:h-60">
                    {revenueChartData.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No data available
                      </div>
                    ) : (
                      <LineChart
                        data={revenueChartData}
                        index="date"
                        categories={["revenue"]}
                        colors={["primary"]}
                        valueFormatter={(value) => formatCurrency(value)}
                        className="h-full w-full"
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders">
                <Card>
                  <CardHeader>
                    <CardTitle>Order Trends - {getDateRangeText()}</CardTitle>
                    <CardDescription>
                      Number of orders placed during the selected period
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-40 sm:h-60">
                    {orderChartData.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">No orders in this period.</div>
                    ) : (
                      <BarChart
                        data={orderChartData}
                        index="date"
                        categories={["orders"]}
                        colors={["blue"]}
                        className="h-full w-full"
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="revenue">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Revenue Analysis - {getDateRangeText()}
                    </CardTitle>
                    <CardDescription>
                      Revenue breakdown by various dimensions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 h-auto lg:h-60">
                      <div>
                        <h3 className="text-sm font-medium mb-4">
                          Revenue by Category
                        </h3>
                        <div className="h-40 sm:h-52">
                          {categoryChartData.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                              No data available
                            </div>
                          ) : (
                            <PieChart
                              data={categoryChartData}
                              index="category"
                              categories={["revenue"]}
                              colors={[
                                "#6366F1", // Indigo
                                "#F59E42", // Orange
                                "#10B981", // Green
                                "#EF4444", // Red
                                "#FBBF24", // Yellow
                                "#3B82F6", // Blue
                                "#A21CAF", // Purple
                                "#F472B6", // Pink
                                "#14B8A6", // Teal
                                "#64748B", // Slate
                              ]}
                              valueFormatter={(value) => formatCurrency(value)}
                              className="h-full w-full"
                            />
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium mb-4">
                          Revenue by Payment Method
                        </h3>
                        <div className="h-[250px] sm:h-[320px]">
                          {!analyticsData?.paymentMethodData ||
                          analyticsData.paymentMethodData.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                              No data available
                            </div>
                          ) : (
                            <DonutChart
                              data={analyticsData.paymentMethodData}
                              index="method"
                              categories={["amount"]}
                              colors={["primary", "blue", "cyan"]}
                              valueFormatter={(value) => formatCurrency(value)}
                              className="h-full w-full"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="products">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Product Performance - {getDateRangeText()}
                    </CardTitle>
                    <CardDescription>
                      Detailed metrics for your top performing products
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Desktop Table View */}
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-right">
                              Units Sold
                            </TableHead>
                            <TableHead className="text-right">
                              Revenue
                            </TableHead>
                            <TableHead className="text-right">
                              Conversion
                            </TableHead>
                            <TableHead>Trend</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {productPerformanceData.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center text-muted-foreground"
                              >
                                No data available
                              </TableCell>
                            </TableRow>
                          ) : (
                            productPerformanceData.map(
                              (product: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell>
                                    <div className="font-medium">
                                      {product.name}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {product.sku}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {product.unitsSold}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrency(product.revenue)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {product.conversion}%
                                  </TableCell>
                                  <TableCell>
                                    {getTrendIndicator(product.trend)}
                                  </TableCell>
                                </TableRow>
                              )
                            )
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                      {productPerformanceData.length === 0 ? (
                        <Card className="p-4 text-center text-muted-foreground">
                          No data available
                        </Card>
                      ) : (
                        productPerformanceData.map(
                          (product: any, index: number) => (
                            <Card key={index} className="p-4">
                              <div className="space-y-3">
                                <div>
                                  <div className="font-medium text-base">
                                    {product.name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {product.sku}
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <div className="text-muted-foreground">
                                      Units Sold
                                    </div>
                                    <div className="font-medium">
                                      {product.unitsSold}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-muted-foreground">
                                      Revenue
                                    </div>
                                    <div className="font-medium">
                                      {formatCurrency(product.revenue)}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-muted-foreground">
                                      Conversion
                                    </div>
                                    <div className="font-medium">
                                      {product.conversion}%
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-muted-foreground">
                                      Trend
                                    </div>
                                    <div className="font-medium">
                                      {getTrendIndicator(product.trend)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          )
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Additional Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Traffic Sources</CardTitle>
                  <CardDescription>
                    Where your store visitors are coming from
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Source</TableHead>
                        <TableHead className="text-right">Visitors</TableHead>
                        <TableHead className="text-right">Conversion</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!analyticsData?.trafficSources ||
                      analyticsData.trafficSources.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center text-muted-foreground"
                          >
                            No data available
                          </TableCell>
                        </TableRow>
                      ) : (
                        (analyticsData.trafficSources || []).map(
                          (source: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>{source.name}</TableCell>
                              <TableCell className="text-right">
                                {source.visitors}
                              </TableCell>
                              <TableCell className="text-right">
                                {source.conversion}%
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(source.revenue)}
                              </TableCell>
                            </TableRow>
                          )
                        )
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Customer Insights</CardTitle>
                  <CardDescription>
                    Understanding your customer base
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">
                          Repeat Purchase Rate
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(
                            analyticsData?.customerInsights
                              ?.repeatPurchaseRate || 0
                          ).toFixed(1)}
                          %
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getTrendIndicator(
                            getPercentageChange(
                              analyticsData?.customerInsights
                                ?.repeatPurchaseRate || 0,
                              analyticsData?.customerInsights
                                ?.previousRepeatPurchaseRate || 0
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">
                          Avg. Customer Value
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(
                            analyticsData?.customerInsights?.avgCustomerValue ||
                              0
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getTrendIndicator(
                            getPercentageChange(
                              analyticsData?.customerInsights
                                ?.avgCustomerValue || 0,
                              analyticsData?.customerInsights
                                ?.previousAvgCustomerValue || 0
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <h3 className="text-sm font-medium mb-3">
                    Customer Demographics
                  </h3>
                  <div className="h-[150px] sm:h-[200px]">
                    {!analyticsData?.customerInsights?.demographics ||
                    analyticsData.customerInsights.demographics.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No data available
                      </div>
                    ) : (
                      <PieChart
                        data={analyticsData.customerInsights.demographics}
                        index="group"
                        categories={["value"]}
                        colors={["primary", "blue", "cyan", "indigo"]}
                        valueFormatter={(value) => `${value}%`}
                        className="h-full w-full"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </SellerDashboardLayout>
  );
}
