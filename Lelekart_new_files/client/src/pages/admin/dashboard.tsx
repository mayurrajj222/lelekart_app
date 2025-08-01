import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "wouter";
import { AuthContext } from "@/hooks/use-auth";
import { useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import {
  Users,
  ShoppingBag,
  ShoppingCart,
  LineChart,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { toast } from "@/hooks/use-toast";
import { RecentActivitySection } from "@/components/dashboard/recent-activity-section";
import { ErrorIndicator } from "@/components/dashboard/error-indicator";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardPage() {
  // Try to use context first if available
  const authContext = useContext(AuthContext);

  // Get user data from direct API if context is not available
  const { data: apiUser, isLoading: apiLoading } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const res = await fetch("/api/user", {
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) return null;
        throw new Error("Failed to fetch user");
      }

      return res.json();
    },
    staleTime: 60000, // 1 minute
  });

  // Fetch dashboard statistics (basic stats) with better performance
  const {
    data: dashboardStats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ["/api/admin/dashboard/stats"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/admin/dashboard/stats", {
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            toast({
              title: "Access denied",
              description:
                "You don't have permission to view dashboard statistics.",
              variant: "destructive",
            });
            return {
              totalUsers: 0,
              totalProducts: 0,
              totalOrders: 0,
              totalRevenue: 0,
            };
          }
          throw new Error("Failed to fetch dashboard statistics");
        }

        return await res.json();
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        // Don't show toast on initial load to avoid error spam
        return {
          totalUsers: 0,
          totalProducts: 0,
          totalOrders: 0,
          totalRevenue: 0,
        };
      }
    },
    staleTime: 300000, // 5 minutes - increase cache time
    retry: 2,
    retryDelay: 1000,
  });

  // Fetch product statistics from our dedicated endpoint
  const { data: productStats, isLoading: productStatsLoading } = useQuery({
    queryKey: ["/api/admin/product-stats"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/admin/product-stats", {
          credentials: "include",
        });

        if (!res.ok) {
          return {
            total: 0,
            approved: 0,
            rejected: 0,
            pending: 0,
          };
        }

        return res.json();
      } catch (error) {
        console.error("Error fetching product statistics:", error);
        return {
          total: 0,
          approved: 0,
          rejected: 0,
          pending: 0,
        };
      }
    },
    staleTime: 300000, // 5 minutes - increase cache time
    retry: 2,
    retryDelay: 1000,
  });

  // Use context user if available, otherwise use API user
  const user = authContext?.user || apiUser;

  // Determine if the main data is loading
  const isUserLoading = authContext ? authContext.isLoading : apiLoading;

  // Show loading state only for user data, render the dashboard with skeletons for the rest
  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If user isn't logged in, redirect them
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">You need to log in</h2>
          <p className="text-muted-foreground mb-4">
            Please log in to access the admin dashboard
          </p>
          <Button asChild>
            <Link href="/auth">Go to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Use imported RecentActivitySection instead

  // The AdminLayout component will handle redirects if user is not admin
  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-4 lg:px-6">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold">
            Dashboard Overview
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm lg:text-base">
            Welcome to the admin dashboard. View and manage your store.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
          {/* Stats Cards */}
          <Card className="shadow-md">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Total Users
                  </p>
                  {statsLoading ? (
                    <Skeleton className="h-6 sm:h-8 w-12 sm:w-16" />
                  ) : (
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold">
                      {dashboardStats?.totalUsers?.toLocaleString() || "0"}
                    </p>
                  )}
                </div>
                <div className="p-1.5 sm:p-2 bg-blue-100 rounded-full">
                  <Users className="h-4 w-4 sm:h-6 sm:w-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Total Products
                  </p>
                  {productStatsLoading ? (
                    <Skeleton className="h-6 sm:h-8 w-12 sm:w-16" />
                  ) : (
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold">
                      {productStats?.total?.toLocaleString() || "0"}
                    </p>
                  )}
                </div>
                <div className="p-1.5 sm:p-2 bg-green-100 rounded-full">
                  <ShoppingBag className="h-4 w-4 sm:h-6 sm:w-6 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Total Orders
                  </p>
                  {statsLoading ? (
                    <Skeleton className="h-6 sm:h-8 w-12 sm:w-16" />
                  ) : (
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold">
                      {dashboardStats?.totalOrders?.toLocaleString() || "0"}
                    </p>
                  )}
                </div>
                <div className="p-1.5 sm:p-2 bg-purple-100 rounded-full">
                  <ShoppingCart className="h-4 w-4 sm:h-6 sm:w-6 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Total Revenue
                  </p>
                  {statsLoading ? (
                    <Skeleton className="h-6 sm:h-8 w-16 sm:w-24" />
                  ) : (
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold">
                      ₹
                      {dashboardStats?.totalRevenue?.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }) || "0"}
                    </p>
                  )}
                </div>
                <div className="p-1.5 sm:p-2 bg-orange-100 rounded-full">
                  <LineChart className="h-4 w-4 sm:h-6 sm:w-6 text-orange-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product Approval Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
          <Card className="shadow-md">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Approved Products
                  </p>
                  {productStatsLoading ? (
                    <Skeleton className="h-6 sm:h-8 w-12 sm:w-16" />
                  ) : (
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                      {productStats?.approved?.toLocaleString() || "0"}
                    </p>
                  )}
                </div>
                <div className="p-1.5 sm:p-2 bg-green-100 rounded-full">
                  <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Pending Products
                  </p>
                  {productStatsLoading ? (
                    <Skeleton className="h-6 sm:h-8 w-12 sm:w-16" />
                  ) : (
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">
                      {productStats?.pending?.toLocaleString() || "0"}
                    </p>
                  )}
                </div>
                <div className="p-1.5 sm:p-2 bg-orange-100 rounded-full">
                  <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-orange-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Rejected Products
                  </p>
                  {productStatsLoading ? (
                    <Skeleton className="h-6 sm:h-8 w-12 sm:w-16" />
                  ) : (
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600">
                      {productStats?.rejected?.toLocaleString() || "0"}
                    </p>
                  )}
                  <div className="mt-2">
                    <Link href="/admin/products?approval=rejected">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full flex items-center gap-1 sm:gap-2 justify-center h-8 sm:h-9 text-xs sm:text-sm"
                      >
                        <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">
                          See Rejected Products
                        </span>
                        <span className="sm:hidden">View</span>
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="p-1.5 sm:p-2 bg-red-100 rounded-full">
                  <XCircle className="h-4 w-4 sm:h-6 sm:w-6 text-red-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Admin Info Card */}
          <Card className="shadow-md">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">
                Admin Information
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Your administrative account details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-3 sm:mb-4 space-y-1 sm:space-y-2 text-xs sm:text-sm">
                <p>
                  <strong>Name:</strong> {user?.username}
                </p>
                <p>
                  <strong>Email:</strong> {user?.email}
                </p>
                <p>
                  <strong>Account ID:</strong> {user?.id}
                </p>
                <p>
                  <strong>Role:</strong>{" "}
                  <span className="text-red-600 font-medium">
                    Administrator
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card className="shadow-md">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">
                Quick Actions
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Manage the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="default"
                className="w-full flex items-center justify-center gap-2"
                asChild
              >
                <Link href="/admin/users">
                  <Users className="h-4 w-4" />
                  Manage Users
                </Link>
              </Button>

              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                asChild
              >
                <Link href="/admin/products">
                  <ShoppingBag className="h-4 w-4" />
                  Manage Products
                </Link>
              </Button>

              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                asChild
              >
                <Link href="/admin/orders">
                  <ShoppingCart className="h-4 w-4" />
                  View Orders
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity Card */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest updates from the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentActivitySection />
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
