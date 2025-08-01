import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Menu,
  X,
  ShoppingCart,
  ChevronDown,
  User,
  LogOut,
  LayoutDashboard,
  Store,
  ShoppingBag,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SimplifiedSearch } from "@/components/ui/simplified-search";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export function Header() {
  const [, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const { toggleCart, cartItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: "Logged out",
          description: "You have been successfully logged out",
        });
        setLocation("/auth");
      },
    });
  };

  const getDashboardLink = () => {
    if (!user) return "/auth";

    switch (user.role) {
      case "admin":
        return "/admin"; // Changed from /admin/dashboard to /admin to match our routes
      case "seller":
        return "/seller/dashboard";
      case "buyer":
        return "/buyer/dashboard";
      default:
        return "/";
    }
  };

  return (
    <header className="bg-primary text-white sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center py-2">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center mb-2 md:mb-0">
              <span className="text-2xl font-bold mr-1">Lelekart</span>
              <span className="text-xs italic text-yellow-400 flex items-end">
                <span>Explore</span>
                <span className="ml-1 text-yellow-400">Plus</span>
                <span className="text-yellow-400 ml-1">+</span>
              </span>
            </Link>
          </div>

          {/* Search Bar - Simplified Search */}
          <div className="w-full md:w-5/12 md:ml-4 relative mb-2 md:mb-0 flex items-center">
            {/* All Categories Dropdown (left of search bar) */}
            <div className="mr-2 hidden md:block">
              <AllCategoriesDropdown />
            </div>
            <SimplifiedSearch className="w-full" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center justify-between md:ml-auto space-x-4 md:space-x-6">
            {/* More Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="link"
                  className="text-white flex items-center hover:text-gray-200"
                >
                  <span>More</span>
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuItem className="cursor-pointer">
                  <span className="mr-2 text-primary">📢</span> Notification
                  Preferences
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <span className="mr-2 text-primary">🎧</span> 24x7 Customer
                  Care
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <span className="mr-2 text-primary">📈</span> Advertise
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <span className="mr-2 text-primary">📱</span> Download App
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Account Dropdown */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="link"
                    className="text-white flex items-center hover:text-gray-200"
                  >
                    <User className="mr-2 h-5 w-5" />
                    <span>{user.name || user.username}</span>
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href={getDashboardLink()}>
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/orders">
                      <ShoppingBag className="mr-2 h-4 w-4" /> My Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth">
                <Button
                  variant="link"
                  className="text-white flex items-center hover:text-gray-200"
                >
                  <User className="mr-2 h-5 w-5" />
                  <span>Login / Sign Up</span>
                </Button>
              </Link>
            )}

            {/* Cart Button */}
            <Button
              variant="link"
              className="text-white flex items-center hover:text-gray-200 relative"
              onClick={toggleCart}
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="ml-1">Cart</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-primary text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center ml-auto">
            <Button
              variant="ghost"
              size="icon"
              className="text-white"
              onClick={toggleCart}
            >
              <ShoppingCart className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute top-1 right-1 bg-yellow-400 text-primary text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-primary-foreground/20">
            <ul className="space-y-3">
              <li>
                {user ? (
                  <Link
                    href={getDashboardLink()}
                    className="flex items-center text-white py-1"
                  >
                    <User className="mr-2 h-5 w-5" />
                    {user.name || user.username}
                  </Link>
                ) : (
                  <a href="/auth" className="flex items-center text-white py-1">
                    <User className="mr-2 h-5 w-5" />
                    Login / Sign Up
                  </a>
                )}
              </li>
              {user?.role !== "buyer" && (
                <li>
                  <Link
                    href="/become-a-seller"
                    className="flex items-center text-white py-1"
                  >
                    <Store className="mr-2 h-5 w-5" />
                    Become a Seller
                  </Link>
                </li>
              )}
              {user && (
                <li>
                  <Link
                    href="/orders"
                    className="flex items-center text-white py-1"
                  >
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    My Orders
                  </Link>
                </li>
              )}
              {user && (
                <li>
                  <Button
                    variant="ghost"
                    className="flex items-center text-white py-1 w-full justify-start px-0 hover:bg-transparent"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-5 w-5" />
                    Logout
                  </Button>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}

function AllCategoriesDropdown() {
  const { data: categories, isLoading: categoriesLoading } =
    require("@tanstack/react-query").useQuery({
      queryKey: ["/api/categories"],
    });
  const { data: subcategories, isLoading: subcategoriesLoading } =
    require("@tanstack/react-query").useQuery({
      queryKey: ["/api/subcategories/all"],
    });
  const [, setLocation] = require("wouter").useLocation();
  if (categoriesLoading || subcategoriesLoading) {
    return (
      <button
        className="px-4 py-2 bg-white text-gray-700 rounded-l-md border border-gray-200"
        disabled
      >
        Loading...
      </button>
    );
  }
  if (!categories || categories.length === 0) {
    return null;
  }
  const sortedCategories = [...categories].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const getSubcategories = (categoryId) => {
    if (!subcategories) return [];
    return subcategories
      .filter(
        (sub) =>
          sub.categoryId === categoryId &&
          sub.active &&
          (!sub.parentId || sub.parentId === 0)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="px-4 py-2 bg-white text-gray-700 rounded-l-md border border-gray-200 font-semibold flex items-center">
        All <ChevronDown className="ml-1 h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-64 max-h-96 overflow-y-auto bg-white rounded-xl shadow-2xl border border-gray-200 p-2 mt-2 z-50"
      >
        {sortedCategories.map((category) => {
          const subcats = getSubcategories(category.id);
          return (
            <div key={category.id}>
              <DropdownMenuItem
                onClick={() => setLocation(`/category/${category.slug}`)}
                className="font-bold text-gray-900 hover:bg-gray-100 cursor-pointer"
              >
                {category.name}
              </DropdownMenuItem>
              {subcats.length > 0 && (
                <div className="pl-4">
                  {subcats.map((sub) => (
                    <DropdownMenuItem
                      key={sub.id}
                      onClick={() =>
                        setLocation(
                          `/category/${category.slug}?subcategory=${sub.slug}`
                        )
                      }
                      className="text-gray-700 hover:bg-gray-100 cursor-pointer"
                    >
                      {sub.name}
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
