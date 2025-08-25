import { ProductCard } from "@/components/ui/product-card";
import { Product } from "@shared/schema";
import { Link } from "wouter";

interface FeaturedDealsSectionProps {
  featuredProducts: Product[];
}

export default function FeaturedDealsSection({
  featuredProducts,
}: FeaturedDealsSectionProps) {
  // Debug logging
  console.log("FeaturedDealsSection received products:", {
    totalProducts: featuredProducts.length,
    productsWithDiscount: featuredProducts.filter(
      (p) => p.mrp && p.mrp > p.price
    ).length,
    categories: [...new Set(featuredProducts.map((p) => p.category))],
    sampleProducts: featuredProducts.slice(0, 3).map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      mrp: p.mrp,
      hasDiscount: p.mrp && p.mrp > p.price,
    })),
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Featured Deals */}
        <div className="bg-[#F8F5E4] rounded-2xl p-4 border border-[#e0c9a6] shadow-md flex flex-col justify-between">
          <h2 className="text-xl font-semibold mb-4 text-black">
            Featured Deals
          </h2>
          <div className="grid grid-cols-2 gap-2 justify-center">
            {featuredProducts.slice(0, 4).map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                featured={true}
                priority={index < 2}
                variant="plain"
                showAddToCart={false}
                showWishlist={false}
              />
            ))}
          </div>
          <div className="flex justify-end mt-2">
            <Link href="/products" className="text-primary hover:underline">
              View All
            </Link>
          </div>
        </div>

        {/* Best Seller */}
        <div className="bg-[#F8F5E4] rounded-2xl p-4 border border-[#e0c9a6] shadow-md flex flex-col justify-between">
          <h2 className="text-xl font-semibold mb-4 text-black">Best Seller</h2>
          <div className="grid grid-cols-2 gap-2 justify-center">
            {getMaxDiscountProductsInRange(featuredProducts, 40, 60, 2)
              .concat(
                getMaxDiscountProductsInRange(featuredProducts, 20, 40, 1)
              )
              .concat(getMaxDiscountProductsInRange(featuredProducts, 0, 20, 1))
              .slice(0, 4)
              .map((product) => (
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

        {/* Trending */}
        <div className="bg-[#F8F5E4] rounded-2xl p-4 border border-[#e0c9a6] shadow-md flex flex-col justify-between">
          <h2 className="text-xl font-semibold mb-4 text-black">Trending</h2>
          <div className="grid grid-cols-2 gap-2 justify-center">
            {(() => {
              const trendingProducts = getLowestDiscountFashion(
                featuredProducts,
                4
              );
              // If no fashion products, fall back to any products with discounts
              const fallbackProducts =
                trendingProducts.length === 0
                  ? featuredProducts
                      .filter((p) => p.mrp && p.mrp > p.price)
                      .slice(0, 4)
                  : trendingProducts;

              return fallbackProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  showAddToCart={false}
                  variant="plain"
                  showWishlist={false}
                />
              ));
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getMaxDiscountProductsInRange(
  products: Product[],
  min: number,
  max: number,
  count: number
) {
  return products
    .filter((p) => {
      if (!p.mrp || p.mrp <= p.price) return false;
      const discount = Math.round(((p.mrp - p.price) / p.mrp) * 100);
      return discount >= min && discount <= max;
    })
    .sort((a, b) => {
      const aDisc = Math.round(((a.mrp! - a.price) / a.mrp!) * 100);
      const bDisc = Math.round(((b.mrp! - b.price) / b.mrp!) * 100);
      return bDisc - aDisc;
    })
    .slice(0, count);
}

function getLowestDiscountFashion(products: Product[], count: number) {
  // Debug: Log available categories
  const availableCategories = [...new Set(products.map((p) => p.category))];
  console.log("Available categories:", availableCategories);

  // More flexible filtering - check for fashion-related categories
  const fashionProducts = products.filter((p) => {
    const category = p.category?.toLowerCase();
    return (
      category === "fashion" ||
      category === "clothing" ||
      category === "apparel" ||
      category?.includes("fashion") ||
      category?.includes("clothing")
    );
  });

  console.log(
    `Found ${fashionProducts.length} fashion products out of ${products.length} total products`
  );

  return fashionProducts
    .sort((a, b) => {
      const aDisc =
        a.mrp && a.mrp > a.price ? ((a.mrp - a.price) / a.mrp) * 100 : 0;
      const bDisc =
        b.mrp && b.mrp > b.price ? ((b.mrp - b.price) / b.mrp) * 100 : 0;
      return aDisc - bDisc;
    })
    .slice(0, count);
}
