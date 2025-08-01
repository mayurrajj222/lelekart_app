import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Link, useLocation } from "wouter";
import { AuthContext } from "@/hooks/use-auth";
import { useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import {
  ShoppingCart,
  ShoppingBag,
  PhoneCall,
  Mail,
  MapPin,
  ChevronRight,
  Package,
  Truck,
  ClipboardList,
  Heart,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/notifications/notification-bell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function BuyerDashboardPage() {
  console.log("BuyerDashboardPage: Component mounted");

  // Try to use context first if available
  const authContext = useContext(AuthContext);
  const [location, setLocation] = useLocation();

  console.log(
    "BuyerDashboardPage: AuthContext available:",
    !!authContext,
    "Current location:",
    location
  );

  // Get user data from direct API if context is not available
  const {
    data: apiUser,
    isLoading: apiLoading,
    error: apiError,
  } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      console.log("BuyerDashboardPage: Fetching user data from API");
      try {
        const res = await fetch("/api/user", {
          credentials: "include",
        });

        console.log("BuyerDashboardPage: API response status:", res.status);

        if (!res.ok) {
          if (res.status === 401) {
            console.log("BuyerDashboardPage: User not authenticated (401)");
            return null;
          }
          throw new Error(`Failed to fetch user: ${res.status}`);
        }

        const userData = await res.json();
        console.log("BuyerDashboardPage: User data received:", userData?.role);
        return userData;
      } catch (err) {
        console.error("BuyerDashboardPage: Error fetching user data", err);
        throw err;
      }
    },
    staleTime: 60000, // 1 minute
    retry: 1,
    retryDelay: 1000,
  });

  // Use context user if available, otherwise use API user
  const user = authContext?.user || apiUser;
  const isLoading = authContext ? authContext.isLoading : apiLoading;

  console.log(
    "BuyerDashboardPage: User data:",
    "Available:",
    !!user,
    "Role:",
    user?.role,
    "Loading:",
    isLoading,
    "API Error:",
    apiError?.message || "none"
  );

  // Fetch recent orders (limit 3)
  interface OrderSummary {
    id: number;
    date: string;
    status: string;
  }
  const { data: recentOrders = [], isLoading: loadingOrders } = useQuery<
    OrderSummary[]
  >({
    queryKey: ["/api/orders", { limit: 3 }],
    queryFn: async () => {
      const res = await fetch("/api/orders", { credentials: "include" });
      if (!res.ok) return [];
      const data = await res.json();
      // Sort by date desc, take 3
      return (data || [])
        .sort(
          (a: OrderSummary, b: OrderSummary) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        .slice(0, 3);
    },
    enabled: !!user,
  });

  // Fetch recent reviews (limit 3)
  interface ReviewSummary {
    id: number;
    createdAt: string;
    rating: number;
    product?: { id: number; name: string };
  }
  const { data: recentReviews = [], isLoading: loadingReviews } = useQuery<
    ReviewSummary[]
  >({
    queryKey: ["/api/user/reviews", { limit: 3 }],
    queryFn: async () => {
      const res = await fetch("/api/user/reviews", { credentials: "include" });
      if (!res.ok) return [];
      const data = await res.json();
      // Sort by date desc, take 3
      return (data || [])
        .sort(
          (a: ReviewSummary, b: ReviewSummary) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 3);
    },
    enabled: !!user,
  });

  // Fetch affiliate data if user is an affiliate
  const { data: affiliateData, isLoading: loadingAffiliate } = useQuery({
    queryKey: ["/api/affiliate/dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/affiliate/dashboard", {
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 403) {
          // User is not an affiliate, return null
          return null;
        }
        throw new Error(`Failed to fetch affiliate data: ${res.status}`);
      }
      return res.json();
    },
    enabled: !!user,
    retry: false, // Don't retry if user is not an affiliate
  });

  // Recently viewed products state
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [loadingRecentlyViewed, setLoadingRecentlyViewed] = useState(true);

  useEffect(() => {
    async function fetchRecentlyViewed() {
      setLoadingRecentlyViewed(true);
      try {
        const ids = JSON.parse(
          localStorage.getItem("recently_viewed_products") || "[]"
        );
        console.log(
          "[BuyerDashboard] Recently viewed IDs from localStorage:",
          ids
        );

        if (!Array.isArray(ids) || ids.length === 0) {
          console.log("[BuyerDashboard] No recently viewed products found");
          setRecentlyViewed([]);
          setLoadingRecentlyViewed(false);
          return;
        }

        // Fetch all products in parallel for speed
        const productPromises = ids.map((id) =>
          fetch(`/api/products/${id}`).then((res) =>
            res.ok ? res.json() : null
          )
        );
        const allProducts = (await Promise.all(productPromises)).filter(
          Boolean
        );

        // Keep the order as in localStorage
        const ordered = ids
          .map((id) => allProducts.find((p) => p.id === id))
          .filter((p) => p !== undefined && p !== null);

        setRecentlyViewed(ordered);
      } catch (e) {
        console.error("[BuyerDashboard] Error in fetchRecentlyViewed:", e);
        setRecentlyViewed([]);
      } finally {
        setLoadingRecentlyViewed(false);
      }
    }
    fetchRecentlyViewed();
  }, []);

  // Show loading state while fetching user data
  if (isLoading) {
    console.log("BuyerDashboardPage: Showing loading state");
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  // If no user (not authenticated) or wrong role, show a minimal fallback (do not redirect)
  if (!user || user.role !== "buyer") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="mb-2">
              Please log in as a buyer to access your dashboard.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show affiliate dashboard if user is an affiliate
  if (!isLoading && !loadingAffiliate && affiliateData) {
    const { affiliate, orders, totalEarnings } = affiliateData;
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto mt-8">
          <h1 className="text-2xl font-bold mb-2">Affiliate Dashboard</h1>
          <p className="mb-4 text-muted-foreground">
            Welcome, {affiliate.name}! Here you can track your affiliate code
            usage.
          </p>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Your Affiliate Code</CardTitle>
              <CardDescription>
                Share this code to earn rewards!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div>
                  <span className="font-semibold">Code:</span>{" "}
                  <span className="text-lg font-mono bg-gray-100 px-2 py-1 rounded">
                    {affiliate.code}
                  </span>
                </div>
                <div>
                  <span className="font-semibold">Discount:</span>{" "}
                  {affiliate.discountPercentage}%
                </div>
                <div>
                  <span className="font-semibold">Total Uses:</span>{" "}
                  {affiliate.usageCount}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Total Earnings</CardTitle>
              <CardDescription>
                Your total earnings from affiliate code usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  ₹{totalEarnings.toLocaleString("en-IN")}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  1% commission on each order
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Orders Using Your Code</CardTitle>
              <CardDescription>
                See which orders have used your affiliate code and your
                earnings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No orders have used your code yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Order Total</TableHead>
                        <TableHead>Your Earnings</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order: any) => (
                        <TableRow key={order.id}>
                          <TableCell>{order.id}</TableCell>
                          <TableCell>
                            {new Date(order.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{order.userId}</TableCell>
                          <TableCell>{order.status}</TableCell>
                          <TableCell>
                            ₹{order.total.toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell className="font-semibold text-green-600">
                            ₹{order.earnings.toLocaleString("en-IN")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F5E4]">
      <DashboardLayout>
        {/* Notification Bell for buyers */}
        <div className="flex justify-end items-center mb-4">
          <Button
            variant="ghost"
            className="bg-transparent text-primary hover:bg-primary-foreground/10 border-2 border-primary font-medium flex items-center gap-2"
            onClick={() => setLocation("/buyer/notifications")}
          >
            <NotificationBell
              className="text-primary"
              iconClassName="text-primary"
              badgeClassName="bg-red-600 text-white"
            />
          </Button>
        </div>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">My Account</h1>
            <p className="text-muted-foreground">
              Manage your account and see your purchases
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Personal Information Card */}
            <Card className="shadow-sm bg-[#F8F5E4]">
              <CardHeader className="pb-3">
                <CardTitle className="flex justify-between items-center flex-wrap">
                  <span className="mr-2">Personal Information</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => setLocation("/buyer/settings")}
                  >
                    Edit
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium">{user.name || user.username}</p>
                    <div className="text-sm text-muted-foreground mt-1">
                      <div className="flex items-center gap-2 mt-2">
                        <Mail className="h-4 w-4" />
                        <span>{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-2 mt-2">
                          <PhoneCall className="h-4 w-4" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                      {user.address && (
                        <div className="flex items-center gap-2 mt-2">
                          <MapPin className="h-4 w-4" />
                          <span>{user.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Summary Card */}
            <Card className="shadow-sm bg-[#F8F5E4]">
              <CardHeader className="pb-3">
                <CardTitle>Account Summary</CardTitle>
                <CardDescription>
                  Your Lelekart account at a glance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setLocation("/orders")}
                  >
                    <div className="flex items-center">
                      <div className="bg-blue-100 rounded-full p-2 mr-3">
                        <ShoppingBag className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">My Orders</p>
                        <p className="text-xs text-muted-foreground">
                          Track, return, or buy again
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setLocation("/buyer/wishlist")}
                  >
                    <div className="flex items-center">
                      <div className="bg-purple-100 rounded-full p-2 mr-3">
                        <Heart className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">My Wishlist</p>
                        <p className="text-xs text-muted-foreground">
                          Items you saved for later
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setLocation("/buyer/reviews")}
                  >
                    <div className="flex items-center">
                      <div className="bg-orange-100 rounded-full p-2 mr-3">
                        <AlertCircle className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">My Reviews</p>
                        <p className="text-xs text-muted-foreground">
                          Reviews you've written
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Card */}
            <Card className="shadow-sm bg-[#F8F5E4]">
              <CardHeader className="pb-3">
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your recent purchases and activity
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <Tabs defaultValue="orders">
                  <TabsList className="w-full">
                    <TabsTrigger value="orders" className="flex-1">
                      Orders
                    </TabsTrigger>
                    <TabsTrigger value="reviews" className="flex-1">
                      Reviews
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="orders" className="pt-4">
                    {loadingOrders ? (
                      <div className="flex items-center justify-center py-8 text-center flex-col">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
                        <h3 className="text-sm font-medium">
                          Loading recent orders...
                        </h3>
                      </div>
                    ) : recentOrders.length > 0 ? (
                      <div className="space-y-4">
                        {recentOrders.map((order: OrderSummary) => (
                          <div
                            key={order.id}
                            className="flex justify-between items-center border rounded-md p-3"
                          >
                            <div>
                              <div className="font-medium">
                                Order #{order.id}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(order.date).toLocaleDateString()}{" "}
                                &middot; {order.status}
                              </div>
                            </div>
                            <Button asChild variant="link" size="sm">
                              <Link href={`/orders/${order.id}`}>View</Link>
                            </Button>
                          </div>
                        ))}
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                        >
                          <Link href="/orders">View All Orders</Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-8 text-center flex-col">
                        <div className="bg-gray-100 rounded-full p-3 mb-3">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="text-sm font-medium">
                          No recent orders
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Your recent orders will appear here
                        </p>
                        <Button
                          variant="link"
                          size="sm"
                          className="mt-2"
                          asChild
                        >
                          <Link href="/">Browse Products</Link>
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="reviews" className="pt-4">
                    {loadingReviews ? (
                      <div className="flex items-center justify-center py-8 text-center flex-col">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
                        <h3 className="text-sm font-medium">
                          Loading recent reviews...
                        </h3>
                      </div>
                    ) : recentReviews.length > 0 ? (
                      <div className="space-y-4">
                        {recentReviews.map((review: ReviewSummary) => (
                          <div
                            key={review.id}
                            className="flex justify-between items-center border rounded-md p-3"
                          >
                            <div>
                              <div className="font-medium">
                                {review.product?.name || "Product"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(
                                  review.createdAt
                                ).toLocaleDateString()}{" "}
                                &middot; {review.rating}/5
                              </div>
                            </div>
                            <Button asChild variant="link" size="sm">
                              <Link href={`/product/${review.product?.id}`}>
                                View
                              </Link>
                            </Button>
                          </div>
                        ))}
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                        >
                          <Link href="/buyer/reviews">View All Reviews</Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-8 text-center flex-col">
                        <div className="bg-gray-100 rounded-full p-3 mb-3">
                          <ClipboardList className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="text-sm font-medium">No reviews yet</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Your product reviews will appear here
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Order Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm bg-[#F8F5E4]">
              <CardHeader className="pb-3">
                <CardTitle>Order Status</CardTitle>
                <CardDescription>
                  Track the status of your recent orders
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingOrders ? (
                  <div className="flex items-center justify-center py-8 text-center flex-col">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
                    <h3 className="text-sm font-medium">Loading orders...</h3>
                  </div>
                ) : recentOrders.length > 0 ? (
                  <div className="space-y-4">
                    {recentOrders.map((order: OrderSummary) => (
                      <div
                        key={order.id}
                        className="flex justify-between items-center border rounded-md p-3"
                      >
                        <div>
                          <div className="font-medium">Order #{order.id}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(order.date).toLocaleDateString()} •{" "}
                            {order.status}
                          </div>
                        </div>
                        <Button asChild variant="link" size="sm">
                          <Link href={`/orders/${order.id}`}>View</Link>
                        </Button>
                      </div>
                    ))}
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                    >
                      <Link href="/orders">View All Orders</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 text-center flex-col">
                    <div className="bg-gray-100 rounded-full p-3 mb-3">
                      <Truck className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-medium">No active orders</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your active orders will appear here
                    </p>
                    <Button variant="link" size="sm" className="mt-2" asChild>
                      <Link href="/orders">View All Orders</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Purchases */}
            <Card className="shadow-sm bg-[#F8F5E4]">
              <CardHeader className="pb-3">
                <CardTitle>Lelekart Plus</CardTitle>
                <CardDescription>
                  Enjoy exclusive benefits with Lelekart Plus
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      SuperCoins earned
                    </span>
                    <Badge
                      variant="outline"
                      className="bg-yellow-100 text-yellow-700"
                    >
                      0 Coins
                    </Badge>
                  </div>
                  <Progress value={0} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Earn SuperCoins with every purchase to unlock benefits
                  </p>
                </div>

                <div className="flex justify-center pt-4">
                  <Button className="bg-primary" size="sm" asChild>
                    <Link href="/">Explore Lelekart Plus</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recently Viewed Products */}
          <Card className="shadow-sm bg-[#F8F5E4]">
            <CardHeader className="pb-3">
              <CardTitle className="flex justify-between items-center">
                <span>Recently Viewed Products</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log(
                      "[BuyerDashboard] Manual refresh of recently viewed products"
                    );
                    const ids = JSON.parse(
                      localStorage.getItem("recently_viewed_products") || "[]"
                    );
                    console.log(
                      "[BuyerDashboard] Current localStorage IDs:",
                      ids
                    );
                    // Force re-fetch
                    setLoadingRecentlyViewed(true);
                    setTimeout(() => {
                      const event = new Event("storage");
                      window.dispatchEvent(event);
                    }, 100);
                  }}
                >
                  Refresh
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingRecentlyViewed ? (
                <div className="flex items-center justify-center py-8 text-center flex-col">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
                  <h3 className="text-sm font-medium">
                    Loading recently viewed products...
                  </h3>
                </div>
              ) : recentlyViewed.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mt-4">
                  {recentlyViewed.map((product: any) => (
                    <div
                      key={product.id}
                      className="flex flex-col items-center border rounded-lg shadow-sm p-3 bg-[#F8F5E4] hover:shadow-md transition cursor-pointer group"
                      onClick={() => setLocation(`/product/${product.id}`)}
                      tabIndex={0}
                      role="button"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          setLocation(`/product/${product.id}`);
                      }}
                      title={product.name}
                    >
                      <img
                        src={
                          product.imageUrl ||
                          (product.images && Array.isArray(product.images)
                            ? product.images[0]
                            : product.images &&
                              JSON.parse(product.images)[0]) ||
                          "https://via.placeholder.com/100?text=Product"
                        }
                        alt={product.name}
                        className="w-20 h-20 object-cover rounded mb-2 mx-auto group-hover:scale-105 transition"
                      />
                      <div className="text-xs font-semibold text-center line-clamp-2 mb-1 text-gray-800 group-hover:text-primary">
                        {product.name}
                      </div>
                      {product.price && product.price > 0 && (
                        <div className="text-xs text-gray-600 font-medium">
                          ₹{product.price.toLocaleString("en-IN")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-center flex-col">
                  <div className="bg-gray-100 rounded-full p-3 mb-3">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-medium">
                    No recently viewed products
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">
                    Products you view will appear here
                  </p>
                  <div className="space-y-2">
                    <Button variant="link" size="sm" asChild>
                      <Link href="/">Browse Products</Link>
                    </Button>
                    <div className="text-xs text-gray-500">
                      <p>Debug Info:</p>
                      <p>
                        localStorage IDs:{" "}
                        {JSON.stringify(
                          JSON.parse(
                            localStorage.getItem("recently_viewed_products") ||
                              "[]"
                          )
                        )}
                      </p>
                      <p>
                        Expected:{" "}
                        {
                          JSON.parse(
                            localStorage.getItem("recently_viewed_products") ||
                              "[]"
                          ).length
                        }{" "}
                        products
                      </p>
                      <p>Fetched: {recentlyViewed.length} products</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </div>
  );
}
