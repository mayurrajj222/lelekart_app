import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  RefreshCw,
  MoreVertical,
  Edit,
  Trash2,
  CheckSquare,
  XSquare,
  Eye,
  Plus,
  Loader2,
  Package,
  X,
  Check,
  Filter,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { ProductImageGallery } from "@/components/ui/product-image-gallery";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextContent } from "@/components/ui/rich-text-content";

// Define interface for paginated API response
interface PaginatedResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function ProductApproval() {
  return <ProductApprovalContent />;
}

function ProductApprovalContent() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Bulk approval state
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Debounce search to prevent too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchValue);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchValue]);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter]);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch pending products with pagination, search, and category filter
  const {
    data: pendingProductsData,
    isLoading,
    isError,
    refetch,
  } = useQuery<PaginatedResponse>({
    queryKey: [
      "/api/products/pending",
      { page, limit: pageSize, search, category: categoryFilter },
    ],
    queryFn: async () => {
      let url = `/api/products/pending?page=${page}&limit=${pageSize}`;

      // Add search parameter if provided
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      // Add category filter if provided
      if (categoryFilter) {
        url += `&category=${encodeURIComponent(categoryFilter)}`;
      }

      const res = await apiRequest("GET", url);
      return res.json();
    },
  });

  // Fetch product statistics for the stats cards
  const { data: productStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/product-stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/product-stats");
      return res.json();
    },
  });

  // Extract products array and pagination info from response
  const products = pendingProductsData?.products || [];
  const pagination = pendingProductsData?.pagination;

  // Approve product mutation
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/products/${id}/approve`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/product-stats"] });
      toast({
        title: "Product approved",
        description: "The product is now visible to buyers.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to approve product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject product mutation
  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/products/${id}/reject`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/product-stats"] });
      toast({
        title: "Product rejected",
        description: "The product will not be visible to buyers.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reject product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Bulk approve products mutation
  const bulkApproveMutation = useMutation({
    mutationFn: async (productIds: number[]) => {
      // Ensure all IDs are valid numbers before sending
      const validIds = productIds
        .map((id) => Number(id))
        .filter((id) => !isNaN(id) && Number.isInteger(id) && id > 0);

      console.log("Sending validated product IDs for bulk approval:", validIds);

      if (validIds.length === 0) {
        throw new Error("No valid product IDs to process");
      }

      const res = await apiRequest("PUT", "/api/products/bulk/approve", {
        productIds: validIds,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/product-stats"] });

      // Reset selection after successful operation
      setSelectedProducts([]);
      setSelectAll(false);
      setIsBulkProcessing(false);

      toast({
        title: "Bulk approval successful",
        description: `${data.summary.approved} products approved, ${data.summary.failed} failed.`,
      });
    },
    onError: (error: Error) => {
      setIsBulkProcessing(false);
      toast({
        title: "Failed to bulk approve products",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Bulk reject products mutation
  const bulkRejectMutation = useMutation({
    mutationFn: async (productIds: number[]) => {
      // Ensure all IDs are valid numbers before sending
      const validIds = productIds
        .map((id) => Number(id))
        .filter((id) => !isNaN(id) && Number.isInteger(id) && id > 0);

      console.log(
        "Sending validated product IDs for bulk rejection:",
        validIds
      );

      if (validIds.length === 0) {
        throw new Error("No valid product IDs to process");
      }

      const res = await apiRequest("PUT", "/api/products/bulk/reject", {
        productIds: validIds,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/product-stats"] });

      // Reset selection after successful operation
      setSelectedProducts([]);
      setSelectAll(false);
      setIsBulkProcessing(false);

      toast({
        title: "Bulk rejection successful",
        description: `${data.summary.rejected} products rejected, ${data.summary.failed} failed.`,
      });
    },
    onError: (error: Error) => {
      setIsBulkProcessing(false);
      toast({
        title: "Failed to bulk reject products",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle product approval
  const handleApproveProduct = async (product: Product) => {
    await approveMutation.mutateAsync(product.id);
  };

  // Handle product rejection
  const handleRejectProduct = async (product: Product) => {
    await rejectMutation.mutateAsync(product.id);
  };

  // Handle bulk actions
  const handleBulkApprove = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "No products selected",
        description: "Please select at least one product to approve.",
        variant: "destructive",
      });
      return;
    }

    // Add debug logging to see what's being sent
    console.log("Sending product IDs for bulk approval:", selectedProducts);

    // Filter out any invalid IDs before sending
    const validProductIds = selectedProducts.filter((id) => {
      const numId = Number(id);
      return !isNaN(numId) && Number.isInteger(numId) && numId > 0;
    });

    console.log("Filtered valid product IDs:", validProductIds);

    if (validProductIds.length === 0) {
      toast({
        title: "No valid products selected",
        description: "The selected product IDs were invalid. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsBulkProcessing(true);
    await bulkApproveMutation.mutateAsync(validProductIds);
  };

  const handleBulkReject = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "No products selected",
        description: "Please select at least one product to reject.",
        variant: "destructive",
      });
      return;
    }

    // Add debug logging to see what's being sent
    console.log("Sending product IDs for bulk rejection:", selectedProducts);

    // Filter out any invalid IDs before sending
    const validProductIds = selectedProducts.filter((id) => {
      const numId = Number(id);
      return !isNaN(numId) && Number.isInteger(numId) && numId > 0;
    });

    console.log("Filtered valid product IDs:", validProductIds);

    if (validProductIds.length === 0) {
      toast({
        title: "No valid products selected",
        description: "The selected product IDs were invalid. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsBulkProcessing(true);
    await bulkRejectMutation.mutateAsync(validProductIds);
  };

  // Handle checkbox selection
  const handleSelectProduct = (productId: number, isChecked: boolean) => {
    // Validate product ID
    if (
      typeof productId !== "number" ||
      isNaN(productId) ||
      !Number.isInteger(productId) ||
      productId <= 0
    ) {
      console.error("Invalid product ID:", productId);
      return;
    }

    console.log("Handling product selection:", productId, isChecked);

    if (isChecked) {
      setSelectedProducts((prev) => [...prev, productId]);
    } else {
      setSelectedProducts((prev) => prev.filter((id) => id !== productId));
    }
  };

  // Handle select all checkbox
  const handleSelectAll = (isChecked: boolean) => {
    setSelectAll(isChecked);
    if (isChecked) {
      // Get all product IDs from the current page and ensure they're valid numbers
      const allProductIds =
        (pendingProducts
          ?.map((product) => {
            const id = product.id;
            // Ensure ID is a valid number
            return typeof id === "number" &&
              !isNaN(id) &&
              Number.isInteger(id) &&
              id > 0
              ? id
              : null;
          })
          .filter((id) => id !== null) as number[]) || [];

      console.log("Selected all valid product IDs:", allProductIds);
      setSelectedProducts(allProductIds);
    } else {
      setSelectedProducts([]);
    }
  };

  // Client-side filtering for search and category
  // Note: The backend already filters for pending products only (not approved and not rejected)
  const pendingProducts = products?.filter((product) => {
    // Text search
    const matchesSearch = !search
      ? true
      : product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.description.toLowerCase().includes(search.toLowerCase());

    // Category filter
    const matchesCategory = !categoryFilter
      ? true
      : product.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });
  // Note: Sorting is handled by the backend with ORDER BY

  // Extract unique categories for filtering
  const categories = Array.from(
    new Set(pendingProducts?.map((product) => product.category) || [])
  );

  // Product counts for stats - use the dedicated stats endpoint
  const totalPendingProducts = productStats?.pending || 0;
  const totalProducts = productStats?.total || 0;
  const approvedProducts = productStats?.approved || 0;
  const rejectedProducts = productStats?.rejected || 0;

  // Loading states
  const ProductStatsLoading = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {["total pending", "total", "approved", "rejected"].map((stat) => (
        <Card key={stat} className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium capitalize">
              {stat === "total pending"
                ? "Pending Approval"
                : `${stat} Products`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Product Approval
          </h1>
          <p className="text-muted-foreground">
            Review and approve/reject products submitted by sellers
          </p>
        </div>

        {/* Products Stats */}
        {isLoading || statsLoading ? (
          <ProductStatsLoading />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Approval
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalPendingProducts}</div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProducts}</div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Approved Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{approvedProducts}</div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Rejected Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rejectedProducts}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Products Data Table */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search pending products..."
                className="pl-8 w-full"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>

            {/* Filter Dropdown */}
            {categories.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                    {categoryFilter && (
                      <Badge variant="secondary" className="ml-2 px-1">
                        1
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <div className="p-2">
                    <div className="flex flex-col space-y-2 max-h-48 overflow-y-auto">
                      <Button
                        variant={
                          categoryFilter === null ? "secondary" : "outline"
                        }
                        size="sm"
                        onClick={() => setCategoryFilter(null)}
                        className="justify-start"
                      >
                        All Categories
                      </Button>
                      {categories.map((category) => (
                        <Button
                          key={category}
                          variant={
                            categoryFilter === category
                              ? "secondary"
                              : "outline"
                          }
                          size="sm"
                          onClick={() => setCategoryFilter(category)}
                          className="justify-start"
                        >
                          {category}
                        </Button>
                      ))}
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Refresh Button */}
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>

          {/* Bulk action buttons */}
          {pendingProducts?.length > 0 && !isLoading && (
            <div className="flex flex-wrap gap-2 items-center mb-4">
              <span className="text-sm text-gray-500">
                {selectedProducts.length} of {pendingProducts.length} products
                selected
              </span>

              <div className="flex-1"></div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectAll(!selectAll)}
                className="mr-2"
              >
                {selectAll ? "Deselect All" : "Select All"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkApprove}
                disabled={selectedProducts.length === 0 || isBulkProcessing}
                className="text-green-600 border-green-600 hover:bg-green-50"
              >
                {isBulkProcessing && bulkApproveMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckSquare className="mr-2 h-4 w-4" />
                )}
                Approve Selected
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkReject}
                disabled={selectedProducts.length === 0 || isBulkProcessing}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                {isBulkProcessing && bulkRejectMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <XSquare className="mr-2 h-4 w-4" />
                )}
                Reject Selected
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-5 w-5 rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-8 rounded-md ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : pendingProducts?.length ? (
            <div className="rounded-md border bg-white">
              <div className="overflow-x-auto">
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={selectAll}
                          onCheckedChange={(checked) =>
                            handleSelectAll(checked === true)
                          }
                          aria-label="Select all products"
                        />
                      </TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={(checked) =>
                              handleSelectProduct(product.id, checked === true)
                            }
                            aria-label={`Select product ${product.name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded bg-gray-100 relative overflow-hidden border">
                              {(() => {
                                // Determine which image source to use
                                let imageSrc = "";

                                try {
                                  // Check for image_url (snake_case) first - this is what's in our data
                                  if ((product as any).image_url) {
                                    imageSrc = (product as any).image_url;
                                  }
                                  // Check for imageUrl (camelCase)
                                  else if (product.imageUrl) {
                                    imageSrc = product.imageUrl;
                                  }
                                  // Check for images array or string
                                  else if (product.images) {
                                    // Handle array of images
                                    if (
                                      Array.isArray(product.images) &&
                                      product.images.length > 0
                                    ) {
                                      imageSrc = product.images[0];
                                    }
                                    // Handle string (single image URL)
                                    else if (
                                      typeof product.images === "string"
                                    ) {
                                      // Check if it's a JSON string
                                      if (
                                        product.images.startsWith("[") &&
                                        product.images.includes("]")
                                      ) {
                                        try {
                                          const parsedImages = JSON.parse(
                                            product.images
                                          );
                                          if (
                                            Array.isArray(parsedImages) &&
                                            parsedImages.length > 0
                                          ) {
                                            imageSrc = parsedImages[0];
                                          }
                                        } catch (e) {
                                          console.error(
                                            "Failed to parse image JSON:",
                                            e
                                          );
                                        }
                                      } else {
                                        // It's a single URL
                                        imageSrc = product.images;
                                      }
                                    }
                                  }
                                } catch (err) {
                                  console.error("Error processing image:", err);
                                }

                                // Always use category-specific fallback as default
                                const categoryImage = `../images/${(product.category || "general").toLowerCase()}.svg`;
                                const genericFallback =
                                  "https://placehold.co/100?text=No+Image";

                                // If this is a Lelekart image, use our proxy
                                const useProxy =
                                  imageSrc &&
                                  (imageSrc.includes("flixcart.com") ||
                                    imageSrc.includes("lelekart.com"));
                                const displaySrc = useProxy
                                  ? `/api/image-proxy?url=${encodeURIComponent(imageSrc)}&category=${encodeURIComponent(product.category || "general")}`
                                  : imageSrc || categoryImage;

                                return (
                                  <img
                                    key={`product-image-${product.id}`}
                                    src={displaySrc}
                                    alt={product.name}
                                    className="object-contain h-full w-full"
                                    loading="lazy"
                                    onError={(e) => {
                                      console.error(
                                        "Failed to load image:",
                                        displaySrc
                                      );

                                      // If using proxy failed, try direct URL
                                      if (useProxy && imageSrc) {
                                        console.log(
                                          "Proxy failed, trying direct URL:",
                                          imageSrc
                                        );
                                        (e.target as HTMLImageElement).src =
                                          imageSrc;
                                        return;
                                      }

                                      // Try category-specific fallback
                                      (e.target as HTMLImageElement).src =
                                        categoryImage;

                                      // Add a second error handler for the category fallback
                                      (e.target as HTMLImageElement).onerror =
                                        () => {
                                          (e.target as HTMLImageElement).src =
                                            genericFallback;
                                          (
                                            e.target as HTMLImageElement
                                          ).onerror = null; // Prevent infinite loop
                                        };
                                    }}
                                    style={{
                                      maxHeight: "48px",
                                      background: "#f9f9f9",
                                    }}
                                  />
                                );
                              })()}
                            </div>
                            <div
                              className="font-medium hover:text-primary cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap max-w-xs"
                              onClick={() => setViewProduct(product)}
                            >
                              {product.name}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>
                          ₹{Number(product.price).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {/* Use seller name if available, or fallback to seller ID */}
                          {(product as any).sellerName ||
                            (product as any).seller_username ||
                            `Seller ID: ${product.sellerId || "Unknown"}`}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setViewProduct(product)}
                              title="View product details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => handleApproveProduct(product)}
                              title="Approve product"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => handleRejectProduct(product)}
                              title="Reject product"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {pagination && (
                <div className="px-4 py-4 sm:px-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                  {/* Page Size Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Rows per page</span>
                    <Select
                      value={String(pageSize)}
                      onValueChange={(value) => {
                        setPageSize(Number(value));
                        setPage(1); // Reset to first page when changing page size
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

                  {/* Page Status Information */}
                  <div className="text-sm text-gray-500">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}{" "}
                    of {pagination.total} products
                  </div>

                  {/* Pagination Buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(1)}
                      disabled={page === 1 || isLoading}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1 || isLoading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {pagination.page} of {pagination.totalPages || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={
                        page === pagination.totalPages ||
                        pagination.totalPages === 0 ||
                        isLoading
                      }
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(pagination.totalPages)}
                      disabled={
                        page === pagination.totalPages ||
                        pagination.totalPages === 0 ||
                        isLoading
                      }
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-md border bg-white p-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-1">No pending products</h3>
              <p className="text-gray-500 mb-4">
                All products have been reviewed. Great job!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Product View Dialog */}
      <Dialog
        open={!!viewProduct}
        onOpenChange={(open) => !open && setViewProduct(null)}
      >
        {viewProduct && (
          <DialogContent className="max-w-full sm:max-w-3xl w-[95vw]">
            <DialogHeader>
              <DialogTitle className="text-xl">Product Details</DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Review the product information below
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {/* Product Images */}
              <div className="flex flex-col gap-4">
                <div className="aspect-square bg-gray-100 rounded-md overflow-hidden relative">
                  <ProductImageGallery
                    imageUrl={viewProduct.imageUrl || "/images/placeholder.svg"}
                    additionalImages={
                      typeof viewProduct.images === "string"
                        ? viewProduct.images
                        : JSON.stringify(viewProduct.images)
                    }
                  />
                </div>
              </div>

              {/* Product Details */}
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-xl font-semibold">{viewProduct.name}</h3>
                  <Badge variant="outline" className="mt-1">
                    {viewProduct.category}
                  </Badge>
                </div>

                <div className="text-lg font-semibold">
                  ₹{Number(viewProduct.price).toFixed(2)}
                </div>

                <div className="mt-1">
                  <div className="text-sm font-medium text-gray-500">
                    Description
                  </div>
                  <RichTextContent
                    content={viewProduct.description}
                    className="mt-1"
                  />
                </div>

                {viewProduct.specifications && (
                  <div className="mt-1">
                    <div className="text-sm font-medium text-gray-500">
                      Specifications
                    </div>
                    <RichTextContent
                      content={viewProduct.specifications}
                      className="mt-1 text-sm"
                    />
                  </div>
                )}

                <div className="mt-1">
                  <div className="text-sm font-medium text-gray-500">
                    Inventory
                  </div>
                  <div className="mt-1 text-sm">
                    Stock: {viewProduct.stock || "Not specified"}
                  </div>
                </div>

                <div className="mt-1">
                  <div className="text-sm font-medium text-gray-500">
                    Seller Information
                  </div>
                  <div className="mt-1 text-sm">
                    {(viewProduct as any).sellerName ||
                      (viewProduct as any).seller_username ||
                      `Seller ID: ${viewProduct.sellerId || "Unknown"}`}
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => {
                      handleApproveProduct(viewProduct);
                      setViewProduct(null);
                    }}
                  >
                    <Check className="mr-2 h-4 w-4" /> Approve Product
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      handleRejectProduct(viewProduct);
                      setViewProduct(null);
                    }}
                  >
                    <X className="mr-2 h-4 w-4" /> Reject Product
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </AdminLayout>
  );
}
