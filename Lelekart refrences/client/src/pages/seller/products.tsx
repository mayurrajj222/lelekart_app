import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "wouter";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import { Pagination } from "@/components/ui/pagination";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Layers,
  Search,
  Plus,
  Filter,
  Edit,
  FileEdit,
  Trash,
  Upload,
  Download,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Product as SchemaProduct } from "@shared/schema";
import ApprovalCheck from "@/components/ui/approval-check";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Define a ProductWithSKU interface that extends the base Product type
interface Product extends Omit<SchemaProduct, "sku"> {
  sku?: string | null;
  image?: string;
  image_url?: string; // Add snake_case version from API
  subcategory?: string | null;
}
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { ProductImage } from "@/components/product/product-image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function SellerProductsPage() {
  // State for deletion dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [showFilters, setShowFilters] = useState(false);

  // Get page from URL or localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const pageFromUrl = urlParams.get("page");
  const storedPage = localStorage.getItem("sellerProductsPage");

  // Initialize currentPage with URL param, stored value, or default to 1
  const [currentPage, setCurrentPage] = useState(() => {
    const page = pageFromUrl || storedPage || "1";
    return parseInt(page);
  });

  // Store page number in localStorage when it changes
  useEffect(() => {
    localStorage.setItem("sellerProductsPage", currentPage.toString());
  }, [currentPage]);

  // Try to use context first if available
  const authContext = useContext(AuthContext);

  // Get user data from direct API if context is not available
  const { data: apiUser } = useQuery<any>({
    queryKey: ["/api/user"],
    enabled: !authContext?.user,
  });

  // Use context user if available, otherwise use API user
  const user = authContext?.user || apiUser;

  // State for pagination and search
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const stored = localStorage.getItem("sellerProductsItemsPerPage");
    const value = stored ? parseInt(stored) : 10;
    console.log(
      "Initializing itemsPerPage from localStorage:",
      stored,
      "parsed as:",
      value
    );
    return value;
  });
  const [searchTerm, setSearchTerm] = useState("");

  // Store items per page in localStorage when it changes
  useEffect(() => {
    localStorage.setItem("sellerProductsItemsPerPage", itemsPerPage.toString());
    console.log("Stored itemsPerPage in localStorage:", itemsPerPage);
  }, [itemsPerPage]);

  // Debug effect to log state changes
  useEffect(() => {
    console.log(
      "Pagination state changed - currentPage:",
      currentPage,
      "itemsPerPage:",
      itemsPerPage
    );
  }, [currentPage, itemsPerPage]);

  // Invalidate query cache on mount to ensure fresh data after page reload
  useEffect(() => {
    if (user?.id) {
      console.log("Invalidating query cache on mount for user:", user.id);
      queryClient.invalidateQueries({
        queryKey: ["/api/seller/products", user.id],
        exact: false,
      });
    }
  }, [user?.id, queryClient]);

  // State for category and subcategory editing
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<string>("");
  const [editingSubcategory, setEditingSubcategory] = useState<string>("");

  // Fetch all categories
  const { data: categoriesData } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) {
        throw new Error("Failed to fetch categories");
      }
      return res.json();
    },
  });

  // Fetch ALL subcategories for client-side filtering by category
  const { data: subcategoriesData } = useQuery({
    queryKey: ["/api/subcategories/all"],
    queryFn: async () => {
      const res = await fetch("/api/subcategories/all");
      if (!res.ok) {
        throw new Error("Failed to fetch subcategories");
      }
      return await res.json();
    },
    // Always fetch all subcategories
    enabled: !!categoriesData,
  });

  // Update product category/subcategory mutation
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
      const response = await fetch(`/api/seller/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ category, subcategory }),
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
      // Invalidate the products query to refresh the data
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

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await fetch(`/api/seller/products/${productId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete product");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Product deleted",
        description: "Product has been deleted successfully",
        variant: "default",
      });
      setIsDeleteDialogOpen(false);
      setSelectedProductId(null);
      // Invalidate the products query to refresh the data
      queryClient.invalidateQueries({
        queryKey: ["/api/seller/products", user?.id],
        exact: false,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  // Bulk delete products mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (productIds: number[]) => {
      const response = await fetch("/api/seller/products/bulk-delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productIds }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete products");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Products deleted",
        description: "Selected products have been deleted successfully",
        variant: "default",
      });
      setIsBulkDeleteDialogOpen(false);
      setSelectedProducts([]);
      // Invalidate the products query to refresh the data
      queryClient.invalidateQueries({
        queryKey: ["/api/seller/products", user?.id],
        exact: false,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete products",
        variant: "destructive",
      });
    },
  });

  // Fetch products with pagination and search
  const { data, isLoading, error } = useQuery({
    queryKey: [
      "/api/seller/products",
      user?.id,
      currentPage,
      itemsPerPage,
      searchTerm,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(`/api/seller/products?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();

      // Process products to ensure proper data structure
      const processProducts = async () => {
        const processedProducts = await Promise.all(
          data.products.map(async (product: any) => {
            // Ensure product has all required fields
            return {
              ...product,
              sku: product.sku || null,
              category: product.category || null,
              subcategory: product.subcategory || null,
              stock: product.stock || 0,
              price: product.price || 0,
              approved: product.approved || false,
              isDraft: product.isDraft || false,
            };
          })
        );

        return {
          ...data,
          products: processedProducts,
        };
      };

      return processProducts();
    },
    enabled: !!user?.id,
  });

  const products = data?.products || [];
  const pagination = data?.pagination || { total: 0, totalPages: 1 };

  // Check if seller is approved
  const isSellerApproved = user?.sellerApproved || false;

  // Debug log for seller approval status
  useEffect(() => {
    console.log("Current seller approval status:", isSellerApproved);
  }, [isSellerApproved]);

  const handleDeleteProduct = () => {
    if (selectedProductId) {
      deleteMutation.mutate(selectedProductId);
    }
  };

  const handleBulkDeleteProducts = () => {
    if (selectedProducts.length > 0) {
      bulkDeleteMutation.mutate(selectedProducts);
    }
  };

  const confirmDelete = (productId: number) => {
    setSelectedProductId(productId);
    setIsDeleteDialogOpen(true);
  };

  const confirmBulkDelete = () => {
    if (selectedProducts.length > 0) {
      setIsBulkDeleteDialogOpen(true);
    } else {
      toast({
        title: "No products selected",
        description: "Please select at least one product to delete",
        variant: "destructive",
      });
    }
  };

  // Check seller status on mount
  useEffect(() => {
    const checkSellerStatus = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch("/api/seller/status");
        if (response.ok) {
          const statusData = await response.json();
          console.log("Seller status:", statusData);
        }
      } catch (error) {
        console.error("Error checking seller status:", error);
      }
    };

    checkSellerStatus();
  }, [user?.id]);

  return (
    <SellerDashboardLayout>
      <ApprovalCheck>
        <div className="space-y-4 md:space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold">
                Product Management
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Manage your product listings
              </p>
            </div>
            <div className="flex gap-2 md:gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className="flex items-center gap-2 text-xs md:text-sm"
                      onClick={() => setLocation("/seller/products/add")}
                    >
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">Add Product</span>
                      <span className="sm:hidden">Add</span>
                    </Button>
                  </TooltipTrigger>
                </Tooltip>
              </TooltipProvider>
              <Button
                variant="outline"
                className="flex items-center gap-2 text-xs md:text-sm"
                onClick={() => {
                  // Show toast notification
                  toast({
                    title: "Exporting products",
                    description:
                      "Your product data is being prepared for download...",
                  });

                  // Create a form element to handle the download
                  const form = document.createElement("form");
                  form.method = "GET";
                  form.action = "/api/seller/products/export";
                  document.body.appendChild(form);
                  form.submit();
                  document.body.removeChild(form);
                }}
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg">
                Product Inventory
              </CardTitle>
              <CardDescription className="text-sm">
                You have {data?.total || 0} products in your inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Mobile Filter Toggle */}
              <div className="md:hidden mb-4">
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <span className="flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    Search & Filters
                  </span>
                  {showFilters ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Search and Filters */}
              <div className={`${showFilters ? "block" : "hidden"} md:block`}>
                <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-4 md:mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search products..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        // Reset to first page when searching
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 text-xs md:text-sm flex-1 md:flex-none"
                      onClick={confirmBulkDelete}
                      disabled={
                        selectedProducts.length === 0 ||
                        bulkDeleteMutation.isPending
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        {bulkDeleteMutation.isPending
                          ? "Deleting..."
                          : "Delete Selected"}
                      </span>
                      <span className="sm:hidden">
                        {bulkDeleteMutation.isPending
                          ? "Deleting..."
                          : "Delete"}
                      </span>
                      {selectedProducts.length > 0 &&
                        ` (${selectedProducts.length})`}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 text-xs md:text-sm flex-1 md:flex-none"
                    >
                      <Filter className="h-4 w-4" />
                      <span className="hidden sm:inline">Filters</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block rounded-md border">
                {isLoading ? (
                  <div className="flex justify-center items-center h-60">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]">
                          <Checkbox
                            checked={
                              products.length > 0 &&
                              selectedProducts.length === products.length
                            }
                            onCheckedChange={(checked) => {
                              if (checked) {
                                // Select all products
                                setSelectedProducts(
                                  products.map((p: Product) => p.id)
                                );
                              } else {
                                // Deselect all products
                                setSelectedProducts([]);
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead className="w-[80px]">Image</TableHead>
                        <TableHead>Product Name</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Subcategory</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product: Product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedProducts.includes(product.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedProducts([
                                    ...selectedProducts,
                                    product.id,
                                  ]);
                                } else {
                                  setSelectedProducts(
                                    selectedProducts.filter(
                                      (id) => id !== product.id
                                    )
                                  );
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <ProductImage product={product} size="small" />
                          </TableCell>
                          <TableCell className="font-medium">
                            {product.name}
                          </TableCell>
                          <TableCell>{product.sku}</TableCell>
                          <TableCell>
                            ₹{product.price.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <span
                              className={
                                product.stock < 20
                                  ? "text-red-500 font-medium"
                                  : ""
                              }
                            >
                              {product.stock}
                            </span>
                          </TableCell>
                          <TableCell>
                            {editingProductId === product.id ? (
                              <div className="space-y-2">
                                <Select
                                  value={editingCategory || product.category}
                                  onValueChange={(value) => {
                                    setEditingCategory(value);
                                    setEditingSubcategory(""); // Reset subcategory when category changes
                                  }}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {categoriesData?.map(
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
                              </div>
                            ) : (
                              <div
                                className="cursor-pointer hover:text-primary"
                                onClick={() => {
                                  setEditingProductId(product.id);
                                  setEditingCategory(product.category || "");
                                  setEditingSubcategory(
                                    product.subcategory || ""
                                  );
                                }}
                              >
                                {product.category || "-"}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingProductId === product.id ? (
                              <div className="space-y-2">
                                <Select
                                  value={editingSubcategory}
                                  onValueChange={setEditingSubcategory}
                                  disabled={!editingCategory}
                                >
                                  <SelectTrigger className="h-8 w-full">
                                    <SelectValue
                                      placeholder={
                                        !editingCategory
                                          ? "Select category first"
                                          : "Select subcategory"
                                      }
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="_none">None</SelectItem>
                                    {(() => {
                                      // Get current category
                                      const currentCategory =
                                        editingCategory || "";

                                      if (!currentCategory) {
                                        console.log(
                                          "No current category selected, cannot filter subcategories"
                                        );
                                        return [];
                                      }

                                      // Find category object to get ID
                                      const categoryObj = categoriesData?.find(
                                        (c: any) => c.name === currentCategory
                                      );

                                      if (!categoryObj) {
                                        console.log(
                                          `Category "${currentCategory}" not found in categories list`
                                        );
                                        return [];
                                      }

                                      // Filter subcategories to only those matching this category's ID
                                      const allSubcategories =
                                        subcategoriesData || [];
                                      const filteredSubcategories =
                                        allSubcategories.filter(
                                          (subcategory: any) => {
                                            return (
                                              subcategory.categoryId ===
                                              categoryObj.id
                                            );
                                          }
                                        );

                                      // Limited logging to avoid console spam
                                      console.log(
                                        `Category "${currentCategory}" (ID: ${categoryObj.id}): Found ${filteredSubcategories.length} matching subcategories`
                                      );

                                      // If there are no subcategories for this category, return empty array
                                      // The "None" option is already included in the SelectContent
                                      if (filteredSubcategories.length === 0) {
                                        console.log(
                                          "No subcategories found for this category"
                                        );
                                        return [];
                                      }

                                      return filteredSubcategories.map(
                                        (subcategory: {
                                          id: number;
                                          name: string;
                                        }) => (
                                          <SelectItem
                                            key={subcategory.id}
                                            value={subcategory.name}
                                          >
                                            {subcategory.name}
                                          </SelectItem>
                                        )
                                      );
                                    })()}
                                  </SelectContent>
                                </Select>
                                <div className="flex gap-2 mt-2">
                                  <Button
                                    size="sm"
                                    className="h-7 px-2 py-1 text-xs"
                                    onClick={() => {
                                      // Save the changes
                                      updateCategoryMutation.mutate({
                                        productId: product.id,
                                        category: editingCategory,
                                        subcategory:
                                          editingSubcategory === "_none"
                                            ? ""
                                            : editingSubcategory,
                                      });
                                    }}
                                    disabled={updateCategoryMutation.isPending}
                                  >
                                    {updateCategoryMutation.isPending ? (
                                      <>
                                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                        Saving...
                                      </>
                                    ) : (
                                      "Save"
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 py-1 text-xs"
                                    onClick={() => {
                                      // Cancel editing
                                      setEditingProductId(null);
                                      setEditingCategory("");
                                      setEditingSubcategory("");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div
                                className="cursor-pointer hover:text-primary"
                                onClick={() => {
                                  setEditingProductId(product.id);
                                  setEditingCategory(product.category || "");
                                  setEditingSubcategory(
                                    product.subcategory
                                      ? product.subcategory
                                      : "_none"
                                  );
                                }}
                              >
                                {product.subcategory || "-"}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {product.isDraft ? (
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200"
                              >
                                <FileEdit className="h-3 w-3 mr-1" />
                                Draft
                              </Badge>
                            ) : product.approved ? (
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approved
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-200"
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                asChild
                              >
                                <Link
                                  href={`/seller/products/preview/${product.id}`}
                                >
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">Preview</span>
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                asChild
                              >
                                <Link
                                  href={
                                    product.isDraft
                                      ? `/seller/drafts/edit/${product.id}`
                                      : `/seller/products/edit/${product.id}`
                                  }
                                >
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-600"
                                onClick={() => confirmDelete(product.id)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* Mobile Product Cards */}
              <div className="md:hidden space-y-3">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, idx) => (
                    <Card key={idx} className="bg-white">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 animate-pulse rounded w-1/2"></div>
                          <div className="h-3 bg-gray-200 animate-pulse rounded w-2/3"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : products.length === 0 ? (
                  <Card className="bg-white">
                    <CardContent className="p-8 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Layers className="h-12 w-12 mb-3" />
                        <p className="text-sm">No products found</p>
                        <p className="text-xs mt-1">
                          Try adjusting your search term
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  products.map((product: Product) => (
                    <Card key={product.id} className="bg-white">
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <Checkbox
                              checked={selectedProducts.includes(product.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedProducts([
                                    ...selectedProducts,
                                    product.id,
                                  ]);
                                } else {
                                  setSelectedProducts(
                                    selectedProducts.filter(
                                      (id) => id !== product.id
                                    )
                                  );
                                }
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                <ProductImage product={product} size="small" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-sm font-medium text-gray-900 mb-1">
                                  {product.name}
                                </CardTitle>
                                <div className="space-y-1 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      SKU:
                                    </span>
                                    <span>{product.sku || "-"}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Price:
                                    </span>
                                    <span className="font-medium">
                                      ₹{product.price.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Stock:
                                    </span>
                                    <span
                                      className={
                                        product.stock < 20
                                          ? "text-red-500 font-medium"
                                          : ""
                                      }
                                    >
                                      {product.stock}
                                    </span>
                                  </div>
                                </div>
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
                              <span className="text-xs font-medium text-muted-foreground">
                                Category:
                              </span>
                              <span className="text-xs mt-1">
                                {editingProductId === product.id ? (
                                  <Select
                                    value={editingCategory || product.category}
                                    onValueChange={(value) => {
                                      setEditingCategory(value);
                                      setEditingSubcategory("");
                                    }}
                                  >
                                    <SelectTrigger className="h-6 text-xs">
                                      <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {categoriesData?.map(
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
                                ) : (
                                  <span
                                    className="cursor-pointer hover:text-primary"
                                    onClick={() => {
                                      setEditingProductId(product.id);
                                      setEditingCategory(
                                        product.category || ""
                                      );
                                      setEditingSubcategory(
                                        product.subcategory || ""
                                      );
                                    }}
                                  >
                                    {product.category || "-"}
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-muted-foreground">
                                Subcategory:
                              </span>
                              <span className="text-xs mt-1">
                                {editingProductId === product.id ? (
                                  <Select
                                    value={editingSubcategory}
                                    onValueChange={setEditingSubcategory}
                                    disabled={!editingCategory}
                                  >
                                    <SelectTrigger className="h-6 text-xs">
                                      <SelectValue placeholder="Select subcategory" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="_none">
                                        None
                                      </SelectItem>
                                      {(() => {
                                        const currentCategory =
                                          editingCategory || "";
                                        if (!currentCategory) return [];

                                        const categoryObj =
                                          categoriesData?.find(
                                            (c: any) =>
                                              c.name === currentCategory
                                          );
                                        if (!categoryObj) return [];

                                        const allSubcategories =
                                          subcategoriesData || [];
                                        const filteredSubcategories =
                                          allSubcategories.filter(
                                            (subcategory: any) =>
                                              subcategory.categoryId ===
                                              categoryObj.id
                                          );

                                        return filteredSubcategories.map(
                                          (subcategory: {
                                            id: number;
                                            name: string;
                                          }) => (
                                            <SelectItem
                                              key={subcategory.id}
                                              value={subcategory.name}
                                            >
                                              {subcategory.name}
                                            </SelectItem>
                                          )
                                        );
                                      })()}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <span
                                    className="cursor-pointer hover:text-primary"
                                    onClick={() => {
                                      setEditingProductId(product.id);
                                      setEditingCategory(
                                        product.category || ""
                                      );
                                      setEditingSubcategory(
                                        product.subcategory
                                          ? product.subcategory
                                          : "_none"
                                      );
                                    }}
                                  >
                                    {product.subcategory || "-"}
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Status */}
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-muted-foreground">
                              Status:
                            </span>
                            <div>
                              {product.isDraft ? (
                                <Badge
                                  variant="outline"
                                  className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                                >
                                  <FileEdit className="h-3 w-3 mr-1" />
                                  Draft
                                </Badge>
                              ) : product.approved ? (
                                <Badge
                                  variant="outline"
                                  className="bg-green-50 text-green-700 border-green-200 text-xs"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Approved
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="bg-amber-50 text-amber-700 border-amber-200 text-xs"
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Edit Actions */}
                          {editingProductId === product.id && (
                            <div className="flex gap-2 pt-2 border-t">
                              <Button
                                size="sm"
                                className="flex-1 text-xs h-7"
                                onClick={() => {
                                  updateCategoryMutation.mutate({
                                    productId: product.id,
                                    category: editingCategory,
                                    subcategory:
                                      editingSubcategory === "_none"
                                        ? ""
                                        : editingSubcategory,
                                  });
                                }}
                                disabled={updateCategoryMutation.isPending}
                              >
                                {updateCategoryMutation.isPending ? (
                                  <>
                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                    Saving...
                                  </>
                                ) : (
                                  "Save"
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-xs h-7"
                                onClick={() => {
                                  setEditingProductId(null);
                                  setEditingCategory("");
                                  setEditingSubcategory("");
                                }}
                              >
                                Cancel
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
                            className="flex-1 text-xs"
                            asChild
                          >
                            <Link
                              href={`/seller/products/preview/${product.id}`}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Preview
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs"
                            asChild
                          >
                            <Link
                              href={
                                product.isDraft
                                  ? `/seller/drafts/edit/${product.id}`
                                  : `/seller/products/edit/${product.id}`
                              }
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs text-red-500 hover:text-red-600"
                            onClick={() => confirmDelete(product.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pagination */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xs md:text-sm text-gray-500">
              Showing {products.length} of {pagination.total} products
            </span>
            <Select
              value={String(itemsPerPage)}
              onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1); // Reset to first page when changing page size
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="500">500</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {pagination.totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs md:text-sm text-muted-foreground">
                Page {currentPage} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                product and remove it from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteProduct}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
                disabled={bulkDeleteMutation.isPending}
              >
                {bulkDeleteMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  "Delete Selected"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </ApprovalCheck>
    </SellerDashboardLayout>
  );
}
