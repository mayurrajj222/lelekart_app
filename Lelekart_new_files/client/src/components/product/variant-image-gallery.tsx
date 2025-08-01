import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Info, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface VariantImageGalleryProps {
  images: string[];
  variantInfo?: {
    color?: string;
    size?: string;
    price?: number;
    mrp?: number;
    stock?: number;
  };
  onClose?: () => void;
}

export function VariantImageGallery({
  images,
  variantInfo,
  onClose
}: VariantImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [validImages, setValidImages] = useState<string[]>([]);
  
  // Default placeholder image
  const defaultImage = "../images/placeholder.svg";
  
  // Helper function to check problematic URLs
  const isProblematicUrl = (url: string) => {
    return !url || 
           url.includes('placeholder.com') ||
           url.includes('via.placeholder') ||
           url === 'null' ||
           url === 'undefined' ||
           url === '';
  };
  
  // Handle image loading error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null; // Prevent infinite loop
    target.src = defaultImage;
  };
  
  // Filter images once on mount
  useEffect(() => {
    // Filter out problematic images
    const filtered = images.filter(img => !isProblematicUrl(img));
    // If no valid images, use placeholder
    const final = filtered.length > 0 ? filtered : [defaultImage];
    setValidImages(final);
  }, [images]);
  
  // Handle navigate to next image
  const nextImage = () => {
    setActiveIndex((prev) => 
      prev === validImages.length - 1 ? 0 : prev + 1
    );
  };
  
  // Handle navigate to previous image
  const prevImage = () => {
    setActiveIndex((prev) => 
      prev === 0 ? validImages.length - 1 : prev - 1
    );
  };
  
  // Handle navigate via thumbnail click
  const goToImage = (index: number) => {
    setActiveIndex(index);
  };
  
  return (
    <div className="variant-image-gallery">
      {/* Main Image Section */}
      <div className="relative mb-4">
        <div className="w-full aspect-square bg-white rounded-lg overflow-hidden relative">
          <img 
            src={validImages[activeIndex]} 
            alt={`Variant image ${activeIndex + 1}`}
            className="w-full h-full object-contain"
            onError={handleImageError}
          />
        </div>
        
        {/* Navigation Arrows */}
        {validImages.length > 1 && (
          <>
            <Button 
              variant="outline" 
              size="icon" 
              className="absolute left-2 top-1/2 transform -translate-y-1/2 rounded-full opacity-80 hover:opacity-100"
              onClick={prevImage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full opacity-80 hover:opacity-100"
              onClick={nextImage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
        
        {/* Image counter */}
        {validImages.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-md">
            {activeIndex + 1} / {validImages.length}
          </div>
        )}
        
        {/* Close button */}
        {onClose && (
          <Button 
            variant="outline" 
            size="icon" 
            className="absolute top-2 right-2 rounded-full bg-white bg-opacity-70 hover:bg-opacity-100"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        
        {/* Variant info badge */}
        {variantInfo && (variantInfo.color || variantInfo.size) && (
          <div className="absolute top-2 left-2 bg-white bg-opacity-90 px-2 py-1 rounded-md shadow-sm text-xs">
            {variantInfo.color && (
              <Badge variant="outline" className="mr-1">
                {variantInfo.color}
              </Badge>
            )}
            {variantInfo.size && (
              <Badge variant="outline">
                Size: {variantInfo.size}
              </Badge>
            )}
          </div>
        )}
      </div>
      
      {/* Thumbnails */}
      {validImages.length > 1 && (
        <ScrollArea className="w-full pb-2">
          <div className="flex space-x-2">
            {validImages.map((image, idx) => (
              <button
                key={idx}
                className={cn(
                  "w-16 h-16 border-2 rounded overflow-hidden flex-shrink-0 transition-all",
                  activeIndex === idx 
                    ? "border-primary ring-2 ring-primary ring-opacity-30" 
                    : "border-gray-200 hover:border-gray-300"
                )}
                onClick={() => goToImage(idx)}
              >
                <img 
                  src={image} 
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                />
              </button>
            ))}
          </div>
        </ScrollArea>
      )}
      
      {/* Stock and price information */}
      {variantInfo && (
        <Card className="mt-3">
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              {/* Price info */}
              {typeof variantInfo.price === 'number' && (
                <div className="flex flex-col">
                  <span className="text-lg font-bold">₹{variantInfo.price.toLocaleString()}</span>
                  {typeof variantInfo.mrp === 'number' && variantInfo.mrp > variantInfo.price && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 line-through">₹{variantInfo.mrp.toLocaleString()}</span>
                      <span className="text-xs text-green-600 font-medium">
                        {Math.round((1 - variantInfo.price / variantInfo.mrp) * 100)}% off
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Stock info */}
              {typeof variantInfo.stock === 'number' && (
                <div className={cn(
                  "text-sm font-medium px-2 py-1 rounded",
                  variantInfo.stock > 0 
                    ? variantInfo.stock <= 5 
                      ? "bg-amber-100 text-amber-800" 
                      : "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                )}>
                  {variantInfo.stock > 0 
                    ? variantInfo.stock <= 5 
                      ? `Only ${variantInfo.stock} left` 
                      : "In Stock"
                    : "Out of Stock"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}