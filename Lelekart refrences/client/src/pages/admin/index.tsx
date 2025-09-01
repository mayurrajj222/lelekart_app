import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Package,
  ShoppingBag,
  ArrowRight,
  TrendingUp,
  DollarSign,
  BarChart3,
  Activity,
  Grid,
} from "lucide-react";
import { Order, Product } from "@shared/schema";

export default function AdminDashboard() {
  const [timeRange, setTimeRange] = useState("week");

  // Fetch data for dashboard
  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: users, isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  // Calculate dashboard statistics
  const totalOrders = orders?.length || 0;
  const pendingOrders =
    orders?.filter((order) => order.status === "pending").length || 0;
  const deliveredOrders =
    orders?.filter((order) => order.status === "delivered").length || 0;
  const totalRevenue =
    orders?.reduce((sum, order) => sum + order.total, 0) || 0;

  // Calculate today's orders
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOrders =
    orders?.filter((order) => {
      const orderDate = new Date(order.date);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    }).length || 0;

  // Calculate product statistics
  const totalProducts = products?.length || 0;
  const totalCategories = [...new Set(products?.map((p) => p.category) || [])]
    .length;
  const lowStockProducts =
    products?.filter((p) => (p.stock || 0) < 10).length || 0;

  // Calculate average order value
  const averageOrderValue = totalOrders
    ? (totalRevenue / totalOrders).toFixed(2)
    : "0.00";

  // Recent orders for quick view
  const recentOrders = orders?.slice(0, 5).map((order) => ({
    id: order.id,
    date: new Date(order.date).toLocaleDateString(),
    status: order.status,
    total: order.total,
    customer: `User #${order.userId}`,
  }));

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Loading skeleton for dashboard cards
  const CardSkeleton = () => (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-28" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-10 w-20 mb-2" />
        <Skeleton className="h-4 w-full" />
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your store's performance and recent activity
          </p>
        </div>

        {/* Time Range Selector */}
        <Tabs
          defaultValue={timeRange}
          className="w-full"
          onValueChange={setTimeRange}
        >
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
            <div className="text-xs text-muted-foreground">
              Last updated: {new Date().toLocaleString()}
            </div>
          </div>

          <TabsContent value="day" className="space-y-6 mt-4">
            <StatCards
              isLoading={ordersLoading || productsLoading || usersLoading}
              stats={{
                totalOrders,
                pendingOrders,
                deliveredOrders,
                totalRevenue,
                todayOrders,
                totalProducts,
                totalCategories,
                lowStockProducts,
              }}
              formatCurrency={formatCurrency}
            />
          </TabsContent>

          <TabsContent value="week" className="space-y-6 mt-4">
            <StatCards
              isLoading={ordersLoading || productsLoading || usersLoading}
              stats={{
                totalOrders,
                pendingOrders,
                deliveredOrders,
                totalRevenue,
                todayOrders,
                totalProducts,
                totalCategories,
                lowStockProducts,
              }}
              formatCurrency={formatCurrency}
            />
          </TabsContent>

          <TabsContent value="month" className="space-y-6 mt-4">
            <StatCards
              isLoading={ordersLoading || productsLoading || usersLoading}
              stats={{
                totalOrders,
                pendingOrders,
                deliveredOrders,
                totalRevenue,
                todayOrders,
                totalProducts,
                totalCategories,
                lowStockProducts,
              }}
              formatCurrency={formatCurrency}
            />
          </TabsContent>

          <TabsContent value="year" className="space-y-6 mt-4">
            <StatCards
              isLoading={ordersLoading || productsLoading || usersLoading}
              stats={{
                totalOrders,
                pendingOrders,
                deliveredOrders,
                totalRevenue,
                todayOrders,
                totalProducts,
                totalCategories,
                lowStockProducts,
              }}
              formatCurrency={formatCurrency}
            />
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/admin/orders">
              <div className="flex flex-col items-center p-6 bg-white rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all">
                <ShoppingBag className="h-10 w-10 text-primary mb-3" />
                <h3 className="font-medium">Manage Orders</h3>
              </div>
            </Link>
            <Link href="/admin/products">
              <div className="flex flex-col items-center p-6 bg-white rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all">
                <Package className="h-10 w-10 text-primary mb-3" />
                <h3 className="font-medium">Manage Products</h3>
              </div>
            </Link>
            <Link href="/admin/users">
              <div className="flex flex-col items-center p-6 bg-white rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all">
                <Users className="h-10 w-10 text-primary mb-3" />
                <h3 className="font-medium">Manage Users</h3>
              </div>
            </Link>
            <Link href="/admin/categories">
              <div className="flex flex-col items-center p-6 bg-white rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all">
                <Grid className="h-10 w-10 text-primary mb-3" />
                <h3 className="font-medium">Manage Categories</h3>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Orders */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold">Recent Orders</h2>
            <Link href="/admin/orders">
              <div className="text-sm text-primary hover:underline flex items-center">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </div>
            </Link>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {ordersLoading ? (
              <div className="p-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center py-2"
                  >
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            ) : recentOrders && recentOrders.length > 0 ? (
              <div className="divide-y">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex justify-between items-center p-4 hover:bg-gray-50"
                  >
                    <div>
                      <div className="font-medium">Order #{order.id}</div>
                      <div className="text-sm text-gray-500">
                        {order.customer} • {order.date}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-4 font-medium">
                        {formatCurrency(order.total)}
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium mb-1">No Orders Yet</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Orders will appear here once customers make purchases
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  let color = "";
  let text = status;

  switch (status) {
    case "pending":
      color = "bg-yellow-100 text-yellow-800";
      text = "Pending";
      break;
    case "processing":
      color = "bg-blue-100 text-blue-800";
      text = "Processing";
      break;
    case "shipped":
      color = "bg-purple-100 text-purple-800";
      text = "Shipped";
      break;
    case "delivered":
      color = "bg-green-100 text-green-800";
      text = "Delivered";
      break;
    case "cancelled":
      color = "bg-red-100 text-red-800";
      text = "Cancelled";
      break;
    default:
      color = "bg-gray-100 text-gray-800";
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}
    >
      {text}
    </span>
  );
}

function StatCards({ isLoading, stats, formatCurrency }: any) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const {
    totalOrders,
    pendingOrders,
    deliveredOrders,
    totalRevenue,
    todayOrders,
    totalProducts,
    totalCategories,
    lowStockProducts,
  } = stats;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(totalRevenue)}
          </div>
          <p className="text-xs text-muted-foreground">
            {totalOrders} orders total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Orders</CardTitle>
          <ShoppingBag className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalOrders}</div>
          <p className="text-xs text-muted-foreground">
            {pendingOrders} pending, {deliveredOrders} delivered
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Products</CardTitle>
          <Package className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalProducts}</div>
          <p className="text-xs text-muted-foreground">
            Across {totalCategories} categories
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Sales Today</CardTitle>
          <Activity className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{todayOrders}</div>
          <p className="text-xs text-muted-foreground">
            {lowStockProducts} products low in stock
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function CardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-28" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-10 w-20 mb-2" />
        <Skeleton className="h-4 w-full" />
      </CardContent>
    </Card>
  );
}
