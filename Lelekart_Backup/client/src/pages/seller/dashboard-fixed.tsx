import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "wouter";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import {
  Box,
  Layers,
  PackageOpen,
  Tag,
  BarChart4,
  Truck,
  TrendingUp,
  User,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useContext, useState } from "react";
import { AuthContext } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { ApprovalCheck } from "@/components/seller/approval-check";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define the type for dashboard summary data
interface DashboardSummary {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  avgPrice: number;
  recentOrders?: any[];
}

export default function SellerDashboardPage() {
  const { toast } = useToast();

  // State for refresh counter
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Try to use context first if available
  const authContext = useContext(AuthContext);

  // Get user data from direct API if context is not available
  const { data: apiUser } = useQuery<any>({
    queryKey: ["/api/user"],
    enabled: !authContext?.user,
  });

  // Use context user if available, otherwise use API user
  const user = authContext?.user || apiUser;

  // Fetch dashboard summary data
  const {
    data: dashboardSummary,
    isLoading: isLoadingSummary,
    error: summaryError,
  } = useQuery<DashboardSummary>({
    queryKey: ["/api/seller/dashboard-summary", refreshCounter],
    queryFn: async () => {
      try {
        console.log("Fetching seller dashboard summary");
        const res = await fetch("/api/seller/dashboard-summary", {
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
          },
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error("Dashboard API error:", {
            status: res.status,
            statusText: res.statusText,
            body: errorText,
          });
          throw new Error(
            `Failed to fetch dashboard summary: ${res.status} ${res.statusText}`
          );
        }

        const data = await res.json();
        console.log("Dashboard summary loaded successfully:", data);
        return data;
      } catch (error) {
        console.error("Error fetching dashboard summary:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
        // Return default data but don't cache it
        throw error;
      }
    },
    staleTime: 60000, // 1 minute
    retry: 2,
    // Provide default data if there's an error
    placeholderData: {
      totalProducts: 0,
      totalOrders: 0,
      totalRevenue: 0,
      avgPrice: 0,
    },
  });

  // Function to refresh dashboard data
  const handleRefreshDashboard = () => {
    setRefreshCounter((prev) => prev + 1);
  };

  return (
    <SellerDashboardLayout>
      <ApprovalCheck>
        <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-xl sm:text-2xl font-bold">Seller Dashboard</h1>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center w-full sm:w-auto">
              <Button
                variant="outline"
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
                asChild
              >
                <Link href="/seller/products/add">
                  <Layers className="h-4 w-4" />
                  Add Product
                </Link>
              </Button>
              <Button
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
                asChild
              >
                <Link href="/seller/orders">
                  <PackageOpen className="h-4 w-4" />
                  View Orders
                </Link>
              </Button>
            </div>
          </div>

          {/* Show error alert if dashboard summary failed to load */}
          {summaryError && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <AlertTitle>Error Loading Dashboard Data</AlertTitle>
              <AlertDescription className="mt-2">
                We encountered an error while loading your dashboard data. This
                may be a temporary issue.
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshDashboard}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh Dashboard
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Stats Cards */}
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Products</p>
                    {isLoadingSummary ? (
                      <div className="flex items-center mt-1">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin text-blue-700" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    ) : (
                      <p className="text-2xl font-bold">
                        {dashboardSummary?.totalProducts || 0}
                      </p>
                    )}
                  </div>
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Layers className="h-6 w-6 text-blue-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Orders</p>
                    {isLoadingSummary ? (
                      <div className="flex items-center mt-1">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin text-green-700" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    ) : (
                      <p className="text-2xl font-bold">
                        {dashboardSummary?.totalOrders || 0}
                      </p>
                    )}
                  </div>
                  <div className="p-2 bg-green-100 rounded-full">
                    <PackageOpen className="h-6 w-6 text-green-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    {isLoadingSummary ? (
                      <div className="flex items-center mt-1">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin text-purple-700" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    ) : (
                      <p className="text-2xl font-bold">
                        ₹{dashboardSummary?.totalRevenue?.toFixed(2) || "0"}
                      </p>
                    )}
                  </div>
                  <div className="p-2 bg-purple-100 rounded-full">
                    <BarChart4 className="h-6 w-6 text-purple-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Price</p>
                    {isLoadingSummary ? (
                      <div className="flex items-center mt-1">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin text-orange-700" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    ) : (
                      <p className="text-2xl font-bold">
                        ₹{dashboardSummary?.avgPrice?.toFixed(2) || "0"}
                      </p>
                    )}
                  </div>
                  <div className="p-2 bg-orange-100 rounded-full">
                    <Tag className="h-6 w-6 text-orange-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Seller Info Card */}
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle>Account Overview</CardTitle>
                <CardDescription>
                  Your seller details and status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 space-y-3">
                  <div className="flex items-center gap-3 pb-3 border-b">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <User className="h-5 w-5 text-blue-700" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user?.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Account ID</span>
                    <span className="font-medium">{user?.id}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Account Type</span>
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                      Seller
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      Active
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/seller/profile">View Complete Profile</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Quick Links Card */}
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your store efficiently</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="default"
                  className="w-full flex items-center justify-center gap-2"
                  asChild
                >
                  <Link href="/seller/products/add">
                    <Layers className="h-4 w-4" />
                    Add New Product
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  asChild
                >
                  <Link href="/seller/orders">
                    <PackageOpen className="h-4 w-4" />
                    View Orders
                  </Link>
                </Button>

                {/* Shipping management removed as per requirement - only available in admin panel */}

                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  asChild
                >
                  <Link href="/seller/analytics">
                    <TrendingUp className="h-4 w-4" />
                    View Analytics
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Recent Orders Card */}
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest customer orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="rounded-full bg-gray-100 p-3 mb-4">
                    <PackageOpen className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No orders yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Customer orders will appear here
                  </p>
                  <Button variant="link" className="mt-2" asChild>
                    <Link href="/seller/products/add">
                      Add a product to start selling
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sales Performance Card */}
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle>Sales Performance</CardTitle>
              <CardDescription>
                Monitor your store's performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardSummary && dashboardSummary.totalOrders > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-sm text-muted-foreground">
                        Top Selling Products
                      </span>
                      <span className="text-sm font-medium">Units</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">No data available</span>
                      <span className="text-sm font-medium">-</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-sm text-muted-foreground">
                        Recent Activity
                      </span>
                      <span className="text-sm font-medium">Date</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">No data available</span>
                      <span className="text-sm font-medium">-</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="rounded-full bg-gray-100 p-3 mb-4">
                    <BarChart4 className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No sales data yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sales performance metrics will appear once you have orders
                  </p>
                  <Button variant="link" className="mt-2" asChild>
                    <Link href="/seller/analytics">
                      View Analytics Dashboard
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ApprovalCheck>
    </SellerDashboardLayout>
  );
}
