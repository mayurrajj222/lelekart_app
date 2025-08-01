import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import { FC, useRef, useState } from "react";
import { ProductCard } from "./product-card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";
import { Skeleton } from "./skeleton";
import { cn } from "@/lib/utils";
import { CartProvider } from "@/context/cart-context";

// Add custom styles to hide scrollbar but keep functionality
const scrollbarHideStyles = {
  scrollbarWidth: 'none' as const,
  msOverflowStyle: 'none' as const,
  '&::-webkit-scrollbar': {
    display: 'none',
  },
};

interface ProductRecommendationCarouselProps {
  title: string;
  description?: string;
  endpoint: string;
  userId?: number | null;
  productId?: number;
  limit?: number;
  className?: string;
}

const ProductRecommendationCarousel: FC<ProductRecommendationCarouselProps> = ({
  title,
  description,
  endpoint,
  limit = 16,
  className,
}) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Fetch product recommendations
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: [endpoint, { limit }],
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true, // Refetch whenever component mounts
    refetchOnWindowFocus: true, // Refetch whenever window gains focus
  });
  
  const handleScroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const scrollAmount = Math.floor(container.clientWidth * 0.8); // 80% of visible width
    const newPosition = direction === "left" 
      ? Math.max(0, scrollPosition - scrollAmount)
      : Math.min(
          container.scrollWidth - container.clientWidth,
          scrollPosition + scrollAmount
        );
    
    container.scrollTo({
      left: newPosition,
      behavior: "smooth"
    });
    
    setScrollPosition(newPosition);
  };
  
  // Check if we have room to scroll in a direction
  const canScrollLeft = scrollPosition > 0;
  const canScrollRight = scrollContainerRef.current
    ? scrollPosition < scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth - 10 // small buffer
    : false;

  return (
    <div className={cn("w-full my-8", className)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">{title}</h2>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={canScrollLeft ? "default" : "outline"}
            size="icon"
            onClick={() => handleScroll("left")}
            disabled={!canScrollLeft}
            className={cn(
              "rounded-full transition-all shadow-md border-2",
              canScrollLeft ? "bg-primary text-white border-primary hover:bg-primary/90 scale-110" : "bg-white text-gray-400 border-gray-200"
            )}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          
          <Button
            variant={canScrollRight ? "default" : "outline"}
            size="icon"
            onClick={() => handleScroll("right")}
            disabled={!canScrollRight}
            className={cn(
              "rounded-full transition-all shadow-md border-2 ml-2",
              canScrollRight ? "bg-primary text-white border-primary hover:bg-primary/90 scale-110" : "bg-white text-gray-400 border-gray-200"
            )}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>
      
      <div 
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 pt-2 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onScroll={() => {
          if (scrollContainerRef.current) {
            setScrollPosition(scrollContainerRef.current.scrollLeft);
          }
        }}
      >
        {isLoading && (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex-shrink-0" style={{ width: "245px" }}>
              <Skeleton className="h-64 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4 mt-2" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </div>
          ))
        )}
        
        {!isLoading && products?.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-10">
            <p className="text-muted-foreground">No recommendations available.</p>
          </div>
        )}
        
        {!isLoading && products?.map((product) => (
          <div key={product.id} className="flex-shrink-0" style={{ width: "245px" }}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductRecommendationCarousel;