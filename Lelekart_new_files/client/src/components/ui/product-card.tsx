import { Product, User } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { CartContext } from "@/context/cart-context"; // Import context directly
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext, memo } from "react";
import { apiRequest } from "@/lib/queryClient";
import { WishlistButton } from "./wishlist-button";
import { ProductImage } from "./product-image";
import { fbq } from "@/lib/metaPixel";
import { useCart } from "@/context/cart-context";

// Define an extended Product interface to include image_url and GST details
interface ExtendedProduct extends Omit<Product, "imageUrl"> {
  image?: string;
  image_url?: string;
  imageUrl?: string | null;
  hasVariants?: boolean;
  variants?: any[];
  gstDetails?: {
    gstRate: number;
    basePrice: number;
    gstAmount: number;
    priceWithGst: number;
  };
}

interface ProductCardProps {
  product: ExtendedProduct;
  featured?: boolean;
  priority?: boolean; // For above-the-fold images
  showAddToCart?: boolean; // New prop to control Add to Cart button
  variant?: 'default' | 'plain'; // Add variant prop
  showWishlist?: boolean;
  cardBg?: string;
}

export const ProductCard = memo(function ProductCard({
  product,
  featured = false,
  priority = false,
  showAddToCart = true, // Default to true
  variant = 'default', // Default to default
  showWishlist = true,
  cardBg,
}: ProductCardProps) {
  const cartContext = useContext(CartContext); // Use context directly with optional chaining
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  // Use the useCart hook for cart context
  const { cartItems, addToCart } = useCart();

  // Get user data to check if logged in
  const { data: user } = useQuery<User | null>({
    queryKey: ["/api/user"],
    retry: false,
    staleTime: 60000,
  });

  // Format price in Indian Rupees
  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString("en-IN")}`;
  };

  // Strip HTML tags from string
  const stripHtmlTags = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to add items to cart",
        variant: "default",
      });
      setLocation("/auth");
      return;
    }
    if (user.role === "admin" || user.role === "seller") {
      toast({
        title: "Action Not Allowed",
        description:
          "Only buyers can add items to cart. Please switch to a buyer account.",
        variant: "destructive",
      });
      return;
    }
    try {
      if (cartContext) {
        cartContext.addToCart(product as Product);
      }
      // Show toast is handled in context
    } catch (error) {
      toast({
        title: "Failed to add to cart",
        description: "There was an error adding the product to your cart",
        variant: "destructive",
      });
    }
  };

  // Determine if this should be a priority image (featured products or first few products)
  const shouldPrioritize = priority || featured;

  // Calculate discount percentage only for featured deals with real discounts
  const hasDiscount = product.mrp && product.mrp > product.price;
  const discountPercent =
    hasDiscount && product.mrp
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  // Check if product is already in cart
  const isInCart = cartItems.some((item) => item.product.id === product.id);

  const handleGoToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLocation("/cart");
  };

  // Use the same dimensions and styling for all product cards regardless of featured status
  return (
    <div className="relative">
      {/* Discount badge - ONLY show for featured deals */}
      {hasDiscount && discountPercent > 0 && (
        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded z-10 shadow">
          {discountPercent}% OFF
        </div>
      )}
      {/* Add Wishlist button on top right of card */}
      {showWishlist !== false && (
        <WishlistButton productId={product.id} variant="card" />
      )}

      {/* Use normalized path that starts with a slash to prevent double slashes */}
      <Link href={`/product/${product.id}`} className="block">
        <Card
          className={
            variant === 'plain'
              ? `product-card h-full flex flex-col items-center p-0 border-none shadow-none rounded-none bg-transparent`
              : 'product-card h-full flex flex-col items-center p-3 transition-transform duration-200 hover:cursor-pointer hover:shadow-md hover:-translate-y-1 bg-[#F8F5E4] border border-[#e0c9a6] rounded-2xl'
          }
          style={{}}
          onClick={() => {
            // Manually add to recently viewed products as backup
            try {
              const key = "recently_viewed_products";
              const existing = localStorage.getItem(key);
              let ids: number[] = [];
              if (existing) {
                try {
                  ids = JSON.parse(existing);
                } catch {
                  ids = [];
                }
              }
              // Remove if already present
              ids = ids.filter((id: number) => id !== product.id);
              // Add to start
              ids.unshift(product.id);
              // Keep only latest 20
              if (ids.length > 20) ids = ids.slice(0, 20);
              localStorage.setItem(key, JSON.stringify(ids));
              console.log(
                "[ProductCard] Added product to recently viewed:",
                product.id,
                ids
              );
            } catch (e) {
              console.error(
                "[ProductCard] Error adding to recently viewed:",
                e
              );
            }
            // --- Meta Pixel product click tracking ---
            try {
              fbq("track", "ViewContent", {
                content_ids: [product.id],
                content_name: product.name,
                content_type: "product",
                value: product.price,
                currency: "INR",
              });
              console.log(
                "[MetaPixel] ViewContent fired for product",
                product.id,
                product.name
              );
            } catch (e) {
              console.error("[MetaPixel] Error firing ViewContent pixel", e);
            }
          }}
        >
          <CardContent className="p-0 w-full flex flex-col items-center h-full bg-transparent">
            <div
              className={
                variant === 'plain'
                  ? `w-full flex-shrink-0 h-40 flex items-center justify-center mb-3 overflow-hidden bg-transparent`
                  : 'w-full flex-shrink-0 h-40 flex items-center justify-center mb-3 bg-[#F8F5E4] rounded-2xl overflow-hidden'
              }
              style={{}}
            >
              <ProductImage
                product={product}
                className={variant === 'plain' ? '' : 'rounded-xl'}
                priority={shouldPrioritize}
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
              />
            </div>

            <div className="flex flex-col flex-grow w-full">
              <h3 className="font-medium text-center text-sm line-clamp-2 h-10">
                {product.name}
              </h3>
              <div className="text-green-600 font-medium mt-1 text-center flex items-center justify-center gap-2">
                {product.gstDetails
                  ? formatPrice(product.gstDetails.priceWithGst)
                  : formatPrice(product.price)}
                {/* Show MRP strikethrough for all products with real discounts */}
                {hasDiscount && product.mrp && (
                  <span className="text-gray-400 text-xs line-through ml-2">
                    {formatPrice(product.mrp)}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1 text-center line-clamp-1">
                {/* Removed description div for compact card */}
              </div>
            </div>
            {showAddToCart && (
              <Button
                className="mt-2 w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-bold text-base px-4 py-2 rounded-full shadow-md hover:from-orange-400 hover:to-yellow-400 border-none flex items-center justify-center gap-2"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            )}
          </CardContent>
        </Card>
      </Link>
    </div>
  );
});
