import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  ShoppingCart,
  Home,
  User,
  Package,
  LogOut,
  Heart,
  Gift,
  CreditCard,
  ShoppingBag,
  Settings,
  ChevronRight,
  Bell,
  LineChart,
  TrendingUp,
  MapPin,
  Star,
  RefreshCcw,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "@/hooks/use-auth";
import { useContext } from "react";
import { User as UserType } from "@shared/schema";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarInset,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/layout/logo";
import { useState, useEffect } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location, setLocation] = useLocation();

  // Try to use context first if available
  const authContext = useContext(AuthContext);

  // Get user data from direct API if context is not available
  const { data: apiUser, isLoading: apiLoading } = useQuery<UserType | null>({
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

  // Use context user if available, otherwise use API user
  const user = authContext?.user || apiUser;
  const isLoading = authContext ? authContext.isLoading : apiLoading;

  // Always define all hooks, regardless of conditions (to satisfy React rules of hooks)
  // Use React Query to fetch cart data
  const { data: cartItems = [] } = useQuery({
    queryKey: ["/api/cart"],
    queryFn: async () => {
      if (!user) return [];

      const res = await fetch("/api/cart", {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch cart");
      }

      return res.json();
    },
    enabled: !!user,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });

  // Show loading state while fetching user data
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate cart item count
  const cartItemCount =
    cartItems.length > 0
      ? cartItems.reduce(
          (sum: number, item: { quantity: number }) =>
            sum + (item.quantity || 0),
          0
        )
      : 0;

  // Always define all hooks (React rules of hooks)
  const queryClient = useQueryClient();

  // Affiliate sidebar state
  const [affiliateLoading, setAffiliateLoading] = useState(true);
  const [isAffiliate, setIsAffiliate] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    setAffiliateLoading(true);
    fetch("/api/affiliate/dashboard", { credentials: "include" })
      .then(async (res) => {
        if (res.status === 403) {
          setIsAffiliate(false);
          setAffiliateLoading(false);
          return;
        }
        if (!res.ok) {
          setIsAffiliate(false);
          setAffiliateLoading(false);
          return;
        }
        setIsAffiliate(true);
        setAffiliateLoading(false);
      })
      .catch(() => {
        setIsAffiliate(false);
        setAffiliateLoading(false);
      });
  }, [user?.email]);

  // If no user, just render children or a minimal fallback (do not redirect)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">
          Please log in to access the dashboard.
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      queryClient.setQueryData(["/api/user"], null);
      queryClient.setQueryData(["/api/cart"], []);
      // Use wouter for navigation
      setLocation("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Function to check if a route is active
  const isActive = (path: string) => {
    return location === path;
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen flex-col bg-[#F8F5E4]">
        {/* Top Navigation Bar - fixed height of 56px (h-14) */}
        <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b bg-[#F8F5E4] px-4 shadow-md">
          <div className="flex h-full items-center justify-between">
            <div className="flex items-center gap-4">
                              <SidebarTrigger className="text-black hover:bg-[#EADDCB] hover:text-black" />
              <Link href="/" className="flex items-center">
                <Logo />
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="text-black hover:bg-[#EADDCB]"
                asChild
              >
                <Link href="/">
                  <Home className="h-5 w-5" />
                  <span className="sr-only">Home</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-black hover:bg-[#EADDCB]"
              >
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-black hover:bg-[#EADDCB] relative"
                asChild
              >
                <Link href="/cart">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="sr-only">Cart</span>
                  {cartItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-yellow-400 text-primary text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8 border-2 border-white">
                      {user.profileImage ? (
                        <AvatarImage
                          src={user.profileImage}
                          alt={user.username}
                        />
                      ) : null}
                      <AvatarFallback>
                        {getInitials(user.username)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                      <p className="text-xs font-semibold text-orange-500">
                        {user.role === "admin"
                          ? "Admin Account"
                          : user.role === "seller"
                            ? "Seller Account"
                            : "Buyer Account"}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/buyer/dashboard">My Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders">My Orders</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Add a spacer to push content below the fixed header */}
        <div className="h-14"></div>

        <div className="flex flex-1">
          <Sidebar className="border-r shadow-sm bg-[#F8F5E4]">
            <SidebarHeader className="border-b">
              <div className="flex items-center gap-2 px-3 py-3">
                <Avatar className="h-10 w-10 border border-gray-200">
                  {user.profileImage ? (
                    <AvatarImage src={user.profileImage} alt={user.username} />
                  ) : null}
                  <AvatarFallback className="bg-orange-100 text-orange-600">
                    {getInitials(user.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium leading-none">
                    {user.username}
                  </span>
                  <span className="text-xs text-orange-600">
                    {user.role === "admin"
                      ? "Admin Account"
                      : user.role === "seller"
                        ? "Seller Account"
                        : "Buyer Account"}
                  </span>
                </div>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                {/* Seller specific menu items */}
                {user.role === "seller" && (
                  <>
                    <SidebarMenuItem>
                      <Button
                        variant="ghost"
                        asChild
                        className={`w-full justify-start ${
                          isActive("/seller/products")
                            ? "bg-primary/10 text-primary"
                            : ""
                        }`}
                      >
                        <Link href="/seller/products">
                          <Package className="mr-2 h-4 w-4" />
                          <span>Seller Products</span>
                        </Link>
                      </Button>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <Button
                        variant="ghost"
                        asChild
                        className={`w-full justify-start ${
                          isActive("/seller/orders")
                            ? "bg-primary/10 text-primary"
                            : ""
                        }`}
                      >
                        <Link href="/seller/orders">
                          <ShoppingBag className="mr-2 h-4 w-4" />
                          <span>Seller Orders</span>
                        </Link>
                      </Button>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <Button
                        variant="ghost"
                        asChild
                        className={`w-full justify-start ${
                          isActive("/seller/returns")
                            ? "bg-primary/10 text-primary"
                            : ""
                        }`}
                      >
                        <Link href="/seller/returns">
                          <RefreshCcw className="mr-2 h-4 w-4" />
                          <span>Return Management</span>
                        </Link>
                      </Button>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <Button
                        variant="ghost"
                        asChild
                        className={`w-full justify-start ${
                          isActive("/seller/smart-inventory")
                            ? "bg-primary/10 text-primary"
                            : ""
                        }`}
                      >
                        <Link href="/seller/smart-inventory">
                          <TrendingUp className="mr-2 h-4 w-4" />
                          <span>Smart Inventory</span>
                        </Link>
                      </Button>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <Button
                        variant="ghost"
                        asChild
                        className={`w-full justify-start ${
                          isActive("/seller/add-product")
                            ? "bg-primary/10 text-primary"
                            : ""
                        }`}
                      >
                        <Link href="/seller/add-product">
                          <Package className="mr-2 h-4 w-4" />
                          <span>Add New Product</span>
                        </Link>
                      </Button>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <Button
                        variant="ghost"
                        asChild
                        className={`w-full justify-start ${
                          isActive("/seller/bulk-import")
                            ? "bg-primary/10 text-primary"
                            : ""
                        }`}
                      >
                        <Link href="/seller/bulk-import">
                          <Upload className="mr-2 h-4 w-4" />
                          <span>Bulk Import</span>
                        </Link>
                      </Button>
                    </SidebarMenuItem>
                    <SidebarSeparator />
                  </>
                )}
                {/* Affiliate Dashboard link for affiliates */}
                {isAffiliate && (
                  <SidebarMenuItem>
                    <Button
                      variant="ghost"
                      asChild
                      className={`w-full justify-start ${isActive("/buyer/dashboard") ? "bg-primary/10 text-primary" : ""}`}
                    >
                      <Link href="/buyer/dashboard">
                        <Star className="mr-2 h-4 w-4 text-yellow-500" />
                        <span>Affiliate Dashboard</span>
                      </Link>
                    </Button>
                  </SidebarMenuItem>
                )}
                {/* Common menu items for all users */}
                <SidebarMenuItem>
                  <Button
                    variant="ghost"
                    asChild
                    className={`w-full justify-start ${
                      isActive("/buyer/dashboard")
                        ? "bg-primary/10 text-primary"
                        : ""
                    }`}
                  >
                    <Link href="/buyer/dashboard">
                      <User className="mr-2 h-4 w-4" />
                      <span>My Profile</span>
                    </Link>
                  </Button>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Button
                    variant="ghost"
                    asChild
                    className={`w-full justify-start ${
                      isActive("/orders") ? "bg-primary/10 text-primary" : ""
                    }`}
                  >
                    <Link href="/orders">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      <span>My Orders</span>
                    </Link>
                  </Button>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Button
                    variant="ghost"
                    asChild
                    className={`w-full justify-start ${
                      isActive("/buyer/returns")
                        ? "bg-primary/10 text-primary"
                        : ""
                    }`}
                  >
                    <Link href="/buyer/returns">
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      <span>Returns & Refunds</span>
                    </Link>
                  </Button>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Button
                    variant="ghost"
                    asChild
                    className={`w-full justify-start ${
                      isActive("/buyer/wishlist")
                        ? "bg-primary/10 text-primary"
                        : ""
                    }`}
                  >
                    <Link href="/buyer/wishlist">
                      <Heart className="mr-2 h-4 w-4" />
                      <span>Wishlist</span>
                    </Link>
                  </Button>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Button
                    variant="ghost"
                    asChild
                    className={`w-full justify-start ${
                      isActive("/buyer/reviews")
                        ? "bg-primary/10 text-primary"
                        : ""
                    }`}
                  >
                    <Link href="/buyer/reviews">
                      <Star className="mr-2 h-4 w-4" />
                      <span>My Reviews</span>
                    </Link>
                  </Button>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Button
                    variant="ghost"
                    asChild
                    className={`w-full justify-start ${
                      isActive("/buyer/addresses")
                        ? "bg-primary/10 text-primary"
                        : ""
                    }`}
                  >
                    <Link href="/buyer/addresses">
                      <MapPin className="mr-2 h-4 w-4" />
                      <span>Manage Addresses</span>
                    </Link>
                  </Button>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Button
                    variant="ghost"
                    asChild
                    className={`w-full justify-start ${
                      isActive("/buyer/rewards")
                        ? "bg-primary/10 text-primary"
                        : ""
                    }`}
                  >
                    <Link href="/buyer/rewards">
                      <Gift className="mr-2 h-4 w-4" />
                      <span>Rewards</span>
                    </Link>
                  </Button>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Button
                    variant="ghost"
                    asChild
                    className={`w-full justify-start ${
                      isActive("/buyer/gift-cards")
                        ? "bg-primary/10 text-primary"
                        : ""
                    }`}
                  >
                    <Link href="/buyer/gift-cards">
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>Gift Cards</span>
                    </Link>
                  </Button>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Button
                    variant="ghost"
                    asChild
                    className={`w-full justify-start ${
                      isActive("/buyer/wallet")
                        ? "bg-primary/10 text-primary"
                        : ""
                    }`}
                  >
                    <Link href="/buyer/wallet">
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>My Wallet</span>
                    </Link>
                  </Button>
                </SidebarMenuItem>
              </SidebarMenu>
              <SidebarSeparator />
              <SidebarMenu>
                <SidebarMenuItem>
                  <Button
                    variant="ghost"
                    asChild
                    className="w-full justify-start"
                  >
                    <Link href="/">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      <span>Go Shopping</span>
                    </Link>
                  </Button>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Button
                    variant="ghost"
                    asChild
                    className={`w-full justify-start ${
                      isActive("/buyer/settings")
                        ? "bg-primary/10 text-primary"
                        : ""
                    }`}
                  >
                    <Link href="/buyer/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </Button>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive hover:text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </Button>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="border-t">
              <div className="p-3 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium">
                    Account Status:{" "}
                    <span className="text-green-600">Active</span>
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  © 2025 Lelekart
                </div>
              </div>
            </SidebarFooter>
          </Sidebar>
          <SidebarInset className="w-full p-4 md:p-6 bg-[#F8F5E4]">{children}</SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default DashboardLayout;
