import React, { useState, useEffect } from "react";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatPrice } from "@/lib/utils";
import {
  Search,
  Filter,
  Package,
  Box,
  AlertTriangle,
  Check,
  CheckCircle2,
  ShoppingCart,
  Plus,
  Tag,
  Layers,
  Loader2,
  Download,
  Upload,
  RefreshCw,
  Settings,
  X,
  Eye,
  Edit,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function InventoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [editingProduct, setEditingProduct] = useState<null | number>(null);
  const [editingCategory, setEditingCategory] = useState<string>("");
  const [editingSubcategory, setEditingSubcategory] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [editingCategoryProductId, setEditingCategoryProductId] = useState<
    null | number
  >(null);
  const [editingSubcategoryProductId, setEditingSubcategoryProductId] =
    useState<null | number>(null);
  const [categoryEditValue, setCategoryEditValue] = useState<string>("");
  const [subcategoryEditValue, setSubcategoryEditValue] = useState<string>("");
  const [editingSubcategories, setEditingSubcategories] = useState<any[]>([]);
  const [editingSubcategoriesLoading, setEditingSubcategoriesLoading] =
    useState(false);

  // Fetch product categories to use in filters
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) {
        throw new Error("Failed to fetch categories");
      }
      return res.json();
    },
  });

  // Fetch all subcategories once for client-side filtering (like Edit Product page)
  const { data: allSubcategories = [] } = useQuery({
    queryKey: ["/api/subcategories/all"],
    queryFn: async () => {
      const res = await fetch("/api/subcategories/all");
      if (!res.ok) throw new Error("Failed to fetch subcategories");
      return res.json();
    },
    enabled: !!categories,
  });

  // Function to get subcategories for a given category from allSubcategories
  const getSubcategoriesForCategory = (categoryName: string) => {
    if (!categories || !allSubcategories) return [];
    const categoryObj = categories.find(
      (c: { id: number; name: string }) =>
        c.name.trim().toLowerCase() === categoryName.trim().toLowerCase()
    );
    if (!categoryObj) return [];
    // Only subcategories with parentId == null (level 1)
    return allSubcategories.filter(
      (sub: any) => sub.categoryId === categoryObj.id && sub.parentId == null
    );
  };

  // Fetch subcategories based on selected category
  const { data: subcategories } = useQuery({
    queryKey: ["/api/subcategories", categoryFilter],
    queryFn: async () => {
      // If "all" is selected, don't filter by category
      const categoryParam =
        categoryFilter !== "all"
          ? `?categoryId=${categories?.find((c: { id: number; name: string }) => c.name === categoryFilter)?.id}`
          : "";

      const res = await fetch(`/api/subcategories${categoryParam}`);
      if (!res.ok) {
        throw new Error("Failed to fetch subcategories");
      }
      const data = await res.json();
      console.log(
        `Fetched ${data.subcategories?.length || 0} subcategories for category filter "${categoryFilter}"`
      );
      return data.subcategories || [];
    },
    enabled: !!categories && categoryFilter !== "all",
  });

  // Mutation to update product category and subcategory
  const updateProductMutation = useMutation({
    mutationFn: async ({
      productId,
      category,
      subcategory,
    }: {
      productId: number;
      category: string;
      subcategory: string;
    }) => {
      const response = await apiRequest("PUT", `/api/products/${productId}`, {
        productData: {
          category,
          subcategory1: subcategory,
        },
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Product updated",
        description:
          "Product category and subcategory have been updated successfully",
        variant: "default",
      });
      setEditingProduct(null);
      // INSTANTLY update the cache for products list
      queryClient.setQueryData(
        [
          "/api/seller/products",
          page,
          limit,
          searchQuery,
          categoryFilter,
          stockFilter,
          subcategoryFilter,
        ],
        (oldData: any) => {
          if (!oldData || !oldData.products) return oldData;
          return {
            ...oldData,
            products: oldData.products.map((p: any) =>
              p.id === variables.productId
                ? {
                    ...p,
                    category: variables.category,
                    subcategory1: variables.subcategory,
                  }
                : p
            ),
          };
        }
      );
      // Invalidate seller-specific queries to ensure proper cache isolation
      queryClient.invalidateQueries({
        queryKey: ["/api/seller/products", user?.id],
        exact: false,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update product category",
        variant: "destructive",
      });
    },
  });

  // Function to save category changes
  const saveProductCategoryChanges = () => {
    if (!editingProduct) return;

    updateProductMutation.mutate({
      productId: editingProduct,
      category: editingCategory,
      subcategory: editingSubcategory,
    });
  };

  // Function to save only category
  const saveCategoryChange = (product: any) => {
    updateProductMutation.mutate({
      productId: product.id,
      category: categoryEditValue,
      subcategory: product.subcategory1 || product.subcategory || "",
    });
    setEditingCategoryProductId(null);
    setCategoryEditValue("");
  };
  // Function to save only subcategory
  const saveSubcategoryChange = (product: any) => {
    updateProductMutation.mutate({
      productId: product.id,
      category: product.category,
      subcategory: subcategoryEditValue === "none" ? "" : subcategoryEditValue,
    });
    setEditingSubcategoryProductId(null);
    setSubcategoryEditValue("");
  };

  const {
    data: productsData,
    isLoading: productsLoading,
    refetch,
  } = useQuery({
    queryKey: [
      "/api/seller/products",
      page,
      limit,
      searchQuery,
      categoryFilter,
      stockFilter,
      subcategoryFilter,
    ],
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (searchQuery) {
        queryParams.append("search", searchQuery);
      }

      if (categoryFilter && categoryFilter !== "all") {
        queryParams.append("category", categoryFilter);
      }

      if (subcategoryFilter && subcategoryFilter !== "all") {
        queryParams.append("subcategory", subcategoryFilter);
      }

      if (stockFilter && stockFilter !== "all") {
        queryParams.append("stockFilter", stockFilter);
      }

      const response = await apiRequest(
        "GET",
        `/api/seller/products?${queryParams.toString()}`
      );

      return response.json();
    },
  });

  const products = productsData?.products || [];
  const totalPages = productsData?.totalPages || 1;

  // Debug: Log product data to understand structure
  console.log("All Products Data:", products);
  if (products.length > 0) {
    console.log("First Product:", products[0]);
    console.log("Image Data:", {
      imageUrl: products[0].imageUrl,
      images: products[0].images,
      mainImage: products[0].mainImage,
    });
  }

  return (
    <SellerDashboardLayout>
      <div className="container mx-auto py-4 md:py-6 px-4 md:px-0">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 md:mb-6 gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">
              Inventory Management
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Manage your product inventory and stock levels
            </p>
          </div>
          <div className="flex gap-2 md:gap-3">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button size="sm" asChild>
              <Link href="/seller/products/add">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Add Product</span>
                <span className="sm:hidden">Add</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Mobile Filter Toggle */}
        <div className="md:hidden mb-4">
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => setShowFilters(!showFilters)}
          >
            <span className="flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </span>
            {showFilters ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-4 md:mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg">
              Filter Products
            </CardTitle>
            <CardDescription className="text-sm">
              Use the filters below to find specific products in your inventory
            </CardDescription>
          </CardHeader>
          <CardContent
            className={`${showFilters ? "block" : "hidden"} md:block`}
          >
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="search" className="mb-2 block text-sm">
                  Search
                </Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search products..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="category" className="mb-2 block text-sm">
                  Category
                </Label>
                <Select
                  value={categoryFilter}
                  onValueChange={(value) => {
                    setCategoryFilter(value);
                    // Reset subcategory filter when category changes
                    setSubcategoryFilter("all");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories?.map(
                      (category: { id: number; name: string }) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subcategory" className="mb-2 block text-sm">
                  Subcategory
                </Label>
                <Select
                  value={subcategoryFilter}
                  onValueChange={setSubcategoryFilter}
                  disabled={categoryFilter === "all"}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        categoryFilter === "all"
                          ? "Select a category first"
                          : "All Subcategories"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subcategories</SelectItem>
                    {subcategories?.map(
                      (subcategory: { id: number; name: string }) => (
                        <SelectItem
                          key={subcategory.id}
                          value={subcategory.name}
                        >
                          {subcategory.name}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="stock" className="mb-2 block text-sm">
                  Stock Status
                </Label>
                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="in-stock">In Stock</SelectItem>
                    <SelectItem value="low-stock">Low Stock (≤ 10)</SelectItem>
                    <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSearchQuery("");
                    setCategoryFilter("all");
                    setSubcategoryFilter("all");
                    setStockFilter("all");
                    setPage(1);
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white rounded-md shadow">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Subcategory
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {productsLoading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                      Loading products...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                      No products found matching your filters
                    </td>
                  </tr>
                ) : (
                  products.map((product: any) => (
                    <tr key={product.id} className="hover:bg-muted/25">
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded bg-gray-100 border">
                            {(() => {
                              let imagesList: string[] = [];
                              if (product.images) {
                                try {
                                  if (typeof product.images === "string") {
                                    // Try to parse the JSON string
                                    imagesList = JSON.parse(product.images);
                                    if (!Array.isArray(imagesList))
                                      imagesList = [];
                                  } else if (Array.isArray(product.images)) {
                                    imagesList = product.images;
                                  }
                                } catch (error) {
                                  console.error(
                                    "Error parsing product images:",
                                    error
                                  );
                                  imagesList = [];
                                }
                              }

                              // Use the first image from the parsed list, fallback to imageUrl, or show no image message
                              if (imagesList && imagesList.length > 0) {
                                return (
                                  <img
                                    src={imagesList[0]}
                                    alt={product.name}
                                    className="h-10 w-10 object-cover rounded"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src =
                                        "https://placehold.co/100x100?text=No+Image";
                                    }}
                                  />
                                );
                              } else if (product.imageUrl) {
                                return (
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="h-10 w-10 object-cover rounded"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src =
                                        "https://placehold.co/100x100?text=No+Image";
                                    }}
                                  />
                                );
                              } else {
                                return (
                                  <div className="h-10 w-10 flex items-center justify-center text-muted-foreground text-xs">
                                    No Image
                                  </div>
                                );
                              }
                            })()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {product.sku || "-"}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {editingCategoryProductId === product.id ? (
                          <div className="flex items-center space-x-2">
                            <Select
                              value={categoryEditValue || product.category}
                              onValueChange={setCategoryEditValue}
                            >
                              <SelectTrigger className="h-8 w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {categories?.map(
                                  (category: { id: number; name: string }) => (
                                    <SelectItem
                                      key={category.id}
                                      value={category.name}
                                    >
                                      {category.name}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-6 px-2 text-primary"
                              onClick={() => saveCategoryChange(product)}
                              disabled={updateProductMutation.isPending}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-6 px-2"
                              onClick={() => {
                                setEditingCategoryProductId(null);
                                setCategoryEditValue("");
                              }}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span>{product.category}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                setEditingCategoryProductId(product.id);
                                setCategoryEditValue(product.category);
                                setEditingSubcategoryProductId(null);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {editingSubcategoryProductId === product.id ? (
                          <div className="flex items-center space-x-2">
                            <Select
                              value={
                                typeof subcategoryEditValue === "string" &&
                                subcategoryEditValue.trim().length > 0
                                  ? subcategoryEditValue.trim()
                                  : "none"
                              }
                              onValueChange={setSubcategoryEditValue}
                              disabled={!product.category}
                            >
                              <SelectTrigger className="h-8 w-full">
                                <SelectValue placeholder="Select subcategory" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {Array.isArray(editingSubcategories) &&
                                  editingSubcategories
                                    .filter(
                                      (sub: { id: number; name: any }) =>
                                        typeof sub.name === "string" &&
                                        !!sub.name.trim()
                                    )
                                    .map(
                                      (subcategory: {
                                        id: number;
                                        name: string;
                                      }) => {
                                        const value = subcategory.name.trim();
                                        if (!value) return null;
                                        return (
                                          <SelectItem
                                            key={subcategory.id}
                                            value={value}
                                          >
                                            {value}
                                          </SelectItem>
                                        );
                                      }
                                    )}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-6 px-2 text-primary"
                              onClick={() => saveSubcategoryChange(product)}
                              disabled={updateProductMutation.isPending}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-6 px-2"
                              onClick={() => {
                                setEditingSubcategoryProductId(null);
                                setSubcategoryEditValue("");
                              }}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span>
                              {product.subcategory1 ||
                                product.subcategory ||
                                "-"}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                if (!categories || !allSubcategories) return;
                                setEditingSubcategoryProductId(product.id);
                                const subcat = (
                                  product.subcategory1 ||
                                  product.subcategory ||
                                  ""
                                ).trim();
                                setSubcategoryEditValue(
                                  subcat.length > 0 ? subcat : ""
                                );
                                setEditingCategoryProductId(null);
                                const subs = getSubcategoriesForCategory(
                                  product.category
                                );
                                setEditingSubcategories(subs);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700 font-medium">
                        {formatPrice(product.price)}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {(product.stockQuantity ?? product.stock) <= 0 ? (
                          <span className="text-red-600 font-medium">
                            Out of stock
                          </span>
                        ) : (product.stockQuantity ?? product.stock) <= 10 ? (
                          <span className="text-amber-600 font-medium">
                            Low stock ({product.stockQuantity ?? product.stock}{" "}
                            left)
                          </span>
                        ) : (
                          <span className="text-green-600 font-medium">
                            In stock ({product.stockQuantity ?? product.stock})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {product.approved ? (
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-800 hover:bg-green-200"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-amber-100 text-amber-800 hover:bg-amber-200"
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-right space-x-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/seller/products/edit/${product.id}`}>
                            Edit
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/product/${product.id}`}>View</Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-white border-t">
              <div className="flex items-center">
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{page}</span> of{" "}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Product Cards */}
        <div className="md:hidden space-y-4">
          {productsLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Loading products...
              </p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No products found matching your filters
              </p>
            </div>
          ) : (
            products.map((product: any) => (
              <Card key={product.id} className="bg-white">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="h-16 w-16 flex-shrink-0 rounded bg-gray-100 border">
                      {(() => {
                        let imagesList: string[] = [];
                        if (product.images) {
                          try {
                            if (typeof product.images === "string") {
                              imagesList = JSON.parse(product.images);
                              if (!Array.isArray(imagesList)) imagesList = [];
                            } else if (Array.isArray(product.images)) {
                              imagesList = product.images;
                            }
                          } catch (error) {
                            console.error(
                              "Error parsing product images:",
                              error
                            );
                            imagesList = [];
                          }
                        }

                        if (imagesList && imagesList.length > 0) {
                          return (
                            <img
                              src={imagesList[0]}
                              alt={product.name}
                              className="h-16 w-16 object-cover rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "https://placehold.co/100x100?text=No+Image";
                              }}
                            />
                          );
                        } else if (product.imageUrl) {
                          return (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="h-16 w-16 object-cover rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "https://placehold.co/100x100?text=No+Image";
                              }}
                            />
                          );
                        } else {
                          return (
                            <div className="h-16 w-16 flex items-center justify-center text-muted-foreground text-xs">
                              No Image
                            </div>
                          );
                        }
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-medium text-gray-900 mb-1">
                        {product.name}
                      </CardTitle>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">SKU:</span>
                          <span>{product.sku || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Price:</span>
                          <span className="font-medium">
                            {formatPrice(product.price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Category and Subcategory */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-muted-foreground">
                          Category:
                        </span>
                        <span className="text-sm mt-1 flex items-center space-x-2">
                          {editingCategoryProductId === product.id ? (
                            <>
                              <Select
                                value={categoryEditValue || product.category}
                                onValueChange={setCategoryEditValue}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories?.map(
                                    (category: {
                                      id: number;
                                      name: string;
                                    }) => (
                                      <SelectItem
                                        key={category.id}
                                        value={category.name}
                                      >
                                        {category.name}
                                      </SelectItem>
                                    )
                                  )}
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-6 px-2 text-primary"
                                onClick={() => saveCategoryChange(product)}
                                disabled={updateProductMutation.isPending}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-6 px-2"
                                onClick={() => {
                                  setEditingCategoryProductId(null);
                                  setCategoryEditValue("");
                                }}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <span>{product.category}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  setEditingCategoryProductId(product.id);
                                  setCategoryEditValue(product.category);
                                  setEditingSubcategoryProductId(null);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-muted-foreground">
                          Subcategory:
                        </span>
                        <span className="text-sm mt-1 flex items-center space-x-2">
                          {editingSubcategoryProductId === product.id ? (
                            <>
                              <Select
                                value={
                                  typeof subcategoryEditValue === "string" &&
                                  subcategoryEditValue.trim().length > 0
                                    ? subcategoryEditValue.trim()
                                    : "none"
                                }
                                onValueChange={setSubcategoryEditValue}
                                disabled={!product.category}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Select subcategory" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  {Array.isArray(editingSubcategories) &&
                                    editingSubcategories
                                      .filter(
                                        (sub: { id: number; name: any }) =>
                                          typeof sub.name === "string" &&
                                          !!sub.name.trim()
                                      )
                                      .map(
                                        (subcategory: {
                                          id: number;
                                          name: string;
                                        }) => {
                                          const value = subcategory.name.trim();
                                          if (!value) return null;
                                          if (
                                            typeof value !== "string" ||
                                            value === ""
                                          ) {
                                            console.error(
                                              "Bad SelectItem value:",
                                              value,
                                              subcategory
                                            );
                                            return null;
                                          }
                                          return (
                                            <SelectItem
                                              key={subcategory.id}
                                              value={value}
                                            >
                                              {value}
                                            </SelectItem>
                                          );
                                        }
                                      )}
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-6 px-2 text-primary"
                                onClick={() => saveSubcategoryChange(product)}
                                disabled={updateProductMutation.isPending}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-6 px-2"
                                onClick={() => {
                                  setEditingSubcategoryProductId(null);
                                  setSubcategoryEditValue("");
                                }}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <span>
                                {product.subcategory1 ||
                                  product.subcategory ||
                                  "-"}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  if (!categories || !allSubcategories) return;
                                  setEditingSubcategoryProductId(product.id);
                                  const subcat = (
                                    product.subcategory1 ||
                                    product.subcategory ||
                                    ""
                                  ).trim();
                                  setSubcategoryEditValue(
                                    subcat.length > 0 ? subcat : ""
                                  );
                                  setEditingCategoryProductId(null);
                                  const subs = getSubcategoriesForCategory(
                                    product.category
                                  );
                                  setEditingSubcategories(subs);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Stock Status */}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-muted-foreground">
                        Stock:
                      </span>
                      <span className="text-sm mt-1">
                        {(product.stockQuantity ?? product.stock) <= 0 ? (
                          <span className="text-red-600 font-medium">
                            Out of stock
                          </span>
                        ) : (product.stockQuantity ?? product.stock) <= 10 ? (
                          <span className="text-amber-600 font-medium">
                            Low stock ({product.stockQuantity ?? product.stock}{" "}
                            left)
                          </span>
                        ) : (
                          <span className="text-green-600 font-medium">
                            In stock ({product.stockQuantity ?? product.stock})
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-muted-foreground">
                        Status:
                      </span>
                      <div className="mt-1">
                        {product.approved ? (
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-800"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-amber-100 text-amber-800"
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Edit Actions */}
                    {editingCategoryProductId === product.id ||
                    editingSubcategoryProductId === product.id ? (
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => {
                            setEditingCategoryProductId(null);
                            setCategoryEditValue("");
                            setEditingSubcategoryProductId(null);
                            setSubcategoryEditValue("");
                          }}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => {
                            if (editingCategoryProductId === product.id) {
                              saveCategoryChange(product);
                            } else if (
                              editingSubcategoryProductId === product.id
                            ) {
                              saveSubcategoryChange(product);
                            }
                          }}
                          disabled={updateProductMutation.isPending}
                        >
                          {updateProductMutation.isPending ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3 mr-1" />
                          )}
                          Save
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => {
                            setEditingCategoryProductId(null);
                            setCategoryEditValue("");
                            setEditingSubcategoryProductId(null);
                            setSubcategoryEditValue("");
                          }}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => {
                            setEditingProduct(product.id);
                            setEditingCategory(product.category);
                            setEditingSubcategory(
                              product.subcategory1 || product.subcategory || ""
                            );
                          }}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="pt-0">
                  <div className="flex gap-2 w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <Link href={`/seller/products/edit/${product.id}`}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <Link href={`/product/${product.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))
          )}

          {/* Mobile Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between py-4">
              <p className="text-sm text-gray-700">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-sm md:text-base">
                <div className="w-6 h-6 md:w-8 md:h-8 mr-2 flex items-center justify-center rounded-full bg-amber-100">
                  <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 text-amber-600" />
                </div>
                Low Stock Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl md:text-3xl font-bold">
                {
                  products.filter(
                    (p: any) =>
                      (p.stockQuantity ?? p.stock) > 0 &&
                      (p.stockQuantity ?? p.stock) <= 10
                  ).length
                }
              </p>
              <p className="text-xs md:text-sm text-muted-foreground">
                Products with 10 or fewer items in stock
              </p>
            </CardContent>
            <CardFooter>
              <Button
                variant="link"
                className="px-0 text-xs md:text-sm"
                onClick={() => setStockFilter("low-stock")}
              >
                View low stock items
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-sm md:text-base">
                <div className="w-6 h-6 md:w-8 md:h-8 mr-2 flex items-center justify-center rounded-full bg-red-100">
                  <Package className="h-3 w-3 md:h-4 md:w-4 text-red-600" />
                </div>
                Out of Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl md:text-3xl font-bold">
                {
                  products.filter((p: any) => (p.stockQuantity ?? p.stock) <= 0)
                    .length
                }
              </p>
              <p className="text-xs md:text-sm text-muted-foreground">
                Products that are currently unavailable
              </p>
            </CardContent>
            <CardFooter>
              <Button
                variant="link"
                className="px-0 text-xs md:text-sm"
                onClick={() => setStockFilter("out-of-stock")}
              >
                Manage out of stock items
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-sm md:text-base">
                <div className="w-6 h-6 md:w-8 md:h-8 mr-2 flex items-center justify-center rounded-full bg-green-100">
                  <Tag className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                </div>
                Total Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl md:text-3xl font-bold">
                {productsData?.total || 0}
              </p>
              <p className="text-xs md:text-sm text-muted-foreground">
                Total products in your inventory
              </p>
            </CardContent>
            <CardFooter>
              <Button
                variant="link"
                className="px-0 text-xs md:text-sm"
                asChild
              >
                <Link href="/seller/smart-inventory">
                  View inventory analytics
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </SellerDashboardLayout>
  );
}
