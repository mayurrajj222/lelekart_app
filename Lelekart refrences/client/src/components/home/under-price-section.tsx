import { ProductCard } from "@/components/ui/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

interface UnderPriceSectionProps {
  under199Data: any;
  under399Data: any;
  under599Data: any;
  isLoadingUnder199: boolean;
  isLoadingUnder399: boolean;
  isLoadingUnder599: boolean;
}

export default function UnderPriceSection({
  under199Data,
  under399Data,
  under599Data,
  isLoadingUnder199,
  isLoadingUnder399,
  isLoadingUnder599,
}: UnderPriceSectionProps) {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { price: 199, data: under199Data, isLoading: isLoadingUnder199 },
          { price: 399, data: under399Data, isLoading: isLoadingUnder399 },
          { price: 599, data: under599Data, isLoading: isLoadingUnder599 },
        ].map(({ price, data, isLoading }) => (
          <div
            key={price}
            className="bg-[#F8F5E4] rounded-2xl p-4 border border-[#e0c9a6] shadow-md flex flex-col justify-between"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium">Under ₹{price}</h2>
              <Link
                href={`/under/${price}`}
                className="text-primary hover:underline"
              >
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2 justify-center">
              {isLoading
                ? [...Array(4)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <Skeleton className="h-32 w-28 mb-2" />
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ))
                : (data?.products || [])
                    .slice(0, 4)
                    .map((product: any) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        showAddToCart={false}
                        variant="plain"
                        showWishlist={false}
                      />
                    ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
