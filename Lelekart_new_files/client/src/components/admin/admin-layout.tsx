import React from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Settings,
  FileText,
  Box,
  Truck,
  BarChart3,
  RefreshCw,
  Database,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user, isLoading } = useAuth();

  // If user is not authenticated or not an admin, redirect to the auth page
  if (!isLoading && (!user || user.role !== "admin")) {
    return <Redirect to="/auth" />;
  }

  const menuItems = [
    {
      path: "/admin/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      path: "/admin/products",
      label: "Products",
      icon: <ShoppingBag className="h-5 w-5" />,
    },
    {
      path: "/admin/orders",
      label: "Orders",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      path: "/admin/users",
      label: "Users",
      icon: <Users className="h-5 w-5" />,
    },
    {
      path: "/admin/sellers",
      label: "Sellers",
      icon: <Users className="h-5 w-5" />,
    },
    {
      path: "/admin/categories",
      label: "Categories (Old)",
      icon: <Box className="h-5 w-5" />,
    },
    {
      path: "/admin/category-management",
      label: "Category Management",
      icon: <Box className="h-5 w-5" />,
    },
    {
      path: "/admin/shipping",
      label: "Shipping",
      icon: <Truck className="h-5 w-5" />,
    },
    {
      path: "/admin/returns",
      label: "Returns",
      icon: <RefreshCw className="h-5 w-5" />,
    },
    {
      path: "/admin/analytics",
      label: "Analytics",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      path: "/admin/backups",
      label: "Backups",
      icon: <Database className="h-5 w-5" />,
    },
    {
      path: "/admin/settings",
      label: "Settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-orange-400 hidden md:block">
        <div className="p-4 border-b">
          <Link href="/admin/dashboard">
            <div className="flex items-center">
              <img
                src="https://drive.google.com/thumbnail?id=1RNjADzUc3bRdEpavAv5lxcN1P9VLG-PC&sz=w1000"
                alt="Lelekart Logo"
                className="h-10 w-auto"
              />
            </div>
          </Link>
        </div>

        <nav className="p-2">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link href={item.path}>
                  <a
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                      location === item.path
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden w-full border-b bg-card p-4 sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-xl font-bold">Admin Panel</h1>

        {/* Mobile menu button - could implement a mobile drawer/menu here */}
        <button className="p-2 rounded-md hover:bg-muted">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="h-full overflow-auto">{children}</div>
      </div>
    </div>
  );
}
