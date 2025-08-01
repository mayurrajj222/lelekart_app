import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
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
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import { CartProvider } from "@/context/cart-context";
import { Pagination } from "@/components/ui/pagination";

// Define an interface that matches the ExtendedProduct in product-card.tsx
interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl?: string;
  image_url?: string;
  image?: string;
  images?: string;
  description: string;
  category: string;
  sellerId: number;
  approved: boolean;
  createdAt: string;
  specifications?: string | null;
  purchasePrice?: number | null;
  color?: string | null;
  size?: string | null;
  stock?: number;
}

// Add the homepage category order for consistent cycling
const allCategories = [
  "Electronics",
  "Fashion",
  "Home",
  "Appliances",
  "Mobiles",
  "Beauty",
  "Toys",
  "Grocery",
];

export default function AllProductsPage() {
  const params = useParams();
  const [, navigate] = useLocation();
  const [currentPage, setCurrentPage] = useState<number>(
    parseInt(params.page || "1")
  );
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Function to get product image URL
  const getProductImageUrl = (product: Product): string => {
    // First try to use imageUrl (camelCase)
    if (product.imageUrl) {
      return product.imageUrl;
    }

    // Then try image_url (snake_case)
    if (product.image_url) {
      return product.image_url;
    }

    // Then try to parse images JSON array and get first image
    if (product.images) {
      try {
        // If it's already a string, parse it
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

    // Fallback to placeholder
    return "https://via.placeholder.com/300x300?text=Product";
  };

  // Get sellerId from URL query parameters if available
  const [searchParams] = useState(
    () => new URLSearchParams(window.location.search)
  );
  const sellerId = searchParams.get("sellerId");
  const sellerName = searchParams.get("sellerName");

  // Fetch a larger pool of products for better mixing
  const LARGE_POOL_SIZE = 500;
  const {
    data: productsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/products", { page: 1, limit: LARGE_POOL_SIZE, sellerId }],
    queryFn: async () => {
      let url = `/api/products?page=1&limit=${LARGE_POOL_SIZE}`;
      if (sellerId) {
        url += `&sellerId=${sellerId}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      return response.json();
    },
  });

  // Update URL when page changes
  useEffect(() => {
    navigate(`/products/page/${currentPage}`);
  }, [currentPage, navigate]);

  // Update total pages when data is loaded
  useEffect(() => {
    if (productsData && productsData.pagination) {
      setTotalPages(productsData.pagination.totalPages);
    }
  }, [productsData]);

  return (
    <CartProvider>
      <div className="container mx-auto py-8 px-2 sm:px-4">
        {/* Responsive header and filter controls */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-center sm:text-left">
            {sellerName ? `Products by ${sellerName}` : "All Products"}
          </h1>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="flex items-center w-full sm:w-auto">
              <span className="text-sm mr-2">Show:</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(parseInt(value));
                  setCurrentPage(1); // Reset to first page when changing page size
                }}
              >
                <SelectTrigger className="w-full sm:w-[100px]">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-60">
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
            {/* True mixup: each row contains products from different categories, as much as possible */}
            <div className="space-y-8">
              {(() => {
                const products = productsData.products;
                // Group products by category (case-insensitive)
                const categoryMap: Record<string, Product[]> = {};
                const foundCategories: Set<string> = new Set();
                products.forEach((product: Product) => {
                  let cat = allCategories.find(
                    (c) =>
                      c.toLowerCase() === (product.category || "").toLowerCase()
                  );
                  if (!cat) {
                    cat = product.category ? product.category.trim() : "Others";
                  }
                  foundCategories.add(cat);
                  if (!categoryMap[cat]) categoryMap[cat] = [];
                  categoryMap[cat].push(product);
                });
                // Build the round-robin order: allCategories first, then any new categories found in data
                const roundRobinCategories = [
                  ...allCategories,
                  ...Array.from(foundCategories).filter(
                    (cat) => !allCategories.includes(cat)
                  ),
                ];
                // Improved round-robin: always pick one from each category in order, skip empty, repeat until page is filled
                const mixedProducts: Product[] = [];
                const catIndexes: Record<string, number> = {};
                roundRobinCategories.forEach((cat) => {
                  catIndexes[cat] = 0;
                });
                while (mixedProducts.length < pageSize * currentPage) {
                  let addedThisRound = false;
                  for (const cat of roundRobinCategories) {
                    const idx = catIndexes[cat];
                    if (categoryMap[cat] && categoryMap[cat][idx]) {
                      mixedProducts.push(categoryMap[cat][idx]);
                      catIndexes[cat]++;
                      addedThisRound = true;
                      if (mixedProducts.length >= pageSize * currentPage) break;
                    }
                  }
                  if (!addedThisRound) break; // No more products to add
                }
                // If not enough, fill with any remaining products from underrepresented categories
                if (mixedProducts.length < pageSize * currentPage) {
                  const allLeft = products.filter(
                    (p: Product) => !mixedProducts.includes(p)
                  );
                  for (const p of allLeft) {
                    mixedProducts.push(p);
                    if (mixedProducts.length >= pageSize * currentPage) break;
                  }
                }
                // Paginate the mixed products locally
                const startIdx = (currentPage - 1) * pageSize;
                const endIdx = startIdx + pageSize;
                const paginatedProducts = mixedProducts.slice(startIdx, endIdx);
                return (
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {paginatedProducts.map(
                      (product: Product, colIndex: number) => (
                        <ProductCard
                          key={product.id}
                          product={
                            {
                              ...product,
                              imageUrl: getProductImageUrl(product),
                            } as any
                          }
                          priority={colIndex === 0}
                        />
                      )
                    )}
                  </div>
                );
              })()}
            </div>
            {/* Pagination */}
            <div className="mt-8 flex flex-col items-center gap-2">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(
                  (productsData.products.length || 1) / pageSize
                )}
                onPageChange={(page) => setCurrentPage(page)}
              />
              {/* Results count */}
              <div className="text-sm text-gray-500 text-center mt-2">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, productsData.products.length)}{" "}
                of {productsData.products.length} products
              </div>
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
    </CartProvider>
  );
}
