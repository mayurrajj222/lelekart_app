import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductCard } from "@/components/ui/product-card";
import { Loader2 } from "lucide-react";
import { CartProvider } from "@/context/cart-context";
import { Pagination } from "@/components/ui/pagination";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, Edit, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import {
  LayoutGrid,
  List,
  Table,
  AppWindow,
  Grid,
  Rows,
  Columns,
  Square,
  SquareStack,
  AlignJustify,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Product {
  id: number;
  name: string;
  price: number;
  sku?: string;
  imageUrl?: string;
  image_url?: string;
  image?: string;
  images?: string;
  description: string;
  category: string;
  subcategory?: string;
  subcategory1?: string;
  subcategory2?: string;
  sellerId: number;
  approved: boolean;
  createdAt: string;
  specifications?: string | null;
  purchasePrice?: number | null;
  color?: string | null;
  size?: string | null;
  stock?: number;
}

export default function SellerProductsPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [subcategory, setSubcategory] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

  // View mode state
  const VIEW_MODES = [
    { key: "xlarge", label: "Extra Large Icons", icon: SquareStack },
    { key: "large", label: "Large Icons", icon: Square },
    { key: "medium", label: "Medium", icon: Grid },
    { key: "small", label: "Small", icon: Columns },
    { key: "tiles", label: "Tiles", icon: LayoutGrid },
    { key: "list", label: "List", icon: List },
    { key: "details", label: "Details", icon: Table },
    { key: "continue", label: "Continue", icon: AppWindow },
    { key: "all", label: "All", icon: Rows },
  ];
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem("sellerProductsViewMode") || "medium";
  });
  useEffect(() => {
    localStorage.setItem("sellerProductsViewMode", viewMode);
  }, [viewMode]);

  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Add state for inline editing
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<string>("");
  const [editingSubcategory, setEditingSubcategory] = useState<string>("");
  const queryClient = useQueryClient();

  if (!user) {
    return (
      <div className="flex justify-center items-center h-60">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  // Function to get product image URL
  const getProductImageUrl = (product: Product): string => {
    if (product.imageUrl) {
      return product.imageUrl;
    }
    if (product.image_url) {
      return product.image_url;
    }
    if (product.images) {
      try {
        if (typeof product.images === "string") {
          const parsedImages = JSON.parse(product.images);
          if (
            parsedImages &&
            Array.isArray(parsedImages) &&
            parsedImages.length > 0
          ) {
            return parsedImages[0];
          }
        }
      } catch (error) {
        console.error("Failed to parse product images:", error);
      }
    }
    return "https://via.placeholder.com/300x300?text=Product";
  };

  // Helper to get subcategory display value
  const getSubcategoryDisplay = (product: Product): string => {
    return (
      product.subcategory1 || product.subcategory2 || product.subcategory || "-"
    );
  };

  // Helper to get level 1 subcategories for a category
  const getLevel1Subcategories = (categoryName: string) => {
    if (!categoriesData || !subcategoriesData) return [];
    const categoryObj = categoriesData.find(
      (c: { id: number; name: string }) =>
        c.name.trim().toLowerCase() === categoryName.trim().toLowerCase()
    );
    if (!categoryObj) return [];
    return subcategoriesData.filter(
      (sub: any) => sub.categoryId === categoryObj.id && sub.parentId == null
    );
  };

  // Mutation to update product category/subcategory
  const updateCategoryMutation = useMutation({
    mutationFn: async ({
      productId,
      category,
      subcategory,
    }: {
      productId: number;
      category: string;
      subcategory: string;
    }) => {
      // Fetch current product data
      const currentRes = await fetch(`/api/products/${productId}`);
      if (!currentRes.ok)
        throw new Error("Failed to fetch current product data");
      const currentProduct = await currentRes.json();

      // Prepare updated product data
      const updatedProduct = {
        ...currentProduct,
        category,
        subcategory1: subcategory, // update subcategory1 field
      };
      // Ensure required fields are not undefined
      const requiredFields = [
        "gstRate",
        "subcategory1",
        "subcategory2",
        "category",
        "price",
        "name",
        "stock",
        "sku",
      ];
      for (const field of requiredFields) {
        if (updatedProduct[field] === undefined) {
          updatedProduct[field] = null;
        }
      }
      // Remove fields that should not be sent back to the backend
      const dateFields = ["createdAt", "updatedAt", "deletedAt"];
      for (const field of dateFields) {
        if (field in updatedProduct) {
          delete updatedProduct[field];
        }
      }
      // Send full product object, wrapped in productData
      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productData: updatedProduct }),
      });
      if (!response.ok) {
        throw new Error("Failed to update product category");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Product updated",
        description:
          "Product category and subcategory have been updated successfully",
        variant: "default",
      });
      setEditingProductId(null);
      setEditingCategory("");
      setEditingSubcategory("");
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

  // Save handlers
  const saveCategoryChange = (product: Product) => {
    updateCategoryMutation.mutate({
      productId: product.id,
      category: editingCategory,
      subcategory: product.subcategory1 || product.subcategory || "",
    });
  };
  const saveSubcategoryChange = (product: Product) => {
    updateCategoryMutation.mutate({
      productId: product.id,
      category: product.category,
      subcategory: editingSubcategory === "none" ? "" : editingSubcategory,
    });
  };

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  // Fetch subcategories
  const { data: subcategoriesData } = useQuery({
    queryKey: ["/api/subcategories/all"],
    queryFn: async () => {
      const res = await fetch("/api/subcategories/all");
      if (!res.ok) throw new Error("Failed to fetch subcategories");
      return res.json();
    },
  });

  // Fetch products for this seller
  const {
    data: productsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "/api/seller/products",
      user?.id,
      {
        page: currentPage,
        limit: pageSize,
        search,
        category,
        subcategory,
        stockFilter,
      },
    ],
    enabled: !!user?.id,
    queryFn: async () => {
      let url = `/api/seller/products?page=${currentPage}&limit=${pageSize}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (category && category !== "all")
        url += `&category=${encodeURIComponent(category)}`;
      if (subcategory && subcategory !== "all")
        url += `&subcategory=${encodeURIComponent(subcategory)}`;
      if (stockFilter && stockFilter !== "all")
        url += `&stock=${encodeURIComponent(stockFilter)}`;
      url += `&sellerId=${user.id}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

  useEffect(() => {
    if (productsData && productsData.totalPages) {
      setTotalPages(productsData.totalPages);
    }
  }, [productsData]);

  // Delete product handler
  const handleDeleteProduct = async (id: number) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this product? This action cannot be undone."
      )
    )
      return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete product");
      toast({
        title: "Product deleted",
        description: "The product was deleted successfully.",
      });
      // Refetch products (react-query will do this automatically if you use invalidateQueries, but here just reload)
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message || "Could not delete product.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Bulk delete handler
  const handleBulkDeleteProducts = async () => {
    if (selectedProducts.length === 0) return;
    setIsBulkDeleteDialogOpen(false);
    for (const id of selectedProducts) {
      await handleDeleteProduct(id);
    }
    setSelectedProducts([]);
  };

  return (
    <SellerDashboardLayout>
      <CartProvider>
        <div className="container mx-auto py-2">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">My Products</h1>
          </div>
          {/* VIEW MODE SWITCHER */}
          <div className="flex flex-wrap gap-2 mb-2 items-center">
            <span className="text-sm font-medium mr-2">View:</span>
            {VIEW_MODES.map((mode) => {
              const Icon = mode.icon;
              return (
                <Button
                  key={mode.key}
                  variant={viewMode === mode.key ? "default" : "outline"}
                  size="icon"
                  className={
                    viewMode === mode.key ? "bg-primary text-white" : ""
                  }
                  title={mode.label}
                  onClick={() => setViewMode(mode.key)}
                >
                  <Icon className="h-5 w-5" />
                </Button>
              );
            })}
            <span className="ml-4 text-xs text-muted-foreground">
              ({VIEW_MODES.find((m) => m.key === viewMode)?.label})
            </span>
          </div>
          {/* Bulk Delete Button */}
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="destructive"
              disabled={selectedProducts.length === 0}
              onClick={() => setIsBulkDeleteDialogOpen(true)}
              className="text-xs"
            >
              Delete Selected
              {selectedProducts.length > 0 && ` (${selectedProducts.length})`}
            </Button>
            <Checkbox
              checked={
                productsData &&
                productsData.products &&
                selectedProducts.length === productsData.products.length
              }
              onCheckedChange={(checked) => {
                if (checked && productsData && productsData.products) {
                  setSelectedProducts(
                    productsData.products.map((p: Product) => p.id)
                  );
                } else {
                  setSelectedProducts([]);
                }
              }}
              className="ml-2"
            />
            <span className="text-xs">Select All</span>
          </div>
          <div className="flex gap-2 mb-2">
            <input
              className="border px-3 py-2 rounded w-full"
              placeholder="Search products..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
            <Select
              value={category}
              onValueChange={(value) => {
                setCategory(value);
                setSubcategory("all");
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categoriesData?.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={subcategory}
              onValueChange={(value) => {
                setSubcategory(value);
                setCurrentPage(1);
              }}
              disabled={category === "all"}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Subcategory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subcategories</SelectItem>
                {subcategoriesData
                  ?.filter((sub: any) => {
                    if (category === "all") return true;
                    const catObj = categoriesData?.find(
                      (c: any) => c.name === category
                    );
                    return sub.categoryId === catObj?.id;
                  })
                  .map((sub: any) => (
                    <SelectItem key={sub.id} value={sub.name}>
                      {sub.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : error ? (
            <Card className="p-6 text-center">
              <p className="text-red-500 mb-4">
                Error loading products. Please try again.
              </p>
              <Button onClick={() => window.location.reload()}>Refresh</Button>
            </Card>
          ) : productsData &&
            productsData.products &&
            productsData.products.length > 0 ? (
            <>
              {(() => {
                const products = productsData.products;
                // Extra Large Icons
                if (viewMode === "xlarge") {
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                      {products.map((product: Product) => (
                        <div key={product.id} className="p-2">
                          <div className="flex items-center mb-2">
                            <Checkbox
                              checked={selectedProducts.includes(product.id)}
                              onCheckedChange={() => {
                                setSelectedProducts((prev) =>
                                  prev.includes(product.id)
                                    ? prev.filter((id) => id !== product.id)
                                    : [...prev, product.id]
                                );
                              }}
                              className="mr-2"
                            />
                            <img
                              src={getProductImageUrl(product)}
                              alt={product.name}
                              className="w-full h-48 object-cover rounded-lg border"
                            />
                          </div>
                          <div className="mt-2 text-center font-bold text-lg">
                            {product.name}
                          </div>
                          <div className="flex justify-center mt-1">
                            <Link href={`/seller/products/edit/${product.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1 text-xs h-7 px-2"
                              >
                                <Edit className="h-4 w-4 mr-1" /> Edit
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 ml-1"
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={deletingId === product.id}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }
                // Large Icons
                if (viewMode === "large") {
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                      {products.map((product: Product) => (
                        <div key={product.id} className="p-2">
                          <div className="flex items-center mb-2">
                            <Checkbox
                              checked={selectedProducts.includes(product.id)}
                              onCheckedChange={() => {
                                setSelectedProducts((prev) =>
                                  prev.includes(product.id)
                                    ? prev.filter((id) => id !== product.id)
                                    : [...prev, product.id]
                                );
                              }}
                              className="mr-2"
                            />
                            <img
                              src={getProductImageUrl(product)}
                              alt={product.name}
                              className="w-full h-40 object-cover rounded-md border"
                            />
                          </div>
                          <div className="mt-1 text-center font-semibold">
                            {product.name}
                          </div>
                          <div className="flex justify-center mt-1">
                            <Link href={`/seller/products/edit/${product.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1 text-xs h-7 px-2"
                              >
                                <Edit className="h-4 w-4 mr-1" /> Edit
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 ml-1"
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={deletingId === product.id}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }
                // Medium
                if (viewMode === "medium") {
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {products.map((product: Product, colIndex: number) => (
                        <div key={product.id} className="flex flex-col h-full">
                          <div className="flex items-center mb-2">
                            <Checkbox
                              checked={selectedProducts.includes(product.id)}
                              onCheckedChange={() => {
                                setSelectedProducts(prev =>
                                  prev.includes(product.id)
                                    ? prev.filter(id => id !== product.id)
                                    : [...prev, product.id]
                                );
                              }}
                              className="mr-2"
                            />
                          </div>
                          <div className="flex-1">
                            <ProductCard
                              product={{
                                ...product,
                                imageUrl: getProductImageUrl(product),
                              } as any}
                              showAddToCart={false}
                              priority={colIndex === 0}
                            />
                          </div>
                          <div className="flex flex-col items-center mt-2">
                            {product.approved ? (
                              <Badge
                                variant="outline"
                                className="bg-green-100 text-green-800 hover:bg-green-200 mb-1"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-amber-100 text-amber-800 hover:bg-amber-200 mb-1"
                              >
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                            <Link href={`/seller/products/edit/${product.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1 text-xs h-7 px-2 mt-1"
                              >
                                <Edit className="h-4 w-4 mr-1" /> Edit
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 ml-1"
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={deletingId === product.id}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }
                // Small
                if (viewMode === "small") {
                  return (
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {products.map((product: Product) => (
                        <div key={product.id} className="p-1">
                          <div className="flex items-center mb-2">
                            <Checkbox
                              checked={selectedProducts.includes(product.id)}
                              onCheckedChange={() => {
                                setSelectedProducts((prev) =>
                                  prev.includes(product.id)
                                    ? prev.filter((id) => id !== product.id)
                                    : [...prev, product.id]
                                );
                              }}
                              className="mr-2"
                            />
                            <img
                              src={getProductImageUrl(product)}
                              alt={product.name}
                              className="w-full h-20 object-cover rounded border"
                            />
                          </div>
                          <div className="flex flex-col items-center mt-1">
                            <Link href={`/seller/products/edit/${product.id}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 ml-1"
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={deletingId === product.id}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }
                // Tiles
                if (viewMode === "tiles") {
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {products.map((product: Product) => (
                        <div key={product.id} className="p-2">
                          <div className="flex items-center mb-2">
                            <Checkbox
                              checked={selectedProducts.includes(product.id)}
                              onCheckedChange={() => {
                                setSelectedProducts((prev) =>
                                  prev.includes(product.id)
                                    ? prev.filter((id) => id !== product.id)
                                    : [...prev, product.id]
                                );
                              }}
                              className="mr-2"
                            />
                            <img
                              src={getProductImageUrl(product)}
                              alt={product.name}
                              className="w-full h-32 object-cover rounded border"
                            />
                          </div>
                          <div className="mt-1 text-center font-medium">
                            {product.name}
                          </div>
                          <div className="text-xs text-center text-muted-foreground">
                            {product.category}
                          </div>
                          <div className="flex justify-center mt-1">
                            <Link href={`/seller/products/edit/${product.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1 text-xs h-7 px-2"
                              >
                                <Edit className="h-4 w-4 mr-1" /> Edit
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 ml-1"
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={deletingId === product.id}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }
                // List
                if (viewMode === "list") {
                  return (
                    <div className="divide-y border rounded-md">
                      {products.map((product: Product) => (
                        <div
                          key={product.id}
                          className="flex items-center gap-4 p-3 hover:bg-muted/30"
                        >
                          <Checkbox
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={() => {
                              setSelectedProducts((prev) =>
                                prev.includes(product.id)
                                  ? prev.filter((id) => id !== product.id)
                                  : [...prev, product.id]
                              );
                            }}
                          />
                          <img
                            src={getProductImageUrl(product)}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded border"
                          />
                          <div className="flex-1">
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-muted-foreground">
                              SKU: {product.sku}
                            </div>
                          </div>
                          <div className="text-right font-bold">
                            ₹{product.price.toLocaleString()}
                          </div>
                          <div className="ml-4">
                            <Link href={`/seller/products/edit/${product.id}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 ml-1"
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={deletingId === product.id}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }
                // Details
                if (viewMode === "details") {
                  return (
                    <div className="divide-y border rounded-md">
                      {products.map((product: Product) => (
                        <div
                          key={product.id}
                          className="flex flex-col md:flex-row gap-2 p-3 hover:bg-muted/30"
                        >
                          <Checkbox
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={() => {
                              setSelectedProducts((prev) =>
                                prev.includes(product.id)
                                  ? prev.filter((id) => id !== product.id)
                                  : [...prev, product.id]
                              );
                            }}
                          />
                          <div className="flex items-center gap-3">
                            <img
                              src={getProductImageUrl(product)}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded border"
                            />
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-xs text-muted-foreground">
                                SKU: {product.sku}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Category: {product.category}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Subcategory: {getSubcategoryDisplay(product)}
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between mt-2 md:mt-0">
                            <div className="text-right font-bold">
                              ₹{product.price.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Stock: {product.stock}
                            </div>
                          </div>
                          <div className="ml-4 mt-2 md:mt-0 flex md:block">
                            <Link href={`/seller/products/edit/${product.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1 text-xs h-7 px-2"
                              >
                                <Edit className="h-4 w-4 mr-1" /> Edit
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 ml-1"
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={deletingId === product.id}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }
                // Continue (show as a simple grid, can be customized)
                if (viewMode === "continue") {
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {products.map((product: Product) => (
                        <div key={product.id} className="p-2">
                          <div className="flex items-center mb-2">
                            <Checkbox
                              checked={selectedProducts.includes(product.id)}
                              onCheckedChange={() => {
                                setSelectedProducts((prev) =>
                                  prev.includes(product.id)
                                    ? prev.filter((id) => id !== product.id)
                                    : [...prev, product.id]
                                );
                              }}
                              className="mr-2"
                            />
                            <img
                              src={getProductImageUrl(product)}
                              alt={product.name}
                              className="w-full h-32 object-cover rounded border"
                            />
                          </div>
                          <div className="mt-1 text-center">{product.name}</div>
                          <div className="flex justify-center mt-1">
                            <Link href={`/seller/products/edit/${product.id}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 ml-1"
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={deletingId === product.id}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }
                // All (show all info in a table)
                if (viewMode === "all") {
                  return (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="border px-2 py-1">Image</th>
                            <th className="border px-2 py-1">Name</th>
                            <th className="border px-2 py-1">SKU</th>
                            <th className="border px-2 py-1">Price</th>
                            <th className="border px-2 py-1">Stock</th>
                            <th className="border px-2 py-1">Category</th>
                            <th className="border px-2 py-1">Subcategory</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map((product: Product) => (
                            <tr key={product.id}>
                              <td className="border px-2 py-1">
                                <Checkbox
                                  checked={selectedProducts.includes(
                                    product.id
                                  )}
                                  onCheckedChange={() => {
                                    setSelectedProducts((prev) =>
                                      prev.includes(product.id)
                                        ? prev.filter((id) => id !== product.id)
                                        : [...prev, product.id]
                                    );
                                  }}
                                />
                                <img
                                  src={getProductImageUrl(product)}
                                  alt={product.name}
                                  className="w-12 h-12 object-cover rounded border"
                                />
                              </td>
                              <td className="border px-2 py-1">
                                {product.name}
                              </td>
                              <td className="border px-2 py-1">
                                {product.sku}
                              </td>
                              <td className="border px-2 py-1">
                                ₹{product.price.toLocaleString()}
                              </td>
                              <td className="border px-2 py-1">
                                {product.stock}
                              </td>
                              <td className="border px-2 py-1">
                                {editingProductId === product.id ? (
                                  <div className="flex items-center space-x-2">
                                    <Select
                                      value={
                                        editingCategory || product.category
                                      }
                                      onValueChange={setEditingCategory}
                                    >
                                      <SelectTrigger className="h-8 w-full">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {categoriesData?.map((cat: any) => (
                                          <SelectItem
                                            key={cat.id}
                                            value={cat.name}
                                          >
                                            {cat.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-xs h-6 px-2 text-primary"
                                      onClick={() =>
                                        saveCategoryChange(product)
                                      }
                                      disabled={
                                        updateCategoryMutation.isPending
                                      }
                                    >
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Save
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-xs h-6 px-2"
                                      onClick={() => {
                                        setEditingProductId(null);
                                        setEditingCategory("");
                                      }}
                                    >
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
                                        setEditingProductId(product.id);
                                        setEditingCategory(product.category);
                                        setEditingSubcategory("");
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </td>
                              <td className="border px-2 py-1">
                                {editingProductId === product.id ? (
                                  <div className="flex items-center space-x-2">
                                    <Select
                                      value={
                                        typeof editingSubcategory ===
                                          "string" &&
                                        editingSubcategory.trim().length > 0
                                          ? editingSubcategory.trim()
                                          : "none"
                                      }
                                      onValueChange={setEditingSubcategory}
                                      disabled={!product.category}
                                    >
                                      <SelectTrigger className="h-8 w-full">
                                        <SelectValue placeholder="Select subcategory" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">
                                          None
                                        </SelectItem>
                                        {getLevel1Subcategories(
                                          product.category
                                        ).map((sub: any) => (
                                          <SelectItem
                                            key={sub.id}
                                            value={sub.name}
                                          >
                                            {sub.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-xs h-6 px-2 text-primary"
                                      onClick={() =>
                                        saveSubcategoryChange(product)
                                      }
                                      disabled={
                                        updateCategoryMutation.isPending
                                      }
                                    >
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Save
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-xs h-6 px-2"
                                      onClick={() => {
                                        setEditingProductId(null);
                                        setEditingSubcategory("");
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-2">
                                    <span>
                                      {getSubcategoryDisplay(product)}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 p-0"
                                      onClick={() => {
                                        setEditingProductId(product.id);
                                        setEditingSubcategory(
                                          product.subcategory1 ||
                                            product.subcategory ||
                                            ""
                                        );
                                        setEditingCategory("");
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </td>
                              <td className="border px-2 py-1">
                                <Link
                                  href={`/seller/products/edit/${product.id}`}
                                >
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 ml-1"
                                  onClick={() =>
                                    handleDeleteProduct(product.id)
                                  }
                                  disabled={deletingId === product.id}
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }
                // Default fallback
                return null;
              })()}
              <div className="mt-2 flex justify-end">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              </div>
              <div className="text-sm text-gray-500 text-center mt-1">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, productsData.products.length)}{" "}
                of {productsData.products.length} products
              </div>
            </>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">No products found.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate("/")}
              >
                Go to Home
              </Button>
            </Card>
          )}
        </div>
        {/* Bulk Delete Confirmation Dialog */}
        <AlertDialog
          open={isBulkDeleteDialogOpen}
          onOpenChange={setIsBulkDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete {selectedProducts.length} products?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                selected products and remove them from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDeleteProducts}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Selected
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CartProvider>
    </SellerDashboardLayout>
  );
}
