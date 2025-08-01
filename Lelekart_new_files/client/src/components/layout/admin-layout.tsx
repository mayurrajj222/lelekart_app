import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/notification-bell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingBag,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  User as UserIcon,
  Bell,
  ShoppingCart,
  Search,
  Grid,
  UserCheck,
  CheckSquare,
  Image,
  LayoutGrid,
  FileText,
  FileEdit,
  LayoutDashboardIcon,
  UserCog,
  UserPlus,
  Truck,
  Award,
  Gift,
  CreditCard,
  Clock,
  DollarSign,
  Upload,
  RefreshCcw,
  BarChart3,
} from "lucide-react";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { SimpleSearch } from "@/components/ui/simple-search";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/contexts/notification-context";
import { Logo } from "@/components/layout/logo";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const [heroMenuOpen, setHeroMenuOpen] = useState(
    location.includes("/admin/banner-management") ||
      location.includes("/admin/category-management") ||
      location.includes("/admin/design-hero")
  );

  const [footerMenuOpen, setFooterMenuOpen] = useState(
    location.includes("/admin/footer-management")
  );

  const [usersMenuOpen, setUsersMenuOpen] = useState(
    location.includes("/admin/users") || location.includes("/admin/create-user")
  );

  const [shippingMenuOpen, setShippingMenuOpen] = useState(
    location.includes("/admin/shipping-management") ||
      location.includes("/admin/shipping-settings") ||
      location.includes("/admin/shipping-dashboard") ||
      location.includes("/admin/pending-shipments") ||
      location.includes("/admin/shipping-rates") ||
      location.includes("/admin/tracking-management") ||
      location.includes("/admin/shiprocket-dashboard") ||
      location.includes("/admin/shiprocket-pending-shipments")
  );

  const [productDisplayMenuOpen, setProductDisplayMenuOpen] = useState(
    location.includes("/admin/product-display-settings")
  );

  const { unreadCount, notifications } = useNotifications();
  const [, setLocation] = useLocation();

  const navItems = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "Products",
      href: "/admin/products",
      icon: <Package className="h-5 w-5" />,
    },
    {
      title: "Product Approval",
      href: "/admin/product-approval",
      icon: <CheckSquare className="h-5 w-5" />,
    },
    {
      collapsible: true,
      title: "Users",
      icon: <Users className="h-5 w-5" />,
      open: usersMenuOpen,
      onOpenChange: setUsersMenuOpen,
      items: [
        {
          title: "Manage Users",
          href: "/admin/users",
          icon: <Users className="h-5 w-5" />,
        },
        {
          title: "Create User",
          href: "/admin/create-user",
          icon: <UserPlus className="h-5 w-5" />,
        },
      ],
    },
    {
      title: "Manage Admins",
      href: "/admin/manage-admins",
      icon: <UserCog className="h-5 w-5" />,
    },
    {
      title: "Seller Approval",
      href: "/admin/seller-approval",
      icon: <UserCheck className="h-5 w-5" />,
    },
    {
      title: "Seller Agreements",
      href: "/admin/agreements",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Orders",
      href: "/admin/orders",
      icon: <ShoppingBag className="h-5 w-5" />,
    },
    {
      title: "Support Tickets",
      href: "/admin/tickets",
      icon: <FileEdit className="h-5 w-5" />,
    },
    {
      title: "Return Management",
      href: "/admin/returns",
      icon: <RefreshCcw className="h-5 w-5" />,
    },
    {
      collapsible: true,
      title: "Shipping Management",
      icon: <Truck className="h-5 w-5" />,
      open: shippingMenuOpen,
      onOpenChange: setShippingMenuOpen,
      items: [
        {
          title: "Shipping Settings",
          href: "/admin/shipping-settings",
          icon: <Settings className="h-5 w-5" />,
        },
        {
          title: "General Settings",
          href: "/admin/shipping-management",
          icon: <Settings className="h-5 w-5" />,
        },
        {
          title: "Shiprocket Dashboard",
          href: "/admin/shiprocket-dashboard",
          icon: <Truck className="h-5 w-5" />,
        },
        {
          title: "Shiprocket Pending Shipments",
          href: "/admin/shiprocket-pending-shipments",
          icon: <Truck className="h-5 w-5" />,
        },
        {
          title: "Shipment Dashboard",
          href: "/admin/shipping-dashboard",
          icon: <LayoutDashboard className="h-5 w-5" />,
        },
        {
          title: "Pending Shipments",
          href: "/admin/pending-shipments",
          icon: <Clock className="h-5 w-5" />,
        },
        {
          title: "Shipping Rates",
          href: "/admin/shipping-rates",
          icon: <DollarSign className="h-5 w-5" />,
        },
        {
          title: "Tracking Management",
          href: "/admin/tracking-management",
          icon: <Search className="h-5 w-5" />,
        },
      ],
    },
    {
      title: "Rewards Management",
      href: "/admin/rewards-management",
      icon: <Award className="h-5 w-5" />,
    },
    {
      title: "Gift Cards Management",
      href: "/admin/gift-cards-management",
      icon: <Gift className="h-5 w-5" />,
    },
    {
      title: "Wallet Management",
      href: "/admin/wallet-management",
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      title: "Document Templates",
      href: "/admin/document-templates",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Media Library",
      href: "/admin/media-library",
      icon: <Image className="h-5 w-5" />,
    },
    {
      title: "Product Display Settings",
      href: "/admin/product-display-settings",
      icon: <LayoutGrid className="h-5 w-5" />,
    },
    {
      title: "GST Management",
      href: "/admin/gst-management",
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      title: "Affiliate Marketing",
      href: "/admin/affilate-marketing",
      icon: <BarChart3 className="h-5 w-5" />,
    },
  ];

  const handleLogout = async () => {
    try {
      // Call the server-side logout endpoint
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

      // Redirect to auth page after successful logout
      window.location.href = "/auth";
    } catch (error) {
      console.error("Logout error:", error);
      // Redirect anyway as fallback
      window.location.href = "/auth";
    }
  };

  // Function to check if a route is active
  const isActive = (path: string) => {
    return location.startsWith(path);
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen flex-col bg-gray-50">
        {/* Top Navigation - Header (Fixed) */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#F8F5E4] text-white shadow-md h-16">
          <div className="container mx-auto flex h-full items-center justify-between px-4">
            <div className="flex items-center space-x-4">
              <SidebarTrigger className="text-white hover:bg-orange-400/90" />
              {/* Logo - using Link instead of window.location for client-side routing to maintain session */}
              <Link href="/">
                <Button
                  variant="ghost"
                  className="p-0 hover:bg-transparent focus:bg-transparent"
                >
                  <div className="flex items-center space-x-2 text-xl font-bold">
                    <Logo />
                  </div>
                </Button>
              </Link>

              {/* AI-powered Search Box */}
              <div className="relative hidden md:flex items-center ml-4 w-64">
                <SimpleSearch className="w-full" variant="admin" />
              </div>
            </div>

            {/* Right Side Elements */}
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <div className="relative text-white">
                <Button
                  variant="ghost"
                  className="relative p-2"
                  aria-label="Notifications"
                  onClick={() => setLocation("/admin/notifications")}
                >
                  <Bell className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Button>
              </div>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-white hover:bg-[#2874f0]/90"
                  >
                    <span className="font-medium mr-1">Kaushlendra Admin</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <div className="px-3 pb-2">
                    <span className="text-xs font-semibold text-orange-500">
                      Admin Account
                    </span>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Add a spacer to push content below the fixed header */}
        <div className="h-16"></div>

        <div className="flex flex-1">
          <Sidebar className="border-r shadow-sm bg-white">
            <SidebarHeader className="border-b">
              <div className="flex items-center gap-2 px-3 py-3">
                <div className="flex flex-col">
                  <span className="font-medium leading-none">Admin Panel</span>
                  <span className="text-xs text-blue-600">Lelekart</span>
                </div>
              </div>
            </SidebarHeader>
            <SidebarContent>
              {/* Hero Management Section */}
              <SidebarSeparator />
              <div className="px-3 py-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Hero Management
                </h3>
              </div>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Button
                    variant="ghost"
                    asChild
                    className={`w-full justify-start ${isActive("/admin/banner-management") ? "bg-primary/10 text-primary font-medium" : ""}`}
                  >
                    <Link href="/admin/banner-management">
                      <Image className="mr-2 h-4 w-4" />
                      <span>Banner Management</span>
                    </Link>
                  </Button>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Button
                    variant="ghost"
                    asChild
                    className={`w-full justify-start ${isActive("/admin/category-management") ? "bg-primary/10 text-primary font-medium" : ""}`}
                  >
                    <Link href="/admin/category-management">
                      <Grid className="mr-2 h-4 w-4" />
                      <span>Category Management</span>
                    </Link>
                  </Button>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Button
                    variant="ghost"
                    asChild
                    className={`w-full justify-start ${isActive("/admin/design-hero") ? "bg-primary/10 text-primary font-medium" : ""}`}
                  >
                    <Link href="/admin/design-hero">
                      <LayoutDashboardIcon className="mr-2 h-4 w-4" />
                      <span>Design Hero</span>
                    </Link>
                  </Button>
                </SidebarMenuItem>
              </SidebarMenu>

              {/* Footer Management Section */}
              <SidebarSeparator />
              <div className="px-3 py-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Footer Management
                </h3>
              </div>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Button
                    variant="ghost"
                    asChild
                    className={`w-full justify-start ${isActive("/admin/footer-management") ? "bg-primary/10 text-primary font-medium" : ""}`}
                  >
                    <Link href="/admin/footer-management">
                      <FileEdit className="mr-2 h-4 w-4" />
                      <span>Edit Footer Content</span>
                    </Link>
                  </Button>
                </SidebarMenuItem>
              </SidebarMenu>

              {/* Main Navigation Items */}
              <SidebarSeparator />
              <div className="px-3 py-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Main Navigation
                </h3>
              </div>
              <SidebarMenu>
                {navItems.map((item, index) => (
                  <SidebarMenuItem key={index}>
                    {item.collapsible ? (
                      <Collapsible
                        open={item.open}
                        onOpenChange={item.onOpenChange}
                        className="w-full"
                      >
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            className={`w-full justify-between ${isActive(`/admin/${item.title.toLowerCase().replace(/\s+/g, "-")}`) ? "bg-primary/10 text-primary font-medium" : ""}`}
                          >
                            <div className="flex items-center">
                              {item.icon}
                              <span className="ml-2">{item.title}</span>
                            </div>
                            {item.open ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pl-6 pt-1">
                          {item.items?.map((subItem, subIndex) => (
                            <Button
                              key={`${subItem.href}-${subIndex}`}
                              variant="ghost"
                              asChild
                              className={`w-full justify-start mt-1 ${isActive(subItem.href || "") ? "bg-primary/10 text-primary font-medium" : ""}`}
                            >
                              <Link href={subItem.href || ""}>
                                {subItem.icon}
                                <span className="ml-2">{subItem.title}</span>
                              </Link>
                            </Button>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <Button
                        variant="ghost"
                        asChild
                        className={`w-full justify-start ${isActive(item.href || "") ? "bg-primary/10 text-primary font-medium" : ""}`}
                      >
                        <Link href={item.href || ""}>
                          {item.icon}
                          <span className="ml-2">{item.title}</span>
                        </Link>
                      </Button>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="border-t">
              <div className="p-3 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <LayoutDashboard className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium">
                    Admin Status: <span className="text-green-600">Active</span>
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  © 2025 Lelekart Admin Panel
                </div>
              </div>
            </SidebarFooter>
          </Sidebar>
          <SidebarInset className="w-full p-4 md:p-6">{children}</SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default AdminLayout;
