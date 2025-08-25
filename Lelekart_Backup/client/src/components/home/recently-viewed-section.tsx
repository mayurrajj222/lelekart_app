import { ProductCard } from "@/components/ui/product-card";
import { Package } from "lucide-react";

interface RecentlyViewedSectionProps {
  recentlyViewed: any[];
  loadingRecentlyViewed: boolean;
}

export default function RecentlyViewedSection({
  recentlyViewed,
  loadingRecentlyViewed,
}: RecentlyViewedSectionProps) {
  return (
    <div className="container mx-auto px-4 pb-6">
      <div className="bg-[#EADDCB] p-4 rounded shadow-none">
        <h2 className="text-lg font-semibold mb-4 text-black">
          Recently Viewed Products
        </h2>
        {loadingRecentlyViewed ? (
          <div className="flex items-center justify-center py-8 text-center flex-col">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
            <h3 className="text-sm font-medium">
              Loading recently viewed products...
            </h3>
          </div>
        ) : recentlyViewed.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-2">
            {recentlyViewed.map((product: any) => (
              <ProductCard
                key={product.id}
                product={product}
                featured={false}
                showAddToCart={true}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 text-center flex-col">
            <div className="bg-gray-100 rounded-full p-3 mb-3">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium">No recently viewed products</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Products you view will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
