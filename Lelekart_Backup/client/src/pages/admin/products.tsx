import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useLocation, useRoute, Link } from "wouter";
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
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Search,
  RefreshCw,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Plus,
  Loader2,
  Package,
  X,
  Check,
  Filter,
  Clock,
  ArrowRight,
  UserPlus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileDown,
} from "lucide-react";
import { ProductImageGallery } from "@/components/ui/product-image-gallery";
import { RichTextContent } from "@/components/ui/rich-text-content";

export default function AdminProducts() {
  const [_, setLocation] = useLocation();
  return <AdminProductsContent setLocationProp={setLocation} />;
}

// Define a type for Seller
type Seller = {
  id: number;
  username: string;
  email: string;
  name?: string;
  approved: boolean;
  role: string;
};

type Category = { name: string; id: number };

function AdminProductsContent({
  setLocationProp,
}: {
  setLocationProp?: (path: string) => void;
}) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Pre-define search functions
  function performSearch() {
    if (!searchInput.trim()) return;

    // Add to search history
    addSearchToHistory(searchInput);

    // Update the search state
    setSearch(searchInput);

    // Update URL with search parameters
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("search", searchInput);
    searchParams.set("searchField", searchField);

    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.pushState({}, "", newUrl);

    // Refetch products with new search term
    queryClient.invalidateQueries({ queryKey: ["/api/products"] });
  }

  function clearSearch() {
    setSearchInput("");
    setSearch("");

    // Remove search parameters from URL
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.delete("search");

    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.pushState({}, "", newUrl);

    // Refetch products without search term
    queryClient.invalidateQueries({ queryKey: ["/api/products"] });
  }
  const [searchField, setSearchField] = useState<string>("all");
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [isSearchSuggestionsOpen, setIsSearchSuggestionsOpen] = useState(false);
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [priceRangeFilter, setPriceRangeFilter] = useState<
    [number | null, number | null]
  >([null, null]);
  const [stockFilter, setStockFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("newest");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [location, setLocation] = useLocation();
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  // Set approvalFilter to null (show all products) by default
  const [approvalFilter, setApprovalFilter] = useState<string | null>(null);
  const [selectedSellerId, setSelectedSellerId] = useState<string>("");
  const [sellerSearchTerm, setSellerSearchTerm] = useState("");
  const [assignSellerProduct, setAssignSellerProduct] =
    useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState<boolean>(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    productId: number | null;
    productName: string;
  }>({
    open: false,
    productId: null,
    productName: "",
  });

  // Category and subcategory editing states
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<string>("");
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<
    number | null
  >(null);

  // Track currently selected product's category (for subcategory filtering)
  const [selectedProductCategory, setSelectedProductCategory] = useState<
    string | null
  >(null);

  // Fetch products with pagination
  const {
    data: productsData,
    isLoading,
    isError,
    refetch,
  } = useQuery<{
    products: Product[];
    pagination: {
      total: number;
      totalPages: number;
      currentPage: number;
      limit: number;
    };
  }>({
    queryKey: [
      "/api/products",
      {
        page: currentPage,
        limit: itemsPerPage,
        approvalFilter,
        categoryFilter,
        search,
      },
    ],
    queryFn: async ({ queryKey }) => {
      const [_, params] = queryKey as [
        string,
        {
          page: number;
          limit: number;
          approvalFilter: string | null;
          categoryFilter: string | null;
          search: string;
        },
      ];
      let url = `/api/products?page=${params.page}&limit=${params.limit}`;
      if (params.categoryFilter) url += `&category=${params.categoryFilter}`;
      if (params.search) url += `&search=${encodeURIComponent(params.search)}`;
      // Always send both approved and rejected params for clarity
      if (params.approvalFilter === "approved") {
        url += `&approved=true&rejected=false`;
      } else if (params.approvalFilter === "rejected") {
        // SWAPPED: Now sends pending logic
        url += `&approved=false&rejected=false`;
      } else if (params.approvalFilter === "pending") {
        // SWAPPED: Now sends rejected logic
        url += `&approved=false&rejected=true`;
      }
      // All: do not send any status param
      const res = await apiRequest("GET", url);
      return res.json();
    },
  });

  // Extract products array and pagination from response
  const products = productsData?.products || [];
  const pagination = productsData?.pagination || {
    total: 0,
    totalPages: 1,
    currentPage: 1,
    limit: itemsPerPage,
  };

  // Fetch all categories and subcategories from the server for the dropdowns
  const { data: allCategories } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  // Use all categories from the server for the filter dropdown
  const categories =
    (allCategories as Category[] | undefined)?.map((c: Category) => c.name) ||
    [];

  // Fetch filtered subcategories based on the currently edited category
  const { data: categorySubcategories = [] } = useQuery({
    queryKey: ["/api/subcategories/filtered", editingCategory],
    queryFn: async () => {
      // If no category is selected, don't fetch subcategories
      if (!editingCategory) {
        console.log("No editing category selected, skipping subcategory fetch");
        return [];
      }

      // Find category ID based on name
      const categoryObj = allCategories?.find(
        (c: any) => c.name === editingCategory
      );

      if (!categoryObj || !categoryObj.id) {
        console.log(
          `Cannot find category ID for "${editingCategory}" in allCategories`
        );
        console.log(
          "Available categories:",
          allCategories?.map((c: any) => ({ id: c.id, name: c.name }))
        );
        return [];
      }

      console.log(
        `Fetching subcategories specifically for category ID ${categoryObj.id} (${editingCategory})`
      );
      const res = await fetch(
        `/api/subcategories?categoryId=${categoryObj.id}`
      );
      if (!res.ok) {
        throw new Error(
          `Failed to fetch subcategories for category "${editingCategory}"`
        );
      }
      const data = await res.json();
      console.log(
        `Found ${
          data.subcategories?.length || 0
        } subcategories for category "${editingCategory}" (ID: ${
          categoryObj.id
        })`
      );

      if (data.subcategories?.length > 0) {
        console.log(
          "First few subcategories:",
          data.subcategories.slice(0, 3).map((s: any) => ({
            id: s.id,
            name: s.name,
            categoryId: s.categoryId,
          }))
        );
      }

      return data.subcategories || [];
    },
    enabled: !!allCategories && !!editingCategory,
  });

  // Fetch subcategories for display in the products table - filtered by category on the server-side
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);

  // Fetch subcategories for all categories - but we'll do server-side filtering
  const { data: productSubcategories = [] } = useQuery({
    queryKey: ["/api/subcategories", "displayTable"],
    queryFn: async () => {
      // Get all subcategories but with a higher limit to ensure we get them all
      const res = await fetch("/api/subcategories?limit=100");
      if (!res.ok) throw new Error("Failed to fetch subcategories");

      const data = await res.json();
      console.log(
        `Fetched subcategories for table display (${
          data.subcategories?.length || 0
        } total)`
      );
      return data.subcategories || [];
    },
  });

  // Create a proper type for Subcategory
  type Subcategory = {
    id: number;
    name: string;
    categoryId: number;
    slug?: string;
    parentId?: number;
  };

  // Log product data for debugging
  useEffect(() => {
    if (products.length > 0) {
      // Check specific product or first product for debugging
      const product = products.find((p) => p.id === 4470) || products[0];
      // Debug data is no longer needed as subcategory handling is working correctly
    }
  }, [productsData, productSubcategories]);

  // Store recent searches in localStorage
  useEffect(() => {
    const savedSearches = localStorage.getItem("productSearchHistory");
    if (savedSearches) {
      setSearchHistory(JSON.parse(savedSearches));
    }
  }, []);

  // Store recent searches in localStorage
  useEffect(() => {
    const savedSearches = localStorage.getItem("adminProductSearchHistory");
    if (savedSearches) {
      try {
        const parsedSearches = JSON.parse(savedSearches);
        if (Array.isArray(parsedSearches)) {
          setSearchHistory(parsedSearches);
        }
      } catch (error) {
        console.error("Error parsing search history:", error);
      }
    }
  }, []);

  // Function to add search term to history
  const addSearchToHistory = (term: string) => {
    if (!term.trim()) return;

    const newHistory = [
      term,
      ...searchHistory.filter(
        (item) => item.toLowerCase() !== term.toLowerCase()
      ),
    ].slice(0, 10); // Keep only the 10 most recent searches

    setSearchHistory(newHistory);
    localStorage.setItem(
      "adminProductSearchHistory",
      JSON.stringify(newHistory)
    );
  };

  // Generate search suggestions based on input
  useEffect(() => {
    if (searchInput.trim().length < 2) {
      setSearchSuggestions([]);
      setIsSearchSuggestionsOpen(false);
      return;
    }

    // Filter history for matching items
    const historyMatches = searchHistory.filter((item) =>
      item.toLowerCase().includes(searchInput.toLowerCase())
    );

    // Simple suggestion generator based on current products
    const productNameSuggestions = products
      .filter((p) => p.name.toLowerCase().includes(searchInput.toLowerCase()))
      .map((p) => p.name)
      .slice(0, 5);

    const categorySuggestions = categories
      .filter((c) => c.toLowerCase().includes(searchInput.toLowerCase()))
      .map((c) => c)
      .slice(0, 3);

    // Combine and deduplicate suggestions
    const combinedSuggestions = Array.from(
      new Set([
        ...historyMatches,
        ...productNameSuggestions,
        ...categorySuggestions,
      ])
    ).slice(0, 7);

    setSearchSuggestions(combinedSuggestions);
    setIsSearchSuggestionsOpen(combinedSuggestions.length > 0);
  }, [searchInput, searchHistory, products, categories]);

  // Get search query from URL if present
  useEffect(() => {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get("search");
    const searchFieldParam = urlParams.get("searchField");
    const minPrice = urlParams.get("minPrice");
    const maxPrice = urlParams.get("maxPrice");
    const stockFilter = urlParams.get("stock");
    const sortBy = urlParams.get("sortBy");

    // Apply search params if they exist
    if (searchParam) {
      setSearch(searchParam);
      setSearchInput(searchParam);

      console.log("Admin - Found search parameter in URL:", searchParam);

      // Force a refetch with the search parameter
      queryClient.invalidateQueries({
        queryKey: ["/api/products"],
      });

      toast({
        title: "Admin Search",
        description: `Searching admin products for "${searchParam}"`,
        duration: 3000,
      });
    }

    // Apply other filter params
    if (searchFieldParam) setSearchField(searchFieldParam);
    if (minPrice || maxPrice) {
      setPriceRangeFilter([
        minPrice ? parseFloat(minPrice) : null,
        maxPrice ? parseFloat(maxPrice) : null,
      ]);
    }
    if (stockFilter) setStockFilter(stockFilter);
    if (sortBy) setSortBy(sortBy);

    // Extract product ID from path if it's a single product view
    // Format: /admin/products/123
    const pathMatch = window.location.pathname.match(
      /\/admin\/products\/(\d+)/
    );
    if (pathMatch && pathMatch[1]) {
      const productId = parseInt(pathMatch[1]);

      // Fetch the specific product and set it to view
      const fetchProduct = async () => {
        try {
          const res = await apiRequest("GET", `/api/products/${productId}`);
          const product = await res.json();
          setViewProduct(product);
        } catch (error) {
          console.error("Error fetching product:", error);
          toast({
            title: "Error",
            description: "Failed to load product details",
            variant: "destructive",
          });
        }
      };

      fetchProduct();
    }
  }, [location, toast]);

  // This section was moved above to fix the reference error

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/product-stats"] }); // Ensure stats update
      toast({
        title: "Product deleted",
        description: "The product has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Bulk delete products mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await apiRequest("POST", `/api/products/bulk-delete`, { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/product-stats"] }); // Ensure stats update
      setSelectedProducts([]);
      toast({
        title: "Products deleted",
        description: `${selectedProducts.length} products have been successfully deleted.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete products",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Approve product mutation
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/products/${id}/approve`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
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

  // Fetch approved sellers for the assignment dropdown
  const { data: sellers = [] } = useQuery<Seller[]>({
    queryKey: ["/api/sellers/approved"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/sellers/approved");
      return res.json();
    },
    // Only fetch when the assignment dialog is open
    enabled: assignSellerProduct !== null,
  });

  // Assign product to a seller mutation
  const assignSellerMutation = useMutation({
    mutationFn: async ({
      productId,
      sellerId,
    }: {
      productId: number;
      sellerId: number;
    }) => {
      const res = await apiRequest(
        "PUT",
        `/api/products/${productId}/assign-seller`,
        { sellerId }
      );
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setAssignSellerProduct(null);
      setSelectedSellerId("");
      toast({
        title: "Product reassigned",
        description:
          data.message ||
          "The product has been successfully reassigned to another seller.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reassign product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle delete confirmation
  const handleDeleteClick = (product: Product) => {
    setDeleteConfirm({
      open: true,
      productId: product.id,
      productName: product.name,
    });
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (deleteConfirm.productId) {
      await deleteMutation.mutateAsync(deleteConfirm.productId);
      setDeleteConfirm({
        open: false,
        productId: null,
        productName: "",
      });
    }
  };

  // Handle product approval
  const handleApproveProduct = async (product: Product) => {
    await approveMutation.mutateAsync(product.id);
  };

  // Handle product rejection
  const handleRejectProduct = async (product: Product) => {
    await rejectMutation.mutateAsync(product.id);
  };

  // Handle seller assignment
  const handleAssignSeller = async () => {
    if (!assignSellerProduct || !selectedSellerId) return;

    await assignSellerMutation.mutateAsync({
      productId: assignSellerProduct.id,
      sellerId: parseInt(selectedSellerId),
    });
  };

  // Handle saving the category and subcategory changes
  const updateCategoryMutation = useMutation({
    mutationFn: async ({
      productId,
      category,
      subcategoryId,
    }: {
      productId: number;
      category: string;
      subcategoryId: number | null;
    }) => {
      console.log("Updating product", productId, "with data:", {
        category,
        subcategoryId,
        subcategoryIdType: typeof subcategoryId,
      });

      // Make sure subcategoryId is either a valid number or null
      // Handle special cases: undefined, empty string, 0, "0", "none"
      let normalizedSubcategoryId: number | null = subcategoryId;

      // Check for empty or special values that should be converted to null
      if (
        normalizedSubcategoryId === undefined ||
        normalizedSubcategoryId === null ||
        normalizedSubcategoryId === 0
      ) {
        normalizedSubcategoryId = null;
      } else if (typeof normalizedSubcategoryId === "string") {
        // Handle string values that should be null
        if (
          normalizedSubcategoryId === "" ||
          normalizedSubcategoryId === "0" ||
          normalizedSubcategoryId === "none"
        ) {
          normalizedSubcategoryId = null;
        } else {
          // Try to convert string to number
          const parsed = Number(normalizedSubcategoryId);
          // If conversion results in NaN, set to null
          normalizedSubcategoryId = isNaN(parsed) ? null : parsed;
        }
      }

      // Log the normalized data before sending
      console.log("Sending normalized data:", {
        category,
        subcategoryId: normalizedSubcategoryId,
        subcategoryIdType: typeof normalizedSubcategoryId,
      });

      // First fetch the current product data to ensure we have the latest variants
      const currentProductResponse = await fetch(`/api/products/${productId}`);
      const currentProduct = await currentProductResponse.json();
      console.log(
        "Current product variants:",
        currentProduct.variants?.length || 0
      );

      // Include the variants in the update request to ensure they are preserved
      const response = await apiRequest("PUT", `/api/products/${productId}`, {
        productData: {
          category,
          subcategoryId: normalizedSubcategoryId,
          // Include existing variants to ensure they're preserved
          __preserveVariants: true,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update product category");
      }

      // Log the response data
      const responseData = await response.json();
      console.log("Update response:", responseData);

      return responseData;
    },
    onSuccess: () => {
      setEditingProductId(null);
      setEditingCategory("");
      setEditingSubcategoryId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product updated",
        description: "Product category and subcategory updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter and sort products
  const filteredProducts = products
    ?.filter((product) => {
      // Advanced text search by field
      let matchesSearch: boolean = true;

      if (search) {
        const searchLower = search.toLowerCase();
        if (searchField === "all") {
          matchesSearch =
            product.name.toLowerCase().includes(searchLower) ||
            (!!product.description &&
              product.description.toLowerCase().includes(searchLower)) ||
            (!!product.category &&
              product.category.toLowerCase().includes(searchLower)) ||
            (!!product.sku &&
              product.sku.toLowerCase().includes(searchLower)) ||
            (!!product.sellerId &&
              `Seller #${product.sellerId}`
                .toLowerCase()
                .includes(searchLower));
        } else if (searchField === "name") {
          matchesSearch = product.name.toLowerCase().includes(searchLower);
        } else if (searchField === "description") {
          matchesSearch =
            !!product.description &&
            product.description.toLowerCase().includes(searchLower);
        } else if (searchField === "category") {
          matchesSearch =
            !!product.category &&
            product.category.toLowerCase().includes(searchLower);
        } else if (searchField === "sku") {
          matchesSearch =
            !!product.sku && product.sku.toLowerCase().includes(searchLower);
        } else if (searchField === "seller") {
          matchesSearch =
            !!product.sellerId &&
            `Seller #${product.sellerId}`.toLowerCase().includes(searchLower);
        }
      }

      // Category filter
      const matchesCategory = !categoryFilter
        ? true
        : product.category === categoryFilter;

      // Price range filter
      const [minPrice, maxPrice] = priceRangeFilter;
      const price =
        typeof product.price === "number"
          ? product.price
          : Number(product.price) || 0;
      const matchesPrice =
        (!minPrice || price >= minPrice) && (!maxPrice || price <= maxPrice);

      // Stock filter
      const stock =
        typeof product.stock === "number"
          ? product.stock
          : Number(product.stock) || 0;
      const matchesStock = !stockFilter
        ? true
        : stockFilter === "inStock"
          ? stock > 0
          : stock === 0;

      return matchesSearch && matchesCategory && matchesPrice && matchesStock;
    })
    // Dynamic sorting
    .sort((a, b) => {
      if (sortBy === "newest") return b.id - a.id;
      if (sortBy === "oldest") return a.id - b.id;
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      if (sortBy === "name-desc") return b.name.localeCompare(a.name);
      if (sortBy === "price-low") {
        const aPrice = a.price || 0;
        const bPrice = b.price || 0;
        return aPrice - bPrice;
      }
      if (sortBy === "price-high") {
        const aPrice = a.price || 0;
        const bPrice = b.price || 0;
        return bPrice - aPrice;
      }
      return b.id - a.id; // default to newest
    });

  // Categories are already defined above

  // Get product stats from our new dedicated API endpoint
  const { data: productStats } = useQuery({
    queryKey: ["/api/admin/product-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/product-stats", {
        credentials: "include",
      });
      return res.json();
    },
  });

  // Product counts for stats - use server provided counts from the product-stats endpoint
  const totalProductsCount = pagination?.total || 0;
  const totalProducts = productStats?.total || 0;
  const approvedProducts = productStats?.approved || 0;
  const rejectedProducts = productStats?.rejected || 0;
  const pendingProducts = productStats?.pending || 0;

  // Handler to toggle select all products
  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((product) => product.id));
    }
  };

  // Handler to toggle a single product selection
  const toggleProductSelection = (productId: number) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter((id) => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  // Confirm bulk delete
  const confirmBulkDelete = async () => {
    if (selectedProducts.length === 0) return;

    try {
      await bulkDeleteMutation.mutateAsync(selectedProducts);
      setBulkDeleteConfirm(false);
    } catch (error) {
      console.error("Bulk delete error:", error);
    }
  };

  // Handler to change the page
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Handler to change items per page
  const handleItemsPerPageChange = (value: string) => {
    const newLimit = parseInt(value);
    setItemsPerPage(newLimit);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Loading states
  const ProductStatsLoading = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {["total", "approved", "pending", "rejected"].map((stat) => (
        <Card key={stat} className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium capitalize">
              {stat} Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // On mount, check for approval filter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const approvalParam = urlParams.get("approval");
    if (approvalParam === "rejected") {
      setApprovalFilter("rejected");
    } else if (approvalParam === "approved") {
      setApprovalFilter("approved");
    } else if (approvalParam === "pending") {
      setApprovalFilter("pending");
    }
  }, [location]); // depend on location so it updates on navigation

  // Remove old search suggestion logic and replace with instant search-as-you-type dropdown
  const [showInstantSuggestions, setShowInstantSuggestions] = useState(false);
  const [instantSuggestions, setInstantSuggestions] = useState<string[]>([]);

  // Update instant suggestions as user types
  useEffect(() => {
    if (searchInput.trim().length < 1) {
      setInstantSuggestions([]);
      setShowInstantSuggestions(false);
      return;
    }
    // Filter product names for instant suggestions
    const matches = products
      .filter((p) => p.name.toLowerCase().includes(searchInput.toLowerCase()))
      .map((p) => p.name)
      .slice(0, 7);
    setInstantSuggestions(matches);
    setShowInstantSuggestions(true);
  }, [searchInput, products]);

  // When approvalFilter changes, clear search and category filters to avoid mixing results
  useEffect(() => {
    setSearch("");
    setSearchInput("");
    setCategoryFilter(null);
  }, [approvalFilter]);

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-4 lg:px-6">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight">
            Product Management
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm lg:text-base">
            Manage your store's products, approvals, and inventory
          </p>
        </div>

        {/* Products Stats */}
        {isLoading ? (
          <ProductStatsLoading />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Total Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-base sm:text-lg lg:text-2xl font-bold">
                  {totalProducts}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Approved Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-base sm:text-lg lg:text-2xl font-bold">
                  {approvedProducts}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Pending Approval
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-base sm:text-lg lg:text-2xl font-bold">
                  {pendingProducts}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Rejected Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-base sm:text-lg lg:text-2xl font-bold">
                  {rejectedProducts}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Products Data Table */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col gap-2 sm:gap-3">
            <div className="relative flex-1 space-y-1">
              {/* Advanced Search UI */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* Field selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 sm:h-10 px-2 sm:px-3 font-normal justify-between text-xs sm:text-sm"
                      role="combobox"
                    >
                      {searchField === "all"
                        ? "All Fields"
                        : searchField === "name"
                          ? "Name"
                          : searchField === "description"
                            ? "Description"
                            : searchField === "category"
                              ? "Category"
                              : searchField === "sku"
                                ? "SKU"
                                : searchField === "seller"
                                  ? "Seller"
                                  : "All Fields"}
                      <ChevronDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-40 sm:w-48 max-w-xs max-h-60 overflow-auto">
                    <DropdownMenuLabel>Search in field</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup
                      value={searchField}
                      onValueChange={setSearchField}
                    >
                      <DropdownMenuRadioItem value="all">
                        All Fields
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="name">
                        Name
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="description">
                        Description
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="category">
                        Category
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="sku">
                        SKU
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="seller">
                        Seller
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Search input with suggestions */}
                <div className="relative flex-1">
                  <div className="rounded-lg border shadow-md overflow-visible">
                    <div className="flex items-center border-b px-2 sm:px-3">
                      <Search className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0 opacity-50" />
                      <input
                        ref={searchInputRef}
                        placeholder={`Search in ${searchField === "all" ? "all fields" : searchField}...`}
                        value={searchInput}
                        onChange={(e) => {
                          setSearchInput(e.target.value);
                        }}
                        className="flex h-9 sm:h-10 w-full rounded-md bg-transparent py-2 sm:py-3 text-xs sm:text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        onFocus={() => {
                          if (searchInput.length > 0)
                            setShowInstantSuggestions(true);
                        }}
                        onBlur={() => {
                          // Delay hiding to allow click
                          setTimeout(
                            () => setShowInstantSuggestions(false),
                            150
                          );
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            performSearch();
                            setShowInstantSuggestions(false);
                          }
                        }}
                      />
                      {(searchInput || search) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={clearSearch}
                          title="Clear search"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      <Popover
                        open={advancedSearchOpen}
                        onOpenChange={setAdvancedSearchOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-1 px-2"
                            title="Advanced Search"
                          >
                            <Filter className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-4" align="end">
                          <div className="grid gap-4">
                            <div>
                              <h4 className="font-medium mb-2">Price Range</h4>
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="number"
                                  placeholder="Min"
                                  value={
                                    priceRangeFilter[0] === null
                                      ? ""
                                      : priceRangeFilter[0]
                                  }
                                  onChange={(e) =>
                                    setPriceRangeFilter([
                                      e.target.value
                                        ? parseFloat(e.target.value)
                                        : null,
                                      priceRangeFilter[1],
                                    ])
                                  }
                                  className="w-1/2"
                                />
                                <span>-</span>
                                <Input
                                  type="number"
                                  placeholder="Max"
                                  value={
                                    priceRangeFilter[1] === null
                                      ? ""
                                      : priceRangeFilter[1]
                                  }
                                  onChange={(e) =>
                                    setPriceRangeFilter([
                                      priceRangeFilter[0],
                                      e.target.value
                                        ? parseFloat(e.target.value)
                                        : null,
                                    ])
                                  }
                                  className="w-1/2"
                                />
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Stock Status</h4>
                              <div className="flex items-center space-x-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className="w-full justify-between"
                                    >
                                      {stockFilter === "inStock"
                                        ? "In Stock"
                                        : stockFilter === "outOfStock"
                                          ? "Out of Stock"
                                          : "Any"}
                                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="w-48">
                                    <DropdownMenuRadioGroup
                                      value={stockFilter || "any"}
                                      onValueChange={(v) =>
                                        setStockFilter(v === "any" ? null : v)
                                      }
                                    >
                                      <DropdownMenuRadioItem value="any">
                                        Any
                                      </DropdownMenuRadioItem>
                                      <DropdownMenuRadioItem value="inStock">
                                        In Stock
                                      </DropdownMenuRadioItem>
                                      <DropdownMenuRadioItem value="outOfStock">
                                        Out of Stock
                                      </DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Sort By</h4>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="w-full justify-between"
                                  >
                                    {sortBy === "newest"
                                      ? "Newest First"
                                      : sortBy === "oldest"
                                        ? "Oldest First"
                                        : sortBy === "name-asc"
                                          ? "Name (A-Z)"
                                          : sortBy === "name-desc"
                                            ? "Name (Z-A)"
                                            : sortBy === "price-low"
                                              ? "Price (Low to High)"
                                              : sortBy === "price-high"
                                                ? "Price (High to Low)"
                                                : "Newest First"}
                                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-48">
                                  <DropdownMenuRadioGroup
                                    value={sortBy}
                                    onValueChange={setSortBy}
                                  >
                                    <DropdownMenuRadioItem value="newest">
                                      Newest First
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="oldest">
                                      Oldest First
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="name-asc">
                                      Name (A-Z)
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="name-desc">
                                      Name (Z-A)
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="price-low">
                                      Price (Low to High)
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="price-high">
                                      Price (High to Low)
                                    </DropdownMenuRadioItem>
                                  </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setPriceRangeFilter([null, null]);
                                  setStockFilter(null);
                                  setSortBy("newest");
                                  setAdvancedSearchOpen(false);
                                }}
                              >
                                Reset
                              </Button>
                              <Button
                                onClick={() => {
                                  // Apply filters and close popover
                                  queryClient.invalidateQueries({
                                    queryKey: ["/api/products"],
                                  });
                                  setAdvancedSearchOpen(false);

                                  // Update URL with filters
                                  const searchParams = new URLSearchParams(
                                    window.location.search
                                  );
                                  if (priceRangeFilter[0])
                                    searchParams.set(
                                      "minPrice",
                                      priceRangeFilter[0].toString()
                                    );
                                  else searchParams.delete("minPrice");

                                  if (priceRangeFilter[1])
                                    searchParams.set(
                                      "maxPrice",
                                      priceRangeFilter[1].toString()
                                    );
                                  else searchParams.delete("maxPrice");

                                  if (stockFilter)
                                    searchParams.set("stock", stockFilter);
                                  else searchParams.delete("stock");

                                  if (sortBy !== "newest")
                                    searchParams.set("sortBy", sortBy);
                                  else searchParams.delete("sortBy");

                                  const newUrl = `${
                                    window.location.pathname
                                  }?${searchParams.toString()}`;
                                  window.history.pushState({}, "", newUrl);
                                }}
                              >
                                Apply Filters
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    {/* Instant search suggestions dropdown */}
                    {showInstantSuggestions && (
                      <div className="absolute left-0 right-0 z-20 bg-white border border-t-0 rounded-b-lg shadow-lg max-h-60 overflow-y-auto">
                        {instantSuggestions.length > 0 ? (
                          instantSuggestions.map((suggestion) => (
                            <div
                              key={suggestion}
                              className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                              onMouseDown={() => {
                                setSearchInput(suggestion);
                                setShowInstantSuggestions(false);
                                performSearch();
                              }}
                            >
                              {suggestion}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-muted-foreground text-sm select-none">
                            Your product is not listed here.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Search button */}
                <Button
                  type="submit"
                  className="px-4 h-10"
                  onClick={performSearch}
                >
                  <Search className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Search</span>
                </Button>
              </div>

              {/* Search functions moved to the top of the component */}

              {/* Active Filters */}
              {(search ||
                categoryFilter ||
                approvalFilter ||
                priceRangeFilter[0] ||
                priceRangeFilter[1] ||
                stockFilter) && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {search && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1 text-xs"
                    >
                      <span>Search: {search}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => {
                          setSearch("");
                          setSearchInput("");
                          // Update URL
                          const searchParams = new URLSearchParams(
                            window.location.search
                          );
                          searchParams.delete("search");
                          const newUrl = `${
                            window.location.pathname
                          }?${searchParams.toString()}`;
                          window.history.pushState({}, "", newUrl);
                          queryClient.invalidateQueries({
                            queryKey: ["/api/products"],
                          });
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  {searchField !== "all" && (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 text-xs"
                    >
                      <span>Field: {searchField}</span>
                    </Badge>
                  )}
                  {(priceRangeFilter[0] || priceRangeFilter[1]) && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1 text-xs"
                    >
                      <span>
                        Price: {priceRangeFilter[0] || "0"} -{" "}
                        {priceRangeFilter[1] || "any"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => {
                          setPriceRangeFilter([null, null]);
                          // Update URL
                          const searchParams = new URLSearchParams(
                            window.location.search
                          );
                          searchParams.delete("minPrice");
                          searchParams.delete("maxPrice");
                          const newUrl = `${
                            window.location.pathname
                          }?${searchParams.toString()}`;
                          window.history.pushState({}, "", newUrl);
                          queryClient.invalidateQueries({
                            queryKey: ["/api/products"],
                          });
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  {stockFilter && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1 text-xs"
                    >
                      <span>
                        Stock:{" "}
                        {stockFilter === "inStock"
                          ? "In Stock"
                          : "Out of Stock"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => {
                          setStockFilter(null);
                          // Update URL
                          const searchParams = new URLSearchParams(
                            window.location.search
                          );
                          searchParams.delete("stock");
                          const newUrl = `${
                            window.location.pathname
                          }?${searchParams.toString()}`;
                          window.history.pushState({}, "", newUrl);
                          queryClient.invalidateQueries({
                            queryKey: ["/api/products"],
                          });
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  {sortBy !== "newest" && (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 text-xs"
                    >
                      <span>
                        Sorting:{" "}
                        {sortBy === "oldest"
                          ? "Oldest First"
                          : sortBy === "name-asc"
                            ? "Name (A-Z)"
                            : sortBy === "name-desc"
                              ? "Name (Z-A)"
                              : sortBy === "price-low"
                                ? "Price (Low to High)"
                                : sortBy === "price-high"
                                  ? "Price (High to Low)"
                                  : "Newest First"}
                      </span>
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      // Clear all filters
                      setSearch("");
                      setSearchInput("");
                      setCategoryFilter(null);
                      setApprovalFilter(null);
                      setPriceRangeFilter([null, null]);
                      setStockFilter(null);
                      setSortBy("newest");

                      // Update URL - remove all filter parameters
                      const newUrl = window.location.pathname;
                      window.history.pushState({}, "", newUrl);

                      // Refetch products without filters
                      queryClient.invalidateQueries({
                        queryKey: ["/api/products"],
                      });
                    }}
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              {/* Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto text-xs sm:text-sm"
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                    {(approvalFilter || categoryFilter) && (
                      <Badge variant="secondary" className="ml-2 px-1">
                        {(approvalFilter ? 1 : 0) + (categoryFilter ? 1 : 0)}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel>Filter Products</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <div className="p-2">
                    <div className="mb-2 font-medium text-sm">
                      Approval Status
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Button
                        variant={
                          approvalFilter === null ? "secondary" : "outline"
                        }
                        size="sm"
                        onClick={() => setApprovalFilter(null)}
                        className="justify-start"
                      >
                        All
                      </Button>
                      <Button
                        variant={
                          approvalFilter === "approved"
                            ? "secondary"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => setApprovalFilter("approved")}
                        className="justify-start"
                      >
                        <Check className="mr-2 h-4 w-4" /> Approved
                      </Button>
                      <Button
                        variant={
                          approvalFilter === "pending" ? "secondary" : "outline"
                        }
                        size="sm"
                        onClick={() => setApprovalFilter("pending")}
                        className="justify-start"
                      >
                        <Clock className="mr-2 h-4 w-4" /> Pending
                      </Button>
                      <Button
                        variant={
                          approvalFilter === "rejected"
                            ? "secondary"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => setApprovalFilter("rejected")}
                        className="justify-start"
                      >
                        <X className="mr-2 h-4 w-4" /> Rejected
                      </Button>
                    </div>
                  </div>

                  <DropdownMenuSeparator />

                  <div className="p-2">
                    <div className="mb-2 font-medium text-sm">Categories</div>
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
                      {categories.map((category: string) => (
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

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="justify-center cursor-pointer"
                    onClick={() => {
                      setApprovalFilter(null);
                      setCategoryFilter(null);
                      setSearch("");
                    }}
                  >
                    Clear All Filters
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Action Buttons */}
              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={isLoading}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              {selectedProducts.length > 0 && (
                <Button
                  variant="destructive"
                  className="w-full sm:w-auto text-xs sm:text-sm"
                  onClick={() => setBulkDeleteConfirm(true)}
                  disabled={bulkDeleteMutation.isPending}
                >
                  {bulkDeleteMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">
                    Delete Selected ({selectedProducts.length})
                  </span>
                  <span className="sm:hidden">
                    Delete ({selectedProducts.length})
                  </span>
                </Button>
              )}
              <Button className="w-full sm:w-auto text-xs sm:text-sm" asChild>
                <a href="/api/admin/products/export" download>
                  <FileDown className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Export All Products</span>
                  <span className="sm:hidden">Export</span>
                </a>
              </Button>
              <Button className="w-full sm:w-auto text-xs sm:text-sm" asChild>
                <Link href="/admin/products/add">
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Add Product</span>
                  <span className="sm:hidden">Add</span>
                </Link>
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-md border overflow-x-auto">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Skeleton className="h-4 w-4 rounded" />
                    </TableHead>
                    <TableHead className="w-[100px]">
                      <Skeleton className="h-4 w-12 rounded" />
                    </TableHead>
                    <TableHead>
                      <Skeleton className="h-4 w-48" />
                    </TableHead>
                    <TableHead>
                      <Skeleton className="h-4 w-24" />
                    </TableHead>
                    <TableHead>
                      <Skeleton className="h-4 w-20" />
                    </TableHead>
                    <TableHead>
                      <Skeleton className="h-4 w-16" />
                    </TableHead>
                    <TableHead>
                      <Skeleton className="h-4 w-20" />
                    </TableHead>
                    <TableHead className="w-[100px]">
                      <Skeleton className="h-4 w-16" />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-4 rounded" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-12 w-12 rounded" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={
                          products.length > 0 &&
                          selectedProducts.length === products.length
                        }
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="w-[100px]">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center space-y-2">
                          <Package className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            No products found
                          </p>
                          <Button asChild>
                            <Link href="/admin/products/add">
                              <Plus className="mr-2 h-4 w-4" />
                              Add Product
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={() =>
                              toggleProductSelection(product.id)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100">
                            <img
                              src={
                                product.imageUrl ||
                                "https://placehold.co/200x200/gray/white?text=No+Image"
                              }
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src =
                                  "https://placehold.co/200x200/gray/white?text=No+Image";
                              }}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px] sm:max-w-[300px]">
                            <div className="font-medium truncate">
                              {product.name}
                              {product.rejected ? " (REJECTED)" : ""}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                              {product.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {product.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            ₹{product.price?.toLocaleString() || "0"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {product.stock || 0} units
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              product.approved
                                ? "default"
                                : product.rejected
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="text-xs"
                          >
                            {product.approved
                              ? "Approved"
                              : product.rejected
                                ? "Rejected"
                                : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setViewProduct(product)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/admin/products/edit/${product.id}`}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Product
                                </Link>
                              </DropdownMenuItem>
                              {!product.approved && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleApproveProduct(product)
                                    }
                                  >
                                    <Check className="mr-2 h-4 w-4" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleRejectProduct(product)}
                                  >
                                    <X className="mr-2 h-4 w-4" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(product)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {products.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, products.length)} of{" "}
                  {products.length} products
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Show:</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={handleItemsPerPageChange}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of{" "}
                    {Math.ceil(products.length / itemsPerPage)}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={
                      currentPage >= Math.ceil(products.length / itemsPerPage)
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Product Details Dialog */}
        <Dialog
          open={viewProduct !== null}
          onOpenChange={(open) => !open && setViewProduct(null)}
        >
          {viewProduct && (
            <DialogContent className="max-w-full sm:max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{viewProduct.name}</DialogTitle>
                <DialogDescription>
                  Product ID: {viewProduct.id} | Added by{" "}
                  {viewProduct.sellerId
                    ? `Seller #${viewProduct.sellerId}`
                    : "Unknown Seller"}
                </DialogDescription>
              </DialogHeader>

              <div className="grid md:grid-cols-2 gap-6 mt-4">
                {/* Product Images */}
                <div>
                  <ProductImageGallery
                    imageUrl={viewProduct.imageUrl}
                    additionalImages={viewProduct.images}
                    productName={viewProduct.name}
                  />
                </div>

                {/* Product Details */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Product ID
                    </h3>
                    <p className="font-mono text-sm">{viewProduct.id}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Price</h3>
                    <p className="text-xl font-bold">
                      ₹{Number(viewProduct.price).toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Category
                    </h3>
                    <p>{viewProduct.category}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Status
                    </h3>
                    <Badge
                      className={
                        viewProduct.approved
                          ? "bg-green-100 text-green-800"
                          : viewProduct.rejected
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {viewProduct.approved
                        ? "Approved"
                        : viewProduct.rejected
                          ? "Rejected"
                          : "Pending Approval"}
                    </Badge>
                  </div>

                  {viewProduct.stock !== undefined && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Stock
                      </h3>
                      <p>{viewProduct.stock} units</p>
                    </div>
                  )}

                  {viewProduct.color && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Color
                      </h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="outline">{viewProduct.color}</Badge>
                      </div>
                    </div>
                  )}

                  {viewProduct.size && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Size
                      </h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="outline">{viewProduct.size}</Badge>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Description
                    </h3>
                    <RichTextContent
                      content={viewProduct.description}
                      className="text-sm"
                    />
                  </div>

                  {viewProduct.specifications && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Specifications
                      </h3>
                      <RichTextContent
                        content={viewProduct.specifications}
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setViewProduct(null)}>
                  Close
                </Button>

                {/* Show approve/reject buttons only for pending products */}
                {viewProduct && !viewProduct.approved && (
                  <>
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                      onClick={() => {
                        handleRejectProduct(viewProduct);
                        setViewProduct(null);
                      }}
                      disabled={rejectMutation.isPending}
                    >
                      {rejectMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        </>
                      ) : (
                        <X className="mr-2 h-4 w-4" />
                      )}
                      Reject Product
                    </Button>

                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        handleApproveProduct(viewProduct);
                        setViewProduct(null);
                      }}
                      disabled={approveMutation.isPending}
                    >
                      {approveMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="mr-2 h-4 w-4" />
                      )}
                      Approve Product
                    </Button>
                  </>
                )}

                <Button asChild>
                  <Link
                    href={`/admin/products/edit/${viewProduct.id}`}
                    onClick={() => setViewProduct(null)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Product
                  </Link>
                </Button>
              </div>
            </DialogContent>
          )}
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={deleteConfirm.open}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteConfirm({
                open: false,
                productId: null,
                productName: "",
              });
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Product</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;
                {deleteConfirm.productName}
                &quot;?
                <br />
                <br />
                This action cannot be undone and will permanently remove the
                product from your store.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
          open={bulkDeleteConfirm}
          onOpenChange={(open) => {
            if (!open) {
              setBulkDeleteConfirm(false);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Multiple Products</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {selectedProducts.length}{" "}
                products?
                <br />
                <br />
                This action cannot be undone and will permanently remove these
                products from your store.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmBulkDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                {bulkDeleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete All Selected"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Assign Seller Dialog */}
        <Dialog
          open={assignSellerProduct !== null}
          onOpenChange={(open) => {
            if (!open) {
              setAssignSellerProduct(null);
              setSelectedSellerId("");
              setSellerSearchTerm("");
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Product to a Different Seller</DialogTitle>
              <DialogDescription>
                Reassign "{assignSellerProduct?.name}" to another seller.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="seller-search">Search Sellers</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="seller-search"
                    type="search"
                    placeholder="Search by name or email..."
                    className="pl-9"
                    value={sellerSearchTerm}
                    onChange={(e) => setSellerSearchTerm(e.target.value)}
                  />
                </div>

                <Label htmlFor="seller-select" className="mt-4">
                  Select Seller
                </Label>
                <Select
                  value={selectedSellerId}
                  onValueChange={setSelectedSellerId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a seller" />
                  </SelectTrigger>
                  <SelectContent>
                    {sellers.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        Loading sellers...
                      </div>
                    ) : (
                      sellers
                        .filter(
                          (seller) =>
                            !sellerSearchTerm ||
                            (seller.name?.toLowerCase() || "").includes(
                              sellerSearchTerm.toLowerCase()
                            ) ||
                            (seller.username.toLowerCase() || "").includes(
                              sellerSearchTerm.toLowerCase()
                            ) ||
                            (seller.email.toLowerCase() || "").includes(
                              sellerSearchTerm.toLowerCase()
                            )
                        )
                        .map((seller) => (
                          <SelectItem
                            key={seller.id}
                            value={seller.id.toString()}
                          >
                            {seller.name || seller.username} ({seller.email})
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>

                {/* Current seller information */}
                {assignSellerProduct && (
                  <div className="mt-4 p-2 bg-muted rounded-md">
                    <p className="text-sm font-medium">Current Seller</p>
                    <p className="text-sm">
                      {assignSellerProduct.sellerId
                        ? `Seller #${assignSellerProduct.sellerId}`
                        : "Unknown Seller"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                onClick={handleAssignSeller}
                disabled={assignSellerMutation.isPending || !selectedSellerId}
              >
                {assignSellerMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reassigning...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Reassign Product
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
