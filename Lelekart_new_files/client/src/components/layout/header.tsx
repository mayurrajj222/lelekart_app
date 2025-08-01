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
  Home as HomeIcon,
} from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";
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
import { CategoryMegaMenu } from "@/components/layout/category-mega-menu";
import { Logo } from "./logo";

export function Header() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const { toggleCart, cartItems } = useCart();
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: "Logged out",
          description: "You have been successfully logged out",
          variant: "default",
        });
        setLocation("/auth");
      },
    });
  };

  const getDashboardLink = () => {
    if (!user) return "/auth";

    // Return relative paths without domain to prevent double-slash issues
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

  const handleCartClick = () => {
    setLocation("/cart");
  };

  return (
    <header className="bg-orange-400 text-white sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center py-4 justify-between">
          {/* Logo and Home Button */}
          <div className="flex items-center gap-2 flex-shrink-0 md:w-auto mb-2 md:mb-0">
            <Link href="/">
              <Logo />
            </Link>
            <Link href="/">
              <Button
                variant="secondary"
                className="flex items-center py-1 px-2 md:px-4 bg-white text-primary font-medium rounded-sm hover:bg-gray-100"
              >
                <HomeIcon className="mr-2 h-4 w-4" />
                <span>Home</span>
              </Button>
            </Link>
          </div>

          {/* Search Bar (Centered) */}
          <div className="w-full md:flex-1 flex justify-center mb-3 md:mb-0 order-last md:order-none">
            {/* All Categories Dropdown (left of search bar) */}
            <div className="mr-2 hidden md:block">
              <AllCategoriesDropdown />
            </div>
            <SimplifiedSearch className="w-full max-w-xl" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center justify-end flex-shrink-0 md:w-52 space-x-4 md:space-x-5">
            {/* User Controls */}
            {!user ? (
              // If not logged in, show a direct login button
              <Link href="/auth">
                <Button
                  variant="secondary"
                  className="flex items-center py-2 px-6 md:px-8 text-lg bg-white text-primary font-semibold rounded hover:bg-gray-100 shadow-md"
                >
                  <User className="mr-3 h-7 w-7" />
                  <span>Login</span>
                </Button>
              </Link>
            ) : (
              // If logged in, show user menu dropdown
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    className="flex items-center py-1 px-2 md:px-4 bg-white text-primary font-medium rounded-sm hover:bg-gray-100"
                  >
                    {user.profileImage ? (
                      <div className="h-6 w-6 rounded-full overflow-hidden mr-2 border border-primary">
                        <img
                          src={user.profileImage}
                          alt="Profile"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://ui-avatars.com/api/?name=${
                              user.name || user.username
                            }&background=random&color=fff`;
                          }}
                        />
                      </div>
                    ) : (
                      <User className="mr-2 h-4 w-4" />
                    )}
                    <span>{user.name || user.username}</span>
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel>
                    Hello, {user.name || user.username}
                  </DropdownMenuLabel>
                  <div className="px-3 pb-2">
                    <span className="text-xs font-semibold text-orange-500">
                      {user.role === "admin"
                        ? "Admin Account"
                        : user.role === "seller"
                          ? "Seller Account"
                          : "Buyer Account"}
                    </span>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={getDashboardLink()} className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      {user.role === "admin"
                        ? "Admin Dashboard"
                        : user.role === "seller"
                          ? "Seller Dashboard"
                          : "My Profile"}
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "buyer" && (
                    <DropdownMenuItem asChild>
                      <Link href="/buyer/orders" className="cursor-pointer">
                        <ShoppingBag className="mr-2 h-4 w-4" /> My Orders
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user.role === "buyer" && (
                    <DropdownMenuItem asChild>
                      <Link href="/buyer/wishlist" className="cursor-pointer">
                        <Heart className="mr-2 h-4 w-4" /> Wishlist
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {!user ||
              (user.role !== "buyer" && user.role !== "seller" && (
                <Link href="/become-a-seller">
                  <Button
                    variant="link"
                    className="text-white hover:text-gray-200"
                  >
                    Become a Seller
                  </Button>
                </Link>
              ))}

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

            {user && (
              <div className="text-white">
                <NotificationBell />
              </div>
            )}

            <Button
              variant="link"
              className="text-white flex items-center hover:text-gray-200 relative px-6 py-2 text-lg font-semibold"
              onClick={handleCartClick}
            >
              <ShoppingCart className="h-12 w-12 mr-2" />
              <span className="text-2xl font-bold ml-2">Cart</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-primary text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center ml-auto">
            {user && (
              <div className="text-white">
                <NotificationBell />
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-white"
              onClick={handleCartClick}
            >
              <ShoppingCart className="h-10 w-10" />
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
            <div className="flex items-center mb-4 gap-2">
              <Link href="/" className="flex items-center">
                <Logo />
              </Link>
              <Link href="/">
                <Button
                  variant="secondary"
                  className="flex items-center py-1 px-2 bg-white text-primary font-medium rounded-sm hover:bg-gray-100"
                >
                  <HomeIcon className="mr-2 h-4 w-4" />
                  <span>Home</span>
                </Button>
              </Link>
            </div>
            <ul className="space-y-3">
              <li>
                <Link
                  href={user ? getDashboardLink() : "/auth"}
                  className="flex items-center text-white py-1"
                >
                  {user && user.profileImage ? (
                    <div className="h-5 w-5 rounded-full overflow-hidden mr-2 border border-white">
                      <img
                        src={user.profileImage}
                        alt="Profile"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://ui-avatars.com/api/?name=${
                            user.name || user.username
                          }&background=random&color=fff`;
                        }}
                      />
                    </div>
                  ) : (
                    <User className="mr-2 h-5 w-5" />
                  )}
                  {user ? user.name || user.username : "Login / Sign Up"}
                </Link>
              </li>
              {!user ||
                (user.role !== "buyer" && user.role !== "seller" && (
                  <li>
                    <Link
                      href="/become-a-seller"
                      className="flex items-center text-white py-1"
                    >
                      <Store className="mr-2 h-5 w-5" />
                      Become a Seller
                    </Link>
                  </li>
                ))}
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
  // Fetch categories and subcategories (reuse logic from CategoryMegaMenu)
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
  // Sort categories alphabetically
  const sortedCategories = [...categories].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  // Helper to get subcategories for a category, sorted alphabetically
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
