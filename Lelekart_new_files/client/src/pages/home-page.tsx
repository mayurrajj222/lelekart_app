import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { ProductCard } from "@/components/ui/product-card";
import { Product } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { HeroSection } from "@/components/ui/hero-section";
import { Loader2 } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { FashionProductCardFixed } from "@/components/ui/fashion-product-card-fixed";
import { LazySection } from "@/components/ui/lazy-section";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import {
  useInfiniteProducts,
  useCategoryProducts,
} from "@/hooks/use-infinite-products";
import { usePerformanceMonitor } from "@/hooks/use-performance-monitor";
import {
  preloadProductImages,
  preloadCategoryImages,
} from "@/lib/image-preloader";
import { PerformanceMonitor } from "@/components/ui/performance-monitor";
import { useProductLoader } from "@/lib/product-loader";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { ArrowUp } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Package } from "lucide-react";

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
  "Health and Wellness",
] as const;

// Category image mapping (add Health and Wellness)
const categoryImageMap: Record<string, string> = {
  Electronics: "/images/categories/electronics.svg",
  Fashion: "/images/categories/fashion.svg",
  Home: "/images/categories/home.svg",
  Appliances: "/images/categories/appliances.svg",
  Mobiles: "/images/categories/mobiles.svg",
  Beauty: "/images/categories/beauty.svg",
  Toys: "/images/categories/toys.svg",
  Grocery: "/images/categories/grocery.svg",
  "Health and Wellness":
    "https://chunumunu.s3.ap-northeast-1.amazonaws.com/2025/02/Picsart_24-01-07_20-56-35-962-scaled.jpg",
};

interface ProductData {
  products: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
  };
}

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

export default function HomePage() {
  const [location] = useLocation();
  const [category, setCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 36;

  // Recently Viewed Products state
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [loadingRecentlyViewed, setLoadingRecentlyViewed] = useState(true);
  useEffect(() => {
    async function fetchRecentlyViewed() {
      setLoadingRecentlyViewed(true);
      try {
        const ids = JSON.parse(localStorage.getItem('recently_viewed_products') || '[]').slice(0, 5);
        if (!Array.isArray(ids) || ids.length === 0) {
          setRecentlyViewed([]);
          setLoadingRecentlyViewed(false);
          return;
        }
        // Fetch all products in parallel for speed
        const productPromises = ids.map(id => 
          fetch(`/api/products/${id}`).then(res => res.ok ? res.json() : null)
        );
        const allProducts = (await Promise.all(productPromises)).filter(Boolean);
        // Keep the order as in localStorage
        const ordered = ids
          .map((id) => allProducts.find(p => p.id === id))
          .filter((p) => p !== undefined && p !== null);
        setRecentlyViewed(ordered);
      } catch (e) {
        setRecentlyViewed([]);
      } finally {
        setLoadingRecentlyViewed(false);
      }
    }
    fetchRecentlyViewed();
  }, []);

  // Browser History state (last 5 search queries)
  const [browserHistory, setBrowserHistory] = useState<string[]>([]);
  useEffect(() => {
    try {
      const stored = localStorage.getItem('lelekart_recent_searches');
      if (stored) {
        setBrowserHistory(JSON.parse(stored).slice(0, 5));
      }
    } catch {
      setBrowserHistory([]);
    }
  }, []);

  // Performance monitoring
  const { startTimer, endTimer, recordProductsLoaded } = usePerformanceMonitor({
    enableLogging: process.env.NODE_ENV === "development",
  });

  // Product loader for faster loading
  const { preloadProductPages } = useProductLoader();

  // Memoize URL params parsing
  const searchParams = useMemo(() => {
    return new URLSearchParams(location.split("?")[1]);
  }, [location]);

  useEffect(() => {
    const categoryParam = searchParams.get("category");
    setCategory(categoryParam);
  }, [searchParams]);

  useEffect(() => {
    const pageParam = searchParams.get("page");
    if (pageParam) {
      setCurrentPage(parseInt(pageParam));
    } else {
      setCurrentPage(1);
    }
  }, [searchParams]);

  // Optimized hero products fetching with longer cache
  const { data: heroProducts, isLoading: isLoadingHero } = useQuery<
    SliderImage[]
  >({
    queryKey: ["/api/featured-hero-products"],
    queryFn: async () => {
      startTimer("api:hero-products");
      try {
        const res = await fetch(
          "/api/featured-hero-products?approved=true&status=approved"
        );
        if (!res.ok) throw new Error("Failed to fetch hero products");
        const data = await res.json();
        endTimer("api:hero-products", { count: data.length });
        return data;
      } catch (error) {
        endTimer("api:hero-products", { error });
        throw error;
      }
    },
    staleTime: 15 * 60 * 1000, // 15 minutes cache
    refetchOnWindowFocus: false,
  });

  // Optimized deal of the day fetching
  const { data: dealOfTheDay, isLoading: isLoadingDeal } =
    useQuery<DealOfTheDay>({
      queryKey: ["/api/deal-of-the-day"],
      queryFn: async () => {
        startTimer("api:deal-of-the-day");
        try {
          const res = await fetch("/api/deal-of-the-day");
          if (!res.ok) throw new Error("Failed to fetch deal of the day");
          const data = await res.json();
          endTimer("api:deal-of-the-day", { success: true });
          return data;
        } catch (error) {
          endTimer("api:deal-of-the-day", { error });
          throw error;
        }
      },
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      refetchOnWindowFocus: false,
    });

  // Use infinite scroll for main products
  const {
    products: infiniteProducts,
    pagination: infinitePagination,
    hasMore,
    isLoading: isLoadingInfinite,
    isFetchingNextPage,
    loadMore,
  } = useInfiniteProducts({
    category: category || undefined,
    pageSize: 36,
    enabled: !category, // Only use infinite scroll for main page
  });

  // Use traditional pagination for category-specific products
  const { data: categoryData, isLoading: isLoadingCategory } =
    useCategoryProducts(category || "", itemsPerPage);

  // Extract products and pagination from the appropriate data source
  const { products, pagination } = useMemo(() => {
    if (category) {
      return {
        products: categoryData?.products || [],
        pagination: categoryData?.pagination || {
          currentPage: 1,
          totalPages: 1,
          total: 0,
        },
      };
    } else {
      return {
        products: infiniteProducts,
        pagination: infinitePagination,
      };
    }
  }, [category, categoryData, infiniteProducts, infinitePagination]);

  const isLoading = category ? isLoadingCategory : isLoadingInfinite;

  // Get featured products (first 5 products for priority loading)
  const featuredProducts = useMemo(() => {
    // Only show products with a real deal/discount (mrp > price)
    return products.filter((p) => p.mrp && p.mrp > p.price).slice(0, 5);
  }, [products]);

  // Preload critical images when products change
  useEffect(() => {
    if (featuredProducts.length > 0) {
      preloadProductImages(featuredProducts, 5);
    }
    if (products.length > 0) {
      preloadProductImages(products, products.length);
    }
  }, [featuredProducts, products]);

  // Preload category images
  useEffect(() => {
    if (category) {
      preloadCategoryImages(category);
    }
  }, [category]);

  // Preload next pages of products for faster infinite scroll
  useEffect(() => {
    if (
      !category &&
      infinitePagination &&
      infinitePagination.currentPage < infinitePagination.totalPages
    ) {
      // Preload next 2 pages in background
      preloadProductPages(
        "/api/products",
        infinitePagination.currentPage,
        infinitePagination.totalPages,
        {
          preloadPages: 2,
          concurrency: 3,
        }
      );
    }
  }, [category, infinitePagination, preloadProductPages]);

  // Record products loaded for performance monitoring
  useEffect(() => {
    if (products.length > 0) {
      recordProductsLoaded(products.length);
    }
  }, [products, recordProductsLoaded]);

  const getProductsByCategory = useMemo(() => {
    return (categoryName: string) => {
      return products
        .filter(
          (p: Product) =>
            p.category?.toLowerCase() === categoryName.toLowerCase()
        )
        .slice(0, 6);
    };
  }, [products]);

  const categorizedProducts = useMemo(() => {
    return allCategories
      .map((cat) => ({
        name: cat,
        title: `Top ${cat}`,
        products: getProductsByCategory(cat),
      }))
      .filter((catGroup) => catGroup.products.length > 0);
  }, [getProductsByCategory]);

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

  // Show scroll-to-top button only when scrolled down
  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // --- Helper functions for new homepage sections ---
  function getDiscountedProducts(products: Product[], percent: number, count: number) {
    return products
      .filter(p => p.mrp && p.mrp > p.price && Math.round(((p.mrp - p.price) / p.mrp) * 100) >= percent)
      .sort((a, b) => {
        // Sort by discount percentage descending
        const aDisc = Math.round(((a.mrp! - a.price) / a.mrp!) * 100);
        const bDisc = Math.round(((b.mrp! - b.price) / b.mrp!) * 100);
        return bDisc - aDisc;
      })
      .slice(0, count);
  }
  function getLowestDiscountFashion(products: Product[], count: number) {
    return products
      .filter(p => p.category?.toLowerCase() === 'fashion')
      .sort((a, b) => {
        const aDisc = a.mrp && a.mrp > a.price ? ((a.mrp - a.price) / a.mrp) * 100 : 0;
        const bDisc = b.mrp && b.mrp > b.price ? ((b.mrp - b.price) / b.mrp) * 100 : 0;
        return aDisc - bDisc;
      })
      .slice(0, count);
  }
  function getUnderPrice(products: Product[], price: number, count: number) {
    return products.filter(p => p.price <= price).slice(0, count);
  }
  // --- Helper for max discount product in a range ---
  function getMaxDiscountProductsInRange(products: Product[], min: number, max: number, count: number) {
    return products
      .filter(p => p.mrp && p.mrp > p.price) // has discount
      .map(p => ({
        ...p,
        discount: Math.round(((p.mrp! - p.price) / p.mrp!) * 100)
      }))
      .filter(p => p.discount > min && p.discount <= max)
      .sort((a, b) => b.discount - a.discount)
      .slice(0, count);
  }
  function getDiscountPercentProducts(products: Product[], percent: number, count: number) {
    if (percent === 20) {
      // Up to 20% off
      return products
        .filter(p => p.mrp && p.mrp > p.price && Math.round(((p.mrp - p.price) / p.mrp) * 100) <= 20)
        .slice(0, count);
    } else if (percent === 40) {
      // More than 20% and up to 40%
      return products
        .filter(p => p.mrp && p.mrp > p.price) // has discount
        .map(p => ({
          ...p,
          discount: Math.round(((p.mrp! - p.price) / p.mrp!) * 100)
        }))
        .filter(p => p.discount > 20 && p.discount <= 40)
        .slice(0, count);
    } else if (percent === 60) {
      // More than 40% and up to 60%
      return products
        .filter(p => p.mrp && p.mrp > p.price) // has discount
        .map(p => ({
          ...p,
          discount: Math.round(((p.mrp! - p.price) / p.mrp!) * 100)
        }))
        .filter(p => p.discount > 40 && p.discount <= 60)
        .slice(0, count);
    }
    return [];
  }

  const [recentSearchProducts, setRecentSearchProducts] = useState<any[]>([]);
  const [loadingRecentSearchProducts, setLoadingRecentSearchProducts] = useState(false);

  useEffect(() => {
    async function fetchRecentSearchProducts() {
      if (!browserHistory || browserHistory.length === 0) {
        setRecentSearchProducts([]);
        return;
      }
      setLoadingRecentSearchProducts(true);
      try {
        // Fetch top product for each search term
        const productPromises = browserHistory.map(async (term) => {
          const res = await fetch(`/api/lelekart-search?q=${encodeURIComponent(term)}&limit=1`);
          if (!res.ok) return null;
          const data = await res.json();
          // Return the first product from the search results
          return data && data.length > 0 ? data[0] : null;
        });
        const products = (await Promise.all(productPromises)).filter(Boolean);
        setRecentSearchProducts(products);
      } catch (e) {
        setRecentSearchProducts([]);
      } finally {
        setLoadingRecentSearchProducts(false);
      }
    }
    fetchRecentSearchProducts();
  }, [browserHistory]);

  // Listen for storage changes to refresh recent searches
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const stored = localStorage.getItem('lelekart_recent_searches');
        if (stored) {
          const newHistory = JSON.parse(stored).slice(0, 5);
          setBrowserHistory(newHistory);
        }
      } catch {
        setBrowserHistory([]);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className="min-h-screen bg-[#EADDCB] font-serif">
      <Helmet>
        <title>
          LeleKart - India’s Leading Online Shopping Site for Electronics,
          Fashion, Home & More
        </title>
        <meta
          name="description"
          content="Shop online for electronics, fashion, home appliances, mobiles, beauty, toys, grocery and more at LeleKart. Best deals, fast delivery, and secure payments. Shop for affordable products at LeleKart. Buy online organic and herbal products. Shop now and save more."
        />
        <meta
          name="keywords"
          content="online shopping, electronics, fashion, mobiles, home appliances, beauty, toys, grocery, India, LeleKart, affordable products, organic products, herbal products, shop now, save more"
        />
      </Helmet>
      {/* Hero Section - Load immediately */}
      <div className="max-w-7xl mx-auto">
        {isLoadingHero ? (
          <div className="h-64 bg-gradient-to-r from-[#F8F5E4] to-[#EADDCB] flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-[#B6C3A5] animate-spin" />
          </div>
        ) : heroProducts && heroProducts.length > 0 ? (
          <HeroSection sliderImages={heroProducts} dealOfTheDay={dealOfTheDay} />
        ) : (
          <div className="h-64 bg-gradient-to-r from-[#F8F5E4] to-[#EADDCB] flex flex-col items-center justify-center text-[#B6C3A5]">
            <div className="mb-4">No banners found in Banner Management</div>
            <p className="text-sm opacity-80">
              Add banners in Admin Panel → Banner Management
            </p>
          </div>
        )}
      </div>
      {/* --- Featured Deals, Best Seller, Trending (3 columns in one row) --- */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Featured Deals */}
          <div className="bg-[#F8F5E4] rounded-2xl p-4 border border-[#e0c9a6] shadow-md flex flex-col justify-between">
            <h2 className="text-xl font-semibold mb-4 text-black">Featured Deals</h2>
            <div className="grid grid-cols-2 gap-2 justify-center">
              {featuredProducts.slice(0, 4).map((product, index) => (
                <ProductCard key={product.id} product={product} featured={true} priority={index < 2} variant="plain" showAddToCart={false} showWishlist={false} />
              ))}
            </div>
            <div className="flex justify-end mt-2">
              <Link href="/products" className="text-primary hover:underline">View All</Link>
            </div>
          </div>
          {/* Best Seller */}
          <div className="bg-[#F8F5E4] rounded-2xl p-4 border border-[#e0c9a6] shadow-md flex flex-col justify-between">
            <h2 className="text-xl font-semibold mb-4 text-black">Best Seller</h2>
            <div className="grid grid-cols-2 gap-2 justify-center">
              {[
                ...getMaxDiscountProductsInRange(products, 40, 60, 2),
                ...getMaxDiscountProductsInRange(products, 20, 40, 1),
                ...getMaxDiscountProductsInRange(products, 0, 20, 1),
              ].slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} showAddToCart={false} variant="plain" showWishlist={false} />
              ))}
            </div>
          </div>
          {/* Trending */}
          <div className="bg-[#F8F5E4] rounded-2xl p-4 border border-[#e0c9a6] shadow-md flex flex-col justify-between">
            <h2 className="text-xl font-semibold mb-4 text-black">Trending</h2>
            <div className="grid grid-cols-2 gap-2 justify-center">
              {getLowestDiscountFashion(products, 4).map((product) => (
                <ProductCard key={product.id} product={product} showAddToCart={false} variant="plain" showWishlist={false} />
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* --- Under Price Sections (with visible box) --- */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[199, 399, 599].map((price) => (
            <div key={price} className="bg-[#F8F5E4] rounded-2xl p-4 border border-[#e0c9a6] shadow-md flex flex-col justify-between">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium">Under ₹{price}</h2>
                <Link href={`/under/${price}`} className="text-primary hover:underline">View All</Link>
              </div>
              <div className="grid grid-cols-2 gap-2 justify-center">
                {getUnderPrice(products, price, 4).map((product) => (
                  <ProductCard key={product.id} product={product} showAddToCart={false} variant="plain" showWishlist={false} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* --- Discount % Off Sections (third row, with visible box) --- */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[20, 40, 60].map((percent) => (
            <div key={percent} className="bg-[#F8F5E4] rounded-2xl p-4 border border-[#e0c9a6] shadow-md flex flex-col justify-between">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium">Up to {percent}% Off</h2>
                <Link href={`/search?q=upto+${percent}+percent+off`} className="text-primary hover:underline">View All</Link>
              </div>
              <div className="grid grid-cols-2 gap-2 justify-center">
                {getDiscountPercentProducts(products, percent, 4).map((product) => (
                  <ProductCard key={product.id} product={product} featured={true} showAddToCart={false} variant="plain" showWishlist={false} cardBg="#EADDCB" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* --- Recently Viewed Products --- */}
      <div className="container mx-auto px-4 pb-6">
        <div className="bg-[#EADDCB] p-4 rounded shadow-none">
          <h2 className="text-lg font-semibold mb-4 text-black">Recently Viewed Products</h2>
          {loadingRecentlyViewed ? (
            <div className="flex items-center justify-center py-8 text-center flex-col">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
              <h3 className="text-sm font-medium">Loading recently viewed products...</h3>
            </div>
          ) : recentlyViewed.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-2">
              {recentlyViewed.map((product: any) => (
                <ProductCard key={product.id} product={product} featured={false} showAddToCart={true} />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-center flex-col">
              <div className="bg-gray-100 rounded-full p-3 mb-3">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium">No recently viewed products</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4">Products you view will appear here</p>
            </div>
          )}
        </div>
      </div>
      {/* --- Top Category Sections (with visible box) --- */}
      {!category && (
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sort categories by product count and display as per requirements */}
            {(() => {
              // Get product counts for each category
              const categoryCounts = allCategories.map((categoryName) => {
                const count = products.filter(
                  (p: Product) =>
                    p.category?.toLowerCase() === categoryName.toLowerCase()
                ).length;
                return { name: categoryName, count };
              });
              // Filter out categories with 0 products
              const nonEmpty = categoryCounts.filter((c) => c.count > 0);
              // Sort: 4+ first, then 3, then 2 (at end), then 1 (at end)
              const sorted = [
                ...nonEmpty.filter((c) => c.count >= 4),
                ...nonEmpty.filter((c) => c.count === 3),
                ...nonEmpty.filter((c) => c.count === 2),
                ...nonEmpty.filter((c) => c.count === 1),
              ];
              return sorted.map((catGroup, idx) => (
                <div key={catGroup.name} className="bg-transparent rounded-2xl p-0 flex flex-col justify-between">
                  <div className="bg-[#F8F5E4] rounded-2xl p-4 border border-[#e0c9a6] shadow-md">
                    <CategorySection
                      category={catGroup.name}
                      index={idx}
                      imageUrl={categoryImageMap[catGroup.name]}
                    />
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}
      {/* --- All Products Section --- */}
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

                {/* Browser History Section - below View More button, only if there are any */}
                {(
                  <div className="bg-[#F8F5E4] rounded-2xl p-4 border border-[#e0c9a6] shadow-md mt-6 mb-2">
                    <h2 className="text-lg font-semibold mb-4 text-black">Your Recent Searches</h2>
                    {loadingRecentSearchProducts ? (
                      <div className="flex items-center justify-center py-8 text-center flex-col">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
                        <h3 className="text-sm font-medium">Loading recent searches...</h3>
                      </div>
                    ) : recentSearchProducts.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-2">
                        {recentSearchProducts.map((product, idx) => (
                          <ProductCard key={product.id || idx} product={product} featured={false} showAddToCart={true} />
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-8 text-center flex-col">
                        <div className="bg-gray-100 rounded-full p-3 mb-3">
                          <svg className="h-6 w-6 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" /></svg>
                        </div>
                        <h3 className="text-sm font-medium">No products found for your recent searches</h3>
                        <p className="text-xs text-muted-foreground mt-1 mb-4">Your recent search products will appear here</p>
                      </div>
                    )}
                  </div>
                )}

                {!hasMore && infiniteProducts.length > 0 && (
                  <div className="text-sm text-gray-500 text-center mt-4">
                    Showing {infiniteProducts.length} of{" "}
                    {infinitePagination.total} products
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
        </LazySection>
      )}
      {/* Category-specific products with traditional pagination */}
      {category && products.length > 0 && (
        <div className="container mx-auto px-4 py-6">
          <h2 className="text-2xl font-medium mb-4 capitalize">
            {category} Products
          </h2>
          <div className="bg-[#EADDCB] p-4 rounded shadow-none">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priority={index < 6} // Priority loading for first 6 products
                />
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={(page) => {
                    const params = new URLSearchParams(
                      location.split("?")[1] || ""
                    );
                    params.set("page", page.toString());
                    const newUrl = `/?category=${category}&${params.toString()}`;
                    window.location.href = newUrl;
                    window.scrollTo(0, 0);
                  }}
                />
              </div>
            )}

            <div className="text-sm text-gray-500 text-center mt-2">
              Showing {(pagination.currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(
                pagination.currentPage * itemsPerPage,
                pagination.total
              )}{" "}
              of {pagination.total} products
            </div>
          </div>
        </div>
      )}
      {/* No products found message */}
      {category && products.length === 0 && !isLoading && (
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
      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-8 z-50 bg-primary text-white rounded-full shadow-2xl p-2 hover:bg-primary/90 transition-colors flex items-center justify-center border-4 border-white"
          style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)" }}
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}

// Separate component for category sections to enable lazy loading
function CategorySection({
  category,
  index,
  imageUrl,
}: {
  category: string;
  index: number;
  imageUrl?: string;
}) {
  const categoryQuery = category.toLowerCase() === 'fashion' ? 'Fashion' : category;
  const { data: categoryData, isLoading } = useCategoryProducts(categoryQuery, 4);
  const products = (categoryData?.products || []).slice(0, 4);
  // Preload the category image if provided
  useEffect(() => {
    if (imageUrl) {
      const img = new window.Image();
      img.src = imageUrl;
    }
  }, [imageUrl]);
  if (products.length === 0) return null;
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          {imageUrl && (
            <img src={imageUrl} alt={category} className="h-8 w-8 rounded-full object-cover" />
          )}
          <h2 className="text-xl font-medium">Top {category}</h2>
        </div>
        <Link
          href={`/category/${category.toLowerCase()}`}
          className="text-primary hover:underline"
        >
          View All
        </Link>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-2 justify-center">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <Skeleton className="h-32 w-28 mb-2" />
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 justify-center">
          {products.map((product, productIndex) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={productIndex < 2}
              showAddToCart={false}
              variant="plain"
              showWishlist={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}