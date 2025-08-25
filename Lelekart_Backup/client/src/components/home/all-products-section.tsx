import { ProductCard } from "@/components/ui/product-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { Loader2, ChevronDown } from "lucide-react";
import { Product } from "@shared/schema";

interface AllProductsSectionProps {
  infiniteProducts: Product[];
  hasMore: boolean;
  isFetchingNextPage: boolean;
  loadMore: () => void;
  category: string | null;
}

export default function AllProductsSection({
  infiniteProducts,
  hasMore,
  isFetchingNextPage,
  loadMore,
  category,
}: AllProductsSectionProps) {
  if (category) return null;

  return (
    <div className="container mx-auto px-4 py-6">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Products</TabsTrigger>
          <TabsTrigger value="new">New Arrivals</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
        </TabsList>

        <TabsContent
          value="all"
          className="bg-[#EADDCB] p-4 rounded shadow-none"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium">All Products</h2>
            <Link
              href="/products"
              className="text-primary hover:underline flex items-center gap-1"
            >
              View All <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {infiniteProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index < 6}
              />
            ))}
          </div>

          {hasMore && (
            <div className="mt-6 flex justify-center">
              <Button
                onClick={loadMore}
                disabled={isFetchingNextPage}
                className="flex items-center gap-2"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    View More
                    <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="new"
          className="bg-[#EADDCB] p-4 rounded shadow-none"
        >
          <div className="text-center py-8">
            <p>New arrivals coming soon!</p>
          </div>
        </TabsContent>

        <TabsContent
          value="popular"
          className="bg-[#EADDCB] p-4 rounded shadow-none"
        >
          <div className="text-center py-8">
            <p>Popular products feature coming soon!</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
