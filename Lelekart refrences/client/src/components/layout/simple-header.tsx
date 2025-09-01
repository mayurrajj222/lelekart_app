import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Search,
  Menu,
  X,
  ShoppingCart,
  User,
  LogOut,
  ChevronDown,
  Mic,
  Home as HomeIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SimpleSearch } from "@/components/ui/simple-search";
import { VoiceSearchDialog } from "@/components/search/voice-search-dialog";
import { AISearchService } from "@/services/ai-search-service";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/context/cart-context";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Logo } from "./logo";

export function SimpleHeader() {
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useLocation();

  // Use cart context for both guest and logged-in users
  const { cartItems } = useCart();

  // Use React Query to fetch user data
  const { data: user } = useQuery({
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
    refetchOnWindowFocus: false,
  });

  // Get cart item count for notification badge (from context)
  const cartItemCount = cartItems.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      queryClient.setQueryData(["/api/user"], null);
      queryClient.setQueryData(["/api/cart"], []);
      setLocation("/auth");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log("Search for:", searchQuery);
  };

  const navigateTo = (path: string) => {
    setLocation(path);
    setMobileMenuOpen(false);
  };

  const handleCartClick = () => {
    setLocation("/cart");
  };

  return (
    <header className="bg-[#F8F5E4] text-black border-b border-[#EADDCB] fixed top-0 left-0 right-0 z-40 font-serif">
      {/* Desktop Header - with improved padding and spacing */}
      <div className="container mx-auto px-4 h-14 hidden md:flex md:items-center">
        <div className="flex items-center justify-between w-full py-2">
          <div className="flex items-center space-x-8">
            <Link href="/">
              <Logo />
            </Link>
            <div className="flex-grow max-w-xl flex items-center">
              {/* All Categories Dropdown (left of search bar) */}
              <div className="mr-2 hidden md:block">
                <AllCategoriesDropdown />
              </div>
              <SimpleSearch
                className="w-full flex-grow"
                inputClassName="w-full pl-4 pr-4 py-2 text-base rounded-l-lg border-r-0 shadow-none"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Hide Home button on home page */}
            {location !== "/" && (
              <Link href="/">
                <Button
                  variant="ghost"
                  className="flex items-center py-2 px-3 text-black font-medium rounded-md hover:bg-black/10 transition-colors duration-200 border border-transparent hover:border-black/20"
                  style={{ boxShadow: "none", background: "transparent" }}
                >
                  <HomeIcon className="mr-2 h-5 w-5 text-black" />
                  <span>Home</span>
                </Button>
              </Link>
            )}

            {!user ? (
              // Show login button for non-authenticated users
              <Button
                variant="ghost"
                className="text-black hover:text-black hover:bg-black/10 px-4 py-2 text-base font-semibold rounded-md shadow border border-black transition-colors duration-200"
                onClick={() => setLocation("/auth")}
              >
                Login
              </Button>
            ) : (
              // Show user dropdown and notification bell for authenticated users
              <>
                {/* Notification Bell for authenticated users */}
                <NotificationBell
                  className="text-black hover:bg-black/10 rounded-md transition-colors duration-200"
                  iconClassName="text-black"
                  badgeClassName="bg-red-600 text-white"
                />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="text-black flex items-center hover:bg-black/10 h-10 px-4 rounded-md transition-colors duration-200 border border-transparent hover:border-black/20"
                    >
                      <User className="mr-2 h-5 w-5 text-black" />
                      <span>{user.name || user.username}</span>
                      <ChevronDown className="ml-1 h-4 w-4 text-black" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-[#F8F5E4] text-black border border-[#EADDCB]"
                  >
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        href={
                          user.role === "admin"
                            ? "/admin"
                            : user.role === "seller"
                              ? "/seller/dashboard"
                              : "/buyer/dashboard"
                        }
                        className="cursor-pointer"
                      >
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4 text-black" /> Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            {(!user || user.role === "buyer") && (
              <Button
                variant="ghost"
                className="relative text-black hover:text-black hover:bg-black/10 px-3 py-2 rounded-md transition-colors duration-200 border border-transparent hover:border-black/20"
                onClick={handleCartClick}
                title={`View Cart (${cartItemCount} items)`}
              >
                <ShoppingCart className="h-6 w-6 text-black" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] shadow-md">
                    {cartItemCount > 99 ? "99+" : cartItemCount}
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Header with improved spacing */}
      <div className="md:hidden px-4">
        <div className="h-14 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-black hover:text-gray-700 hover:bg-black/10 mr-3 p-2 rounded-md transition-colors duration-200"
              title="Open menu"
            >
              <Menu size={24} />
            </button>

            <Link href="/">
              <Logo />
            </Link>
            {location !== "/" && (
              <Link href="/">
                <Button
                  variant="ghost"
                  className="flex items-center py-1 px-2 text-black font-medium rounded-sm hover:bg-black/10 transition-colors duration-200"
                  style={{ boxShadow: "none", background: "transparent" }}
                >
                  <HomeIcon className="mr-2 h-4 w-4 text-black" />
                  <span>Home</span>
                </Button>
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Notification Bell for mobile authenticated users */}
            {user && (
              <NotificationBell
                className="text-black hover:bg-black/10 rounded-md transition-colors duration-200"
                iconClassName="text-black"
                badgeClassName="bg-red-600 text-white"
              />
            )}

            {(!user || user.role === "buyer") && (
              <button
                onClick={handleCartClick}
                className="text-black hover:text-gray-700 hover:bg-black/10 relative p-2 rounded-md transition-colors duration-200"
                title={`Shopping Cart (${cartItemCount} items)`}
              >
                <ShoppingCart className="h-6 w-6 text-black" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center min-w-[16px] shadow-md">
                    {cartItemCount > 99 ? "99+" : cartItemCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search - in a separate fixed position below the header */}
      <div className="md:hidden fixed top-14 left-0 right-0 bg-orange-400 px-4 pb-3 pt-1 z-40 shadow-md">
        <SimpleSearch />
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="bg-orange-400 h-full w-3/4 max-w-xs p-5">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Menu</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-black hover:text-gray-200 p-1"
                title="Close menu"
              >
                <X size={24} />
              </button>
            </div>

            <nav className="space-y-4">
              {location !== "/" && (
                <button
                  onClick={() => navigateTo("/")}
                  className="block w-full text-left py-3 border-b border-primary-foreground/20"
                >
                  Home
                </button>
              )}

              {!user ? (
                <button
                  onClick={() => navigateTo("/auth")}
                  className="block w-full text-left py-3 border-b border-primary-foreground/20"
                >
                  Login
                </button>
              ) : (
                <>
                  <button
                    onClick={() =>
                      navigateTo(
                        user.role === "admin"
                          ? "/admin"
                          : user.role === "seller"
                            ? "/seller/dashboard"
                            : "/buyer/dashboard"
                      )
                    }
                    className="block w-full text-left py-3 border-b border-primary-foreground/20"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left py-3 border-b border-primary-foreground/20"
                  >
                    Logout
                  </button>
                </>
              )}

              {(!user || user.role === "buyer") && (
                <button
                  onClick={handleCartClick}
                  className="block w-full text-left py-3 border-b border-primary-foreground/20"
                  title="Shopping Cart"
                >
                  Cart {cartItemCount > 0 && `(${cartItemCount})`}
                </button>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

function AllCategoriesDropdown() {
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
  });
  const { data: subcategories, isLoading: subcategoriesLoading } = useQuery({
    queryKey: ["/api/subcategories/all"],
  });
  const [, setLocation] = useLocation();
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
      <DropdownMenuTrigger className="px-4 py-2 bg-[#F8F5E4] text-black rounded-l-md border border-[#EADDCB] font-semibold flex items-center">
        All <ChevronDown className="ml-1 h-4 w-4 text-black" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="bg-[#F8F5E4] text-black border border-[#EADDCB] rounded-xl shadow-2xl p-2 mt-2 z-50"
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
