import { ProductCard } from "@/components/ui/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

interface DiscountSectionProps {
  upTo20Data: any;
  upTo40Data: any;
  upTo60Data: any;
  discount20to40Data: any;
  discount40to60Data: any;
  discount60to80Data: any;
  isLoadingUpTo20: boolean;
  isLoadingUpTo40: boolean;
  isLoadingUpTo60: boolean;
  isLoading20to40: boolean;
  isLoading40to60: boolean;
  isLoading60to80: boolean;
}

export default function DiscountSection({
  upTo20Data,
  upTo40Data,
  upTo60Data,
  discount20to40Data,
  discount40to60Data,
  discount60to80Data,
  isLoadingUpTo20,
  isLoadingUpTo40,
  isLoadingUpTo60,
  isLoading20to40,
  isLoading40to60,
  isLoading60to80,
}: DiscountSectionProps) {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { percent: 20, data: upTo20Data, isLoading: isLoadingUpTo20 },
          { percent: 40, data: upTo40Data, isLoading: isLoadingUpTo40 },
          { percent: 60, data: upTo60Data, isLoading: isLoadingUpTo60 },
        ].map(({ percent, data, isLoading }) => (
          <div
            key={percent}
            className="bg-[#F8F5E4] rounded-2xl p-4 border border-[#e0c9a6] shadow-md flex flex-col justify-between"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium">Up to {percent}% Off</h2>
              <Link
                href={`/search?q=upto+${percent}+percent+off`}
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
                        featured={true}
                        showAddToCart={false}
                        variant="plain"
                        showWishlist={false}
                        cardBg="#EADDCB"
                      />
                    ))}
            </div>
          </div>
        ))}

        {/* Additional discount range sections */}
        {[
          {
            min: 20,
            max: 40,
            title: "20-40% Off",
            data: discount20to40Data,
            isLoading: isLoading20to40,
          },
          {
            min: 40,
            max: 60,
            title: "40-60% Off",
            data: discount40to60Data,
            isLoading: isLoading40to60,
          },
          {
            min: 60,
            max: 80,
            title: "60-80% Off",
            data: discount60to80Data,
            isLoading: isLoading60to80,
          },
        ].map(({ min, max, title, data, isLoading }) => (
          <div
            key={`${min}-${max}`}
            className="bg-[#F8F5E4] rounded-2xl p-4 border border-[#e0c9a6] shadow-md flex flex-col justify-between"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium">{title}</h2>
              <Link
                href={`/search?q=${min}-${max}+percent+off`}
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
                        featured={true}
                        showAddToCart={false}
                        variant="plain"
                        showWishlist={false}
                        cardBg="#EADDCB"
                      />
                    ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
