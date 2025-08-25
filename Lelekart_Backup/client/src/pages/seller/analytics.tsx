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

// Custom Bar Chart Component
const CustomBarChart = ({
  data,
  onBarClick,
  showRevenue = true,
  showOrders = true,
}: {
  data: any[];
  onBarClick?: (item: any) => void;
  showRevenue?: boolean;
  showOrders?: boolean;
}) => {
  if (!data || data.length === 0)
    return <div className="text-center text-gray-500">No data available</div>;

  // Remove duplicates based on date
  const uniqueData = data.filter(
    (item, index, self) => index === self.findIndex((t) => t.date === item.date)
  );

  const maxRevenue = Math.max(...uniqueData.map((item) => item.revenue || 0));
  const maxOrders = Math.max(...uniqueData.map((item) => item.orders || 0));
  const maxValue = Math.max(maxRevenue, maxOrders);

  // Generate Y-axis labels
  const yAxisLabels = [];
  const numLabels = 5;
  for (let i = 0; i <= numLabels; i++) {
    const value = Math.round((maxValue * i) / numLabels);
    yAxisLabels.push(value);
  }

  return (
    <div className="w-full h-80">
      {/* Y-axis labels */}
      <div className="flex h-64 mb-2">
        <div className="w-16 flex flex-col justify-between text-xs text-gray-500 pr-2">
          {yAxisLabels.reverse().map((label, index) => (
            <div key={index} className="text-right">
              {label.toLocaleString()}
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div className="flex-1 relative">
          <div className="flex items-end justify-between h-full gap-2">
            {uniqueData.map((item, index) => {
              const revenueHeight =
                maxValue > 0 ? (item.revenue / maxValue) * 100 : 0;
              const ordersHeight =
                maxValue > 0 ? (item.orders / maxValue) * 100 : 0;

              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center relative"
                >
                  {/* Value labels on top of bars */}
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 font-medium">
                    {showRevenue && showOrders ? (
                      <div className="text-center">
                        <div className="text-green-600">
                          ₹{item.revenue?.toLocaleString() || 0}
                        </div>
                        <div className="text-blue-600">{item.orders || 0}</div>
                      </div>
                    ) : showRevenue ? (
                      <div className="text-green-600">
                        ₹{item.revenue?.toLocaleString() || 0}
                      </div>
                    ) : (
                      <div className="text-blue-600">{item.orders || 0}</div>
                    )}
                  </div>

                  <div className="w-full flex flex-col items-center gap-1 h-full">
                    {/* Revenue Bar - only show if showRevenue is true */}
                    {showRevenue && (
                      <div
                        className="w-full bg-green-500 rounded-t-sm cursor-pointer hover:bg-green-600 transition-colors relative"
                        style={{ height: `${revenueHeight}%` }}
                        onClick={() => onBarClick?.(item)}
                        title={`Revenue: ₹${item.revenue?.toLocaleString() || 0}`}
                      />
                    )}
                    {/* Orders Bar - only show if showOrders is true */}
                    {showOrders && (
                      <div
                        className="w-full bg-blue-500 rounded-b-sm cursor-pointer hover:bg-blue-600 transition-colors relative"
                        style={{ height: `${ordersHeight}%` }}
                        onClick={() => onBarClick?.(item)}
                        title={`Orders: ${item.orders || 0}`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between px-16">
        {uniqueData.map((item, index) => (
          <div key={index} className="text-xs text-gray-600 text-center flex-1">
            {item.date}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-4">
        {showRevenue && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-sm">Revenue</span>
          </div>
        )}
        {showOrders && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-sm">Orders</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function SellerAnalyticsPage() {
  const [dateRange, setDateRange] = useState("last30");
  const [dataTab, setDataTab] = useState("overview");
  const [chartType, setChartType] = useState("bar");
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // Fetch analytics data based on date range
  const {
    data: analyticsData,
    isLoading,
    refetch,
    error,
  } = useQuery({
    queryKey: ["/api/seller/analytics", dateRange, selectedMonth],
    queryFn: async () => {
      const params = new URLSearchParams({ range: dateRange });
      if (selectedMonth) {
        params.append("month", selectedMonth);
      }
      const res = await fetch(`/api/seller/analytics?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to fetch analytics data");
      }
      const data = await res.json();
      console.log("API Response:", data);
      return data;
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
        return "Current month";
      case "last30":
        return "Current month";
      case "last90":
        return "Last 3 months";
      case "year":
        return "Last 12 months";
      case "daily":
        return selectedMonth ? `${selectedMonth} - Daily View` : "Daily View";
      default:
        return "Current month";
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

  // Generate proper date data for charts
  const generateDateData = (range: string) => {
    const data = [];
    const today = new Date();

    // Create a simple seeded random function for consistent data
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };

    // Generate data based on range type
    if (range === "daily" && selectedMonth) {
      // Generate daily data for the selected month
      const monthParts = selectedMonth.split(" ");
      if (monthParts.length === 2) {
        const monthName = monthParts[0];
        const year = parseInt(monthParts[1]);
        const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

        const baseRevenue = 2000;
        const baseOrders = 5;
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, monthIndex, day);
          const growthFactor = 1 + (day / daysInMonth) * 0.5; // 50% growth over the month
          const variation = seededRandom(day + 100) * 0.15 - 0.075;
          data.push({
            date: format(date, "MMM dd"),
            revenue: Math.floor(baseRevenue * growthFactor * (1 + variation)),
            orders: Math.floor(baseOrders * growthFactor * (1 + variation)),
          });
        }
      }
    } else if (range === "last7" || range === "last30") {
      // Show last 1 month for last7 and last30 (monthly view)
      const baseRevenue = 50000;
      const baseOrders = 120;
      for (let i = 0; i >= 0; i--) {
        const date = new Date(today);
        date.setMonth(today.getMonth() - i);
        // Create dramatic upward trend - each month shows significant growth
        const growthFactor = 1 + i * 0.3; // 30% growth each month
        const variation = seededRandom(i + 30) * 0.15 - 0.075; // Small variation
        data.push({
          date: format(date, "MMM yyyy"),
          revenue: Math.floor(baseRevenue * growthFactor * (1 + variation)),
          orders: Math.floor(baseOrders * growthFactor * (1 + variation)),
        });
      }
    } else if (range === "last90") {
      // Create a dramatic growth trend for 3 months
      const baseRevenue = 50000;
      const baseOrders = 120;
      for (let i = 2; i >= 0; i--) {
        const date = new Date(today);
        date.setMonth(today.getMonth() - i);
        // Create dramatic upward trend - each month shows significant growth
        const growthFactor = 1 + i * 1.0; // 100% growth each month
        const variation = seededRandom(i + 90) * 0.15 - 0.075; // Small variation
        data.push({
          date: format(date, "MMM yyyy"),
          revenue: Math.floor(baseRevenue * growthFactor * (1 + variation)),
          orders: Math.floor(baseOrders * growthFactor * (1 + variation)),
        });
      }
    } else if (range === "year") {
      // Create a dramatic growth trend for 12 months
      const baseRevenue = 40000;
      const baseOrders = 100;
      for (let i = 11; i >= 0; i--) {
        const date = new Date(today);
        date.setMonth(today.getMonth() - i);
        // Create dramatic upward trend - each month shows significant growth
        const growthFactor = 1 + i * 0.3; // 30% growth each month
        const variation = seededRandom(i + 365) * 0.15 - 0.075; // Small variation
        data.push({
          date: format(date, "MMM yyyy"),
          revenue: Math.floor(baseRevenue * growthFactor * (1 + variation)),
          orders: Math.floor(baseOrders * growthFactor * (1 + variation)),
        });
      }
    }

    return data;
  };

  // Generate mock analytics data if API data is not available
  const generateMockAnalyticsData = (range: string) => {
    const chartData = generateDateData(range);

    // Calculate totals from the chart data
    const currentPeriodData = chartData.slice(-Math.ceil(chartData.length / 2));
    const previousPeriodData = chartData.slice(
      0,
      Math.ceil(chartData.length / 2)
    );

    const currentRevenue = currentPeriodData.reduce(
      (sum, item) => sum + item.revenue,
      0
    );
    const currentOrders = currentPeriodData.reduce(
      (sum, item) => sum + item.orders,
      0
    );
    const previousRevenue = previousPeriodData.reduce(
      (sum, item) => sum + item.revenue,
      0
    );
    const previousOrders = previousPeriodData.reduce(
      (sum, item) => sum + item.orders,
      0
    );

    return {
      revenueData: chartData,
      orderData: chartData,
      totals: {
        revenue: currentRevenue,
        orders: currentOrders,
        avgOrderValue: currentOrders > 0 ? currentRevenue / currentOrders : 0,
        conversionRate: 2.5 + Math.random() * 3,
      },
      previousTotals: {
        revenue: previousRevenue,
        orders: previousOrders,
        avgOrderValue:
          previousOrders > 0 ? previousRevenue / previousOrders : 0,
        conversionRate: 2.0 + Math.random() * 2,
      },
      categoryData: [],
      topProducts: [],
    };
  };

  // Use only API data, no fallback to mock data
  const finalAnalyticsData = analyticsData || {
    revenueData: [],
    orderData: [],
    totals: { revenue: 0, orders: 0, avgOrderValue: 0, conversionRate: 0 },
    previousTotals: {
      revenue: 0,
      orders: 0,
      avgOrderValue: 0,
      conversionRate: 0,
    },
    categoryData: [],
    topProducts: [],
  };

  // Prepare chart data
  const revenueChartData = finalAnalyticsData.revenueData;
  const orderChartData = finalAnalyticsData.orderData;
  const categoryChartData = finalAnalyticsData.categoryData;
  const productPerformanceData = finalAnalyticsData.topProducts;

  // Debug: Log the data to see what's being received
  console.log("Analytics data received:", {
    dateRange,
    hasAnalyticsData: !!analyticsData,
    revenueChartData: revenueChartData.slice(0, 3), // First 3 items
    orderChartData: orderChartData.slice(0, 3), // First 3 items
    totals: finalAnalyticsData.totals,
    previousTotals: finalAnalyticsData.previousTotals,
  });

  // Handle bar click for drill-down
  const handleBarClick = (item: any) => {
    // Only allow drill-down for ranges that show multiple months
    if ((dateRange === "last90" || dateRange === "year") && item.date) {
      setSelectedMonth(item.date);
      setDateRange("daily"); // Switch to daily view for the selected month
    }
  };

  // Handle back button for drill-down
  const handleBackToOverview = () => {
    setSelectedMonth(null);
    // Go back to the original range that was selected before drill-down
    // For now, default to last90, but this could be improved to remember the original range
    setDateRange("last90");
  };

  return (
    <SellerDashboardLayout>
      <div className="container min-h-screen flex flex-col flex-1 min-h-0 py-0">
        <div className="mb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center gap-4">
            {selectedMonth && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToOverview}
                className="flex items-center gap-2"
              >
                <ArrowUp className="h-4 w-4 rotate-90" />
                Back to Overview
              </Button>
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Seller Analytics
                {selectedMonth && (
                  <span className="text-lg font-normal text-muted-foreground ml-2">
                    - {selectedMonth}
                  </span>
                )}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Track your store's performance metrics and sales trends
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Select
              value={dateRange}
              onValueChange={setDateRange}
              disabled={selectedMonth !== null}
            >
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Select time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last7">Current month</SelectItem>
                <SelectItem value="last30">Current month</SelectItem>
                <SelectItem value="last90">Last 3 months</SelectItem>
                <SelectItem value="year">Last 12 months</SelectItem>
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
        ) : error ? (
          <div className="flex justify-center items-center h-40">
            <div className="text-center">
              <div className="text-red-600 mb-2">
                Error loading analytics data
              </div>
              <div className="text-sm text-muted-foreground mb-4">
                {error.message}
              </div>
              <Button onClick={() => refetch()} variant="outline">
                Retry
              </Button>
            </div>
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
                    {formatCurrency(finalAnalyticsData?.totals?.revenue || 0)}
                  </div>
                  <div className="flex items-center pt-1 text-xs text-muted-foreground justify-between">
                    <span>vs. previous period</span>
                    {getTrendIndicator(
                      getPercentageChange(
                        finalAnalyticsData?.totals?.revenue || 0,
                        finalAnalyticsData?.previousTotals?.revenue || 0
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
                    {finalAnalyticsData?.totals?.orders || 0}
                  </div>
                  <div className="flex items-center pt-1 text-xs text-muted-foreground justify-between">
                    <span>vs. previous period</span>
                    {getTrendIndicator(
                      getPercentageChange(
                        finalAnalyticsData?.totals?.orders || 0,
                        finalAnalyticsData?.previousTotals?.orders || 0
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
                    {formatCurrency(
                      finalAnalyticsData?.totals?.avgOrderValue || 0
                    )}
                  </div>
                  <div className="flex items-center pt-1 text-xs text-muted-foreground justify-between">
                    <span>vs. previous period</span>
                    {getTrendIndicator(
                      getPercentageChange(
                        finalAnalyticsData?.totals?.avgOrderValue || 0,
                        finalAnalyticsData?.previousTotals?.avgOrderValue || 0
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
                    {(finalAnalyticsData?.totals?.conversionRate || 0).toFixed(
                      2
                    )}
                    %
                  </div>
                  <div className="flex items-center pt-1 text-xs text-muted-foreground justify-between">
                    <span>vs. previous period</span>
                    {getTrendIndicator(
                      getPercentageChange(
                        finalAnalyticsData?.totals?.conversionRate || 0,
                        finalAnalyticsData?.previousTotals?.conversionRate || 0
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
                    <CardTitle>
                      Sales Performance Overview - {getDateRangeText()}
                    </CardTitle>
                    <CardDescription>
                      Revenue and order volume trends over time
                      {dateRange === "last90" && (
                        <span className="block mt-1 text-xs text-blue-600">
                          💡 Click on any month bar to drill down to daily view
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-60 sm:h-80">
                    {revenueChartData.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No data available
                      </div>
                    ) : (
                      <CustomBarChart
                        data={revenueChartData}
                        onBarClick={handleBarClick}
                        showRevenue={true}
                        showOrders={true}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Order & Sales Analysis - {getDateRangeText()}
                    </CardTitle>
                    <CardDescription>
                      Orders and revenue comparison by time period
                      {dateRange === "last90" && (
                        <span className="block mt-1 text-xs text-blue-600">
                          💡 Click on any month bar to drill down to daily view
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-60 sm:h-80">
                    {orderChartData.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        No orders in this period.
                      </div>
                    ) : (
                      <CustomBarChart
                        data={orderChartData}
                        onBarClick={handleBarClick}
                        showRevenue={false}
                        showOrders={true}
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
                      Revenue trends over time
                      {dateRange === "last90" && (
                        <span className="block mt-1 text-xs text-blue-600">
                          💡 Click on any month bar to drill down to daily view
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-60 sm:h-80">
                    {revenueChartData.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No data available
                      </div>
                    ) : (
                      <CustomBarChart
                        data={revenueChartData}
                        onBarClick={handleBarClick}
                        showRevenue={true}
                        showOrders={false}
                      />
                    )}
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
