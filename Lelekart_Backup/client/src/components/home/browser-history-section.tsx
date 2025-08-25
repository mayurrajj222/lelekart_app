import { ProductCard } from "@/components/ui/product-card";

interface BrowserHistorySectionProps {
  browserHistory: string[];
  recentSearchProducts: any[];
  loadingRecentSearchProducts: boolean;
  hasMore: boolean;
  infiniteProducts: any[];
  infinitePagination: any;
}

export default function BrowserHistorySection({
  browserHistory,
  recentSearchProducts,
  loadingRecentSearchProducts,
  hasMore,
  infiniteProducts,
  infinitePagination,
}: BrowserHistorySectionProps) {
  if (browserHistory.length === 0) return null;

  return (
    <div className="bg-[#F8F5E4] rounded-2xl p-4 border border-[#e0c9a6] shadow-md mt-6 mb-2">
      <h2 className="text-lg font-semibold mb-4 text-black">
        Your Recent Searches
      </h2>
      {loadingRecentSearchProducts ? (
        <div className="flex items-center justify-center py-8 text-center flex-col">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
          <h3 className="text-sm font-medium">
            Loading recent searches...
          </h3>
        </div>
      ) : recentSearchProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-2">
          {recentSearchProducts.map((product, idx) => (
            <ProductCard
              key={product.id || idx}
              product={product}
              featured={false}
              showAddToCart={true}
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center py-8 text-center flex-col">
          <div className="bg-gray-100 rounded-full p-3 mb-3">
            <svg
              className="h-6 w-6 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-medium">
            No products found for your recent searches
          </h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Your recent search products will appear here
          </p>
        </div>
      )}

      {!hasMore && infiniteProducts.length > 0 && (
        <div className="text-sm text-gray-500 text-center mt-4">
          Showing {infiniteProducts.length} of {infinitePagination.total} products
        </div>
      )}
    </div>
  );
}
