import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Menu, X, ChevronDown, User, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "./logo";

export function Header() {
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useLocation();

  // Simple functions that don't require the actual auth context
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Search for:", searchQuery);
  };

  const handleLogout = () => {
    // Simple redirect for now
    setLocation("/auth");
  };

  const getDashboardLink = () => {
    return "/auth";
  };

  return (
    <header className="bg-primary text-white sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center py-2">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center mb-2 md:mb-0">
              <Logo />
            </Link>
          </div>

          {/* Search Bar */}
          <div className="w-full md:w-5/12 md:ml-4 relative mb-2 md:mb-0 flex items-center">
            {/* All Categories Dropdown (left of search bar) */}
            <div className="mr-2 hidden md:block">
              <AllCategoriesDropdown />
            </div>
            <form onSubmit={handleSearch} className="relative flex-1">
              <Input
                type="text"
                placeholder="Search for Products, brands and more"
                className="w-full py-2 px-4 text-gray-900 rounded-sm focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary"
              >
                <Search className="h-5 w-5" />
              </Button>
            </form>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center justify-between md:ml-auto space-x-4 md:space-x-6">
            {/* Login Button or User Menu */}
            {!user ? (
              <a
                href="/auth"
                className="flex items-center py-1 px-4 bg-white text-primary font-medium rounded hover:bg-gray-100"
              >
                <User className="h-10 w-10 mr-2" />
                <span className="text-2xl font-bold ml-2">Login</span>
              </a>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    className="flex items-center py-1 px-4 bg-white text-primary font-medium rounded hover:bg-gray-100"
                  >
                    <span>{user.name || user.username}</span>
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuItem asChild>
                    <Link href={getDashboardLink()} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer"
                  >
                    <span className="mr-2">🚪</span> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

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
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center ml-auto">
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
                <a href="/auth" className="flex items-center text-white py-1">
                  <User className="h-5 w-5 mr-2" />
                  Login
                </a>
              </li>
              <li>
                <Link
                  href="/help"
                  className="flex items-center text-white py-1"
                >
                  <span className="mr-2 text-white">📱</span>
                  Download App
                </Link>
              </li>
              <li>
                <Link
                  href="/help"
                  className="flex items-center text-white py-1"
                >
                  <span className="mr-2 text-white">🎧</span>
                  24x7 Customer Care
                </Link>
              </li>
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
