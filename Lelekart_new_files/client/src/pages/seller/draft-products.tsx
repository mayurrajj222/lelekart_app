import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Calendar,
  Tag,
  Package,
} from "lucide-react";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Product as SchemaProduct } from "@shared/schema";
import ApprovalCheck from "@/components/ui/approval-check";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DraftProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  subcategory: string;
  status: "draft" | "pending" | "rejected";
  createdAt: string;
  updatedAt: string;
  imageUrl?: string;
  stock: number;
}

export default function SellerDraftProductsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Try to use context first if available
  const authContext = useContext(AuthContext);

  // Get user data from direct API if context is not available
  const { data: apiUser } = useQuery<any>({
    queryKey: ["/api/user"],
    enabled: !authContext?.user,
  });

  // Use context user if available, otherwise use API user
  const user = authContext?.user || apiUser;

  // Fetch draft products
  const {
    data: draftProducts = [],
    isLoading,
    error,
  } = useQuery<DraftProduct[]>({
    queryKey: ["/api/seller/draft-products"],
    queryFn: async () => {
      const res = await fetch("/api/seller/draft-products", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch draft products");
      }
      return res.json();
    },
    staleTime: 60000,
  });

  // Filter products based on search and status
  const filteredProducts = draftProducts.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      selectedStatus === "all" || product.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Bulk actions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(paginatedProducts.map((p) => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, productId]);
    } else {
      setSelectedProducts(selectedProducts.filter((id) => id !== productId));
    }
  };

  // Mutations
  const publishMutation = useMutation({
    mutationFn: async (productIds: string[]) => {
      const res = await fetch("/api/seller/draft-products/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds }),
      });
      if (!res.ok) throw new Error("Failed to publish products");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/seller/draft-products"],
      });
      toast({
        title: "Success",
        description: "Products published successfully",
      });
      setSelectedProducts([]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to publish products",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (productIds: string[]) => {
      const res = await fetch("/api/seller/draft-products/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds }),
      });
      if (!res.ok) throw new Error("Failed to delete products");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/seller/draft-products"],
      });
      toast({ title: "Success", description: "Products deleted successfully" });
      setSelectedProducts([]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete products",
        variant: "destructive",
      });
    },
  });

  const handleBulkPublish = () => {
    if (selectedProducts.length > 0) {
      publishMutation.mutate(selectedProducts);
    }
  };

  const handleBulkDelete = () => {
    if (selectedProducts.length > 0) {
      deleteMutation.mutate(selectedProducts);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <SellerDashboardLayout>
      <ApprovalCheck>
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Draft Products</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Manage your product drafts and unpublished items
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center w-full sm:w-auto">
              <Button
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
                asChild
              >
                <Link href="/seller/products/add">
                  <Plus className="h-4 w-4" />
                  Add New Product
                </Link>
              </Button>
              <Button
                variant="outline"
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
                asChild
              >
                <Link href="/seller/products">
                  <Layers className="h-4 w-4" />
                  View All Products
                </Link>
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search draft products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedProducts.length > 0 && (
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">
                      {selectedProducts.length} product
                      {selectedProducts.length !== 1 ? "s" : ""} selected
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      size="sm"
                      onClick={handleBulkPublish}
                      disabled={publishMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      {publishMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      Publish Selected
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleBulkDelete}
                      disabled={deleteMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Delete Selected
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card>
              <CardContent className="p-6 text-center">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Error Loading Products
                </h3>
                <p className="text-muted-foreground mb-4">
                  Failed to load draft products. Please try again.
                </p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
              </CardContent>
            </Card>
          ) : filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <FileEdit className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Draft Products</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedStatus !== "all"
                    ? "No products match your search criteria."
                    : "You haven't created any draft products yet."}
                </p>
                <Button asChild>
                  <Link href="/seller/products/add">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Product
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Select All */}
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={
                    selectedProducts.length === paginatedProducts.length &&
                    paginatedProducts.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">
                  Select all ({paginatedProducts.length})
                </span>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {paginatedProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={(checked) =>
                              handleSelectProduct(
                                product.id,
                                checked as boolean
                              )
                            }
                          />
                          {getStatusBadge(product.status)}
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/seller/products/edit/${product.id}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/seller/products/${product.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                      <CardTitle className="text-base line-clamp-2">
                        {product.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 text-sm">
                        {product.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Tag className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Category:
                          </span>
                          <span className="font-medium">
                            {product.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Stock:</span>
                          <span className="font-medium">{product.stock}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Updated:
                          </span>
                          <span className="font-medium">
                            {new Date(product.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-3">
                      <div className="w-full">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg font-bold">
                            ₹{product.price.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1" asChild>
                            <Link href={`/seller/products/edit/${product.id}`}>
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            asChild
                          >
                            <Link href={`/seller/products/${product.id}`}>
                              <Eye className="h-3 w-3 mr-1" />
                              Preview
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </ApprovalCheck>
    </SellerDashboardLayout>
  );
}
