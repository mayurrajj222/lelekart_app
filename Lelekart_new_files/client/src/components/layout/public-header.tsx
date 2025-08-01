import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Menu, X, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimplifiedSearch } from "@/components/ui/simplified-search";
import { useCart } from "@/context/cart-context";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { Logo } from "./logo";

export function PublicHeader() {
  const { toggleCart, cartItems } = useCart();
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

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
    <header className="bg-primary text-white">
      {/* Desktop Header */}
      <div className="container mx-auto px-4 py-4 hidden md:block">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/">
              <Logo />
            </Link>

            <div className="flex-grow max-w-xl flex items-center">
              {/* All Categories Dropdown (left of search bar) */}
              <div className="mr-2 hidden md:block">
                <AllCategoriesDropdown />
              </div>
              <SimplifiedSearch />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              className="text-white hover:text-white hover:bg-primary-foreground/10 px-8 py-4 text-2xl font-bold rounded-lg shadow-lg border-2 border-white"
              onClick={() => setLocation("/auth")}
            >
              Login
            </Button>

            <Button
              variant="outline"
              className="text-white border-white hover:bg-white hover:text-primary px-8 py-4 text-2xl font-bold rounded-lg shadow-lg border-4 border-white"
              onClick={handleCartClick}
              title="View Cart"
            >
              <ShoppingCart className="h-14 w-14" /> <span className="text-3xl font-extrabold ml-4">Cart</span>
              {cartItemCount > 0 && (
                <span className="ml-2 bg-white text-primary rounded-full h-7 w-7 flex items-center justify-center text-lg font-bold">
                  {cartItemCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white hover:text-gray-200"
          >
            <Menu size={24} />
          </button>

          <Link href="/">
            <Logo />
          </Link>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleCartClick}
              className="relative text-white hover:text-gray-200"
              title="View Cart"
            >
              <ShoppingCart size={32} />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-white text-primary rounded-full h-5 w-5 flex items-center justify-center text-xs">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="mt-3">
          <SimplifiedSearch />
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
            <div className="bg-primary h-full w-3/4 max-w-xs p-5">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Menu</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white hover:text-gray-200"
                >
                  <X size={24} />
                </button>
              </div>

              <nav className="space-y-4">
                <button
                  onClick={() => navigateTo("/")}
                  className="block w-full text-left py-2 border-b border-primary-foreground/20"
                >
                  Home
                </button>
                <button
                  onClick={() => navigateTo("/auth")}
                  className="block w-full text-left py-2 border-b border-primary-foreground/20"
                >
                  Login
                </button>
              </nav>
            </div>
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
