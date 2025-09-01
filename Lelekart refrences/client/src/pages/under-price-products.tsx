import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import axiosClient from "@/lib/axiosClient";
import { ProductCard } from "@/components/ui/product-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function UnderPriceProductsPage() {
  const [location] = useLocation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const price = parseInt(location.split("/").pop() || "0", 10);

  useEffect(() => {
    setLoading(true);
    setError("");

    const fetchProducts = async () => {
      try {
        // Fetch products with pagination and price filtering
        const res = await axiosClient.get("/api/products", {
          params: {
            page: currentPage,
            limit: 24, // Show 24 products per page
            maxPrice: price, // Add maxPrice parameter to filter by price
          },
        });

        if (res.data && res.data.products) {
          setProducts(res.data.products);
          setTotalPages(res.data.pagination?.totalPages || 1);
          setTotalProducts(res.data.pagination?.total || 0);
        } else {
          setProducts([]);
          setTotalPages(1);
          setTotalProducts(0);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products. Please try again.");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [price, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F5E4] py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold mb-6">
            All Products Under ₹{price}
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="flex flex-col space-y-3">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F5E4] py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">All Products Under ₹{price}</h1>

        {error ? (
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              Try Again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-600 mb-4">
              No products found under ₹{price}.
            </div>
            <p className="text-sm text-gray-500">
              Try adjusting your price range or check back later for new
              products.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 text-sm text-gray-600">
              Showing {products.length} of {totalProducts} products under ₹
              {price}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product: any) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  showAddToCart={true}
                />
              ))}
            </div>

            {/* Simple pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-8">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>

                <span className="px-3 py-2 text-sm">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
