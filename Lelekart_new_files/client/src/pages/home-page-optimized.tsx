import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { ProductCard } from "@/components/ui/product-card";
import { Product } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { HeroSection } from "@/components/ui/hero-section";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FashionProductCardFixed } from "@/components/ui/fashion-product-card-fixed";
import { LazySection } from "@/components/ui/lazy-section";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import {
  useInfiniteProducts,
  useCategoryProducts,
} from "@/hooks/use-infinite-products";

// Memoize categories to prevent unnecessary re-renders
const allCategories = [
  "Electronics",
  "Fashion",
  "Home",
  "Appliances",
  "Mobiles",
  "Beauty",
  "Toys",
  "Grocery",
] as const;

interface SliderImage {
  url: string;
  alt: string;
  title?: string;
  subtitle?: string;
  link?: string;
}

interface DealOfTheDay {
  title: string;
  subtitle: string;
  image: string;
  originalPrice: string | number;
  discountPrice: string | number;
  discountPercentage: number;
  hours: number;
  minutes: number;
  seconds: number;
  productId?: number;
}

export default function HomePageOptimized() {
  const [location] = useLocation();
  const [category, setCategory] = useState<string | null>(null);

  // Memoize URL params parsing
  const searchParams = useMemo(() => {
    return new URLSearchParams(location.split("?")[1]);
  }, [location]);

  useEffect(() => {
    const categoryParam = searchParams.get("category");
    setCategory(categoryParam);
  }, [searchParams]);

  // Optimized hero products fetching with longer cache
  const { data: heroProducts, isLoading: isLoadingHero } = useQuery<
    SliderImage[]
  >({
    queryKey: ["/api/featured-hero-products"],
    queryFn: async () => {
      const res = await fetch(
        "/api/featured-hero-products?approved=true&status=approved"
      );
      if (!res.ok) throw new Error("Failed to fetch hero products");
      return res.json();
    },
    staleTime: 15 * 60 * 1000, // 15 minutes cache
    refetchOnWindowFocus: false,
  });

  // Optimized deal of the day fetching
  const { data: dealOfTheDay, isLoading: isLoadingDeal } =
    useQuery<DealOfTheDay>({
      queryKey: ["/api/deal-of-the-day"],
      queryFn: async () => {
        const res = await fetch(
          "/api/deal-of-the-day?approved=true&status=approved"
        );
        if (!res.ok) throw new Error("Failed to fetch deal of the day");
        return res.json();
      },
      staleTime: 10 * 60 * 1000, // 10 minutes cache
    });

  // Use infinite scroll for main products
  const {
    products,
    pagination,
    hasMore,
    isLoading: isLoadingProducts,
    isFetchingNextPage,
    loadMore,
  } = useInfiniteProducts({
    category,
    pageSize: 24, // Load more products per page
    enabled: true,
  });

  // Memoize featured products (first 5 products)
  const featuredProducts = useMemo(() => {
    return products.slice(0, 5);
  }, [products]);

  // Memoize loading components
  const ProductsLoading = useMemo(
    () => () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            <Skeleton className="h-40 w-32 mb-3" />
            <Skeleton className="h-4 w-28 mb-2" />
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    ),
    []
  );

  const CategoryProductsLoading = useMemo(
    () => () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            <Skeleton className="h-32 w-28 mb-2" />
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    ),
    []
  );

  return (
    <>
      {/* Hero Section - Load immediately */}
      {isLoadingHero ? (
        <div className="h-64 bg-gradient-to-r from-blue-500 to-indigo-700 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
      ) : heroProducts && heroProducts.length > 0 ? (
        <HeroSection sliderImages={heroProducts} dealOfTheDay={dealOfTheDay} />
      ) : (
        <div className="h-64 bg-gradient-to-r from-blue-500 to-indigo-700 flex flex-col items-center justify-center text-white">
          <div className="mb-4">No banners found in Banner Management</div>
          <p className="text-sm opacity-80">
            Add banners in Admin Panel → Banner Management
          </p>
        </div>
      )}

      {/* Featured Deals - Lazy load */}
      <LazySection
        fallback={<ProductsLoading />}
        threshold={0.2}
        rootMargin="100px"
      >
        <div className="container mx-auto px-4 py-6">
          <h2 className="text-2xl font-medium mb-4">Featured Deals</h2>
          <div className="bg-white p-4 rounded shadow-sm">
            {isLoadingProducts ? (
              <ProductsLoading />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {featuredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    featured={true}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </LazySection>

      {/* Category Sections - Lazy load each category */}
      {!category &&
        allCategories.map((categoryName, index) => (
          <LazySection
            key={categoryName}
            fallback={<CategoryProductsLoading />}
            threshold={0.1}
            rootMargin="150px"
          >
            <CategorySection category={categoryName} index={index} />
          </LazySection>
        ))}

      {/* All Products Section - Lazy load with infinite scroll */}
      {!category && (
        <LazySection
          fallback={<CategoryProductsLoading />}
          threshold={0.1}
          rootMargin="200px"
        >
          <div className="container mx-auto px-4 py-6">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Products</TabsTrigger>
                <TabsTrigger value="new">New Arrivals</TabsTrigger>
                <TabsTrigger value="popular">Popular</TabsTrigger>
              </TabsList>

              <TabsContent
                value="all"
                className="bg-white p-4 rounded shadow-sm"
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

                <InfiniteScroll
                  hasMore={hasMore}
                  isLoading={isFetchingNextPage}
                  onLoadMore={loadMore}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </InfiniteScroll>

                {!hasMore && products.length > 0 && (
                  <div className="text-sm text-gray-500 text-center mt-4">
                    Showing {products.length} of {pagination.total} products
                  </div>
                )}
              </TabsContent>

              <TabsContent
                value="new"
                className="bg-white p-4 rounded shadow-sm"
              >
                <div className="text-center py-8">
                  <p>New arrivals coming soon!</p>
                </div>
              </TabsContent>

              <TabsContent
                value="popular"
                className="bg-white p-4 rounded shadow-sm"
              >
                <div className="text-center py-8">
                  <p>Popular products feature coming soon!</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </LazySection>
      )}

      {/* Category-specific products with infinite scroll */}
      {category && (
        <LazySection
          fallback={<CategoryProductsLoading />}
          threshold={0.1}
          rootMargin="100px"
        >
          <div className="container mx-auto px-4 py-6">
            <h2 className="text-2xl font-medium mb-4 capitalize">
              {category} Products
            </h2>
            <div className="bg-white p-4 rounded shadow-sm">
              <InfiniteScroll
                hasMore={hasMore}
                isLoading={isFetchingNextPage}
                onLoadMore={loadMore}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                  {products.map((product) =>
                    category?.toLowerCase() === "fashion" ? (
                      <FashionProductCardFixed
                        key={product.id}
                        product={product}
                      />
                    ) : (
                      <ProductCard key={product.id} product={product} />
                    )
                  )}
                </div>
              </InfiniteScroll>

              {!hasMore && products.length > 0 && (
                <div className="text-sm text-gray-500 text-center mt-4">
                  Showing {products.length} of {pagination.total} products
                </div>
              )}
            </div>
          </div>
        </LazySection>
      )}

      {/* No products found */}
      {category && products.length === 0 && !isLoadingProducts && (
        <div className="container mx-auto px-4 py-6 text-center">
          <div className="bg-white p-8 rounded shadow-sm">
            <h2 className="text-2xl font-medium mb-2">No Products Found</h2>
            <p className="text-gray-600 mb-4">
              We couldn't find any products in the "{category}" category.
            </p>
            <Link href="/" className="text-primary hover:underline">
              View All Products
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

// Separate component for category sections to enable lazy loading
function CategorySection({
  category,
  index,
}: {
  category: string;
  index: number;
}) {
  const { data: categoryData, isLoading } = useCategoryProducts(category, 6);

  const products = categoryData?.products || [];

  if (products.length === 0) return null;

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="bg-white p-4 rounded shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium">Top {category}</h2>
          <Link
            href={`/category/${category.toLowerCase()}`}
            className="text-primary hover:underline"
          >
            View All
          </Link>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <Skeleton className="h-32 w-28 mb-2" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {products.map((product) =>
              category === "Fashion" ? (
                <FashionProductCardFixed
                  key={product.id}
                  product={product}
                  className="h-full"
                />
              ) : (
                <ProductCard key={product.id} product={product} />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
