import React, { ReactNode } from "react";
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
  Bell,
  BarChart2,
  Layers,
  Tag,
  Store,
  Grid,
  Bookmark,
  File,
  Truck,
  HelpCircle,
  PackageOpen,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthContext, AuthProvider } from "@/hooks/use-auth";
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
import { ImpersonationBanner } from "@/components/ui/impersonation-banner";
import { Logo } from "@/components/layout/logo";

interface SellerDashboardLayoutProps {
  children: ReactNode;
}

export function SellerDashboardLayout({
  children,
}: SellerDashboardLayoutProps) {
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

  // Show loading state while fetching user data
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If no user (not authenticated) or wrong role, redirect to auth page
  if (!user || user.role !== "seller") {
    setLocation("/auth");
    return null;
  }

  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error("Logout failed:", response.statusText);
      }

      // Clear the user data from query cache
      queryClient.setQueryData(["/api/user"], null);

      // Redirect to auth page - using window.location for full page refresh
      window.location.href = "/auth";
    } catch (error) {
      console.error("Logout failed:", error);
      // Redirect anyway as fallback
      window.location.href = "/auth";
    }
  };

  // Function to check if a route is active
  const isActive = (path: string) => {
    return location.startsWith(path);
  };

  const getInitials = (name: string) => {
    if (!name) return "S";
    return name.charAt(0).toUpperCase();
  };

  return (
    <AuthProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen flex-col">
          {/* Impersonation Banner - already memoized internally */}
          <ImpersonationBanner />

          {/* Top Navigation Bar - fixed height of 56px (h-14) */}
          <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b bg-[#F8F5E4] px-4 shadow-md">
            <div className="flex h-full items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-white hover:bg-primary-foreground/10 hover:text-white" />
                <Link href="/" className="flex items-center">
                  <Logo />
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-primary-foreground/10"
                  asChild
                >
                  <Link href="/">
                    <Store className="h-5 w-5" />
                    <span className="sr-only">View Store</span>
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-primary-foreground/10"
                >
                  <Bell className="h-5 w-5" />
                  <span className="sr-only">Notifications</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full"
                    >
                      <Avatar className="h-8 w-8 border-2 border-white">
                        {user?.profileImage ? (
                          <AvatarImage
                            src={user.profileImage}
                            alt={user.username}
                            onError={(e) => {
                              // If image fails to load, fallback to initials
                              console.error(
                                "Profile image failed to load:",
                                user.profileImage
                              );
                              e.currentTarget.style.display = "none";
                            }}
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
                          Seller Account
                        </p>
                      </div>
                    </div>
                    <DropdownMenuItem asChild>
                      <Link href="/seller/profile">My Seller Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/seller/profile"
                        className="flex items-center"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Update Profile Picture
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/seller/settings">Account Settings</Link>
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

          <div className="flex flex-1 min-h-0">
            <Sidebar className="border-r shadow-sm bg-white">
              <SidebarHeader className="border-b">
                <div className="flex items-center gap-2 px-3 py-3">
                  <Avatar className="h-10 w-10 border border-gray-200">
                    {user?.profileImage ? (
                      <AvatarImage
                        src={user.profileImage}
                        alt={user.username}
                        onError={(e) => {
                          // If image fails to load, fallback to initials
                          console.error(
                            "Profile image failed to load:",
                            user.profileImage
                          );
                          e.currentTarget.style.display = "none";
                        }}
                      />
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
                      Seller Account
                    </span>
                  </div>
                </div>
              </SidebarHeader>
              <SidebarContent>
                {/* Dashboard Section */}
                <SidebarMenu>
                  <SidebarMenuItem>
                    <Button
                      variant="ghost"
                      asChild
                      className={`w-full justify-start ${isActive("/seller/dashboard") ? "bg-primary/10 text-primary font-medium" : ""}`}
                    >
                      <Link href="/seller/dashboard">
                        <Grid className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </Button>
                  </SidebarMenuItem>
                </SidebarMenu>

                {/* Product Management Section */}
                <SidebarSeparator />
                <div className="px-3 py-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Product Management
                  </h3>
                </div>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <Button
                      variant="ghost"
                      asChild
                      className={`w-full justify-start ${isActive("/seller/products") ? "bg-primary/10 text-primary font-medium" : ""}`}
                    >
                      <Link href="/seller/products">
                        <Layers className="mr-2 h-4 w-4" />
                        <span>Products</span>
                      </Link>
                    </Button>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <Button
                      variant="ghost"
                      asChild
                      className={`w-full justify-start ${isActive("/seller/products/add") ? "bg-primary/10 text-primary font-medium" : ""}`}
                    >
                      <Link href="/seller/products/add">
                        <Bookmark className="mr-2 h-4 w-4" />
                        <span>Add New Product</span>
                      </Link>
                    </Button>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <Button
                      variant="ghost"
                      asChild
                      className={`w-full justify-start ${isActive("/seller/bulk-import") ? "bg-primary/10 text-primary font-medium" : ""}`}
                    >
                      <Link href="/seller/bulk-import">
                        <Upload className="mr-2 h-4 w-4" />
                        <span>Bulk Import</span>
                      </Link>
                    </Button>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <Button
                      variant="ghost"
                      asChild
                      className={`w-full justify-start ${isActive("/seller/inventory") ? "bg-primary/10 text-primary font-medium" : ""}`}
                    >
                      <Link href="/seller/inventory">
                        <Package className="mr-2 h-4 w-4" />
                        <span>Inventory</span>
                      </Link>
                    </Button>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <Button
                      variant="ghost"
                      asChild
                      className={`w-full justify-start ${isActive("/seller/smart-inventory") ? "bg-primary/10 text-primary font-medium" : ""}`}
                    >
                      <Link href="/seller/smart-inventory">
                        <BarChart2 className="mr-2 h-4 w-4" />
                        <span>Smart Inventory</span>
                      </Link>
                    </Button>
                  </SidebarMenuItem>
                </SidebarMenu>

                {/* Order Management Section */}
                <SidebarSeparator />
                <div className="px-3 py-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Orders & Fulfillment
                  </h3>
                </div>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <Button
                      variant="ghost"
                      asChild
                      className={`w-full justify-start ${isActive("/seller/orders") ? "bg-primary/10 text-primary font-medium" : ""}`}
                    >
                      <Link href="/seller/orders">
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        <span>Orders</span>
                      </Link>
                    </Button>
                  </SidebarMenuItem>
                  {/* Shipping option removed as per request - shipping is only managed at admin level */}
                  <SidebarMenuItem>
                    <Button
                      variant="ghost"
                      asChild
                      className={`w-full justify-start ${isActive("/seller/returns") ? "bg-primary/10 text-primary font-medium" : ""}`}
                    >
                      <Link href="/seller/returns">
                        <PackageOpen className="mr-2 h-4 w-4" />
                        <span>Returns</span>
                      </Link>
                    </Button>
                  </SidebarMenuItem>
                </SidebarMenu>

                {/* Analytics Section */}
                <SidebarSeparator />
                <div className="px-3 py-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Analytics & Finance
                  </h3>
                </div>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <Button
                      variant="ghost"
                      asChild
                      className={`w-full justify-start ${isActive("/seller/analytics") ? "bg-primary/10 text-primary font-medium" : ""}`}
                    >
                      <Link href="/seller/analytics">
                        <BarChart2 className="mr-2 h-4 w-4" />
                        <span>Analytics</span>
                      </Link>
                    </Button>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <Button
                      variant="ghost"
                      asChild
                      className={`w-full justify-start ${isActive("/seller/payments") ? "bg-primary/10 text-primary font-medium" : ""}`}
                    >
                      <Link href="/seller/payments">
                        <CreditCard className="mr-2 h-4 w-4" />
                        <span>Payments</span>
                      </Link>
                    </Button>
                  </SidebarMenuItem>
                </SidebarMenu>

                {/* Settings Section */}
                <SidebarSeparator />
                <SidebarMenu>
                  <SidebarMenuItem>
                    <Button
                      variant="ghost"
                      asChild
                      className={`w-full justify-start ${isActive("/seller/settings") ? "bg-primary/10 text-primary font-medium" : ""}`}
                    >
                      <Link href="/seller/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </Button>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <Button
                      variant="ghost"
                      asChild
                      className={`w-full justify-start ${isActive("/seller/help") ? "bg-primary/10 text-primary font-medium" : ""}`}
                    >
                      <Link href="/seller/help">
                        <HelpCircle className="mr-2 h-4 w-4" />
                        <span>Help & Support</span>
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
                    <Store className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium">
                      Seller Status:{" "}
                      <span className="text-green-600">Active</span>
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    © 2025 Lelekart Seller Hub
                  </div>
                </div>
              </SidebarFooter>
            </Sidebar>
            <SidebarInset className="w-full flex-1 min-h-0 p-4 md:p-6">
              {children}
            </SidebarInset>
          </div>
        </div>
      </SidebarProvider>
    </AuthProvider>
  );
}
