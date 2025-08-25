import { Product } from "@shared/schema";
import { Link } from "wouter";
import { ProductCard } from "@/components/ui/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategoryProducts } from "@/hooks/use-infinite-products";
import { useEffect } from "react";

interface CategorySectionsProps {
  products: Product[];
  category: string | null;
}

// Category image mapping
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

export default function CategorySections({ products, category }: CategorySectionsProps) {
  if (category) return null;

  return (
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
            <div
              key={catGroup.name}
              className="bg-transparent rounded-2xl p-0 flex flex-col justify-between"
            >
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
  const categoryQuery =
    category.toLowerCase() === "fashion" ? "Fashion" : category;
  const { data: categoryData, isLoading } = useCategoryProducts(
    categoryQuery,
    4
  );
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
            <img
              src={imageUrl}
              alt={category}
              className="h-8 w-8 rounded-full object-cover"
            />
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
