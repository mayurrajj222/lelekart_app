import { useState, useRef } from "react";
import { RotateCw, ZoomIn, Check, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import Zoom from "react-medium-image-zoom";
import 'react-medium-image-zoom/dist/styles.css';

interface ProductImageSliderProps {
  images: string[];
  name: string;
  selectedVariantImages?: string[];
  selectedVariant?: any;
}

export default function SimpleImageSlider({ 
  images, 
  name, 
  selectedVariantImages = [],
  selectedVariant = null
}: ProductImageSliderProps) {
  // Simple state management - only track active image index and view mode
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'normal' | 'zoom' | '360'>('normal');

  // Container ref for calculating dimensions
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Default fallback image
  const defaultImage = "../images/placeholder.svg";

  // Extract image URLs directly from the input arrays
  const extractImageUrls = (imgArray: string[]): string[] => {
    const urls: string[] = [];
    
    if (!Array.isArray(imgArray)) return urls;
    
    // Try to extract image URLs from each item
    imgArray.forEach(img => {
      if (typeof img === 'string') {
        // Case 1: Image is a JSON string containing array of URLs
        if (img.startsWith('[')) {
          try {
            const parsed = JSON.parse(img);
            if (Array.isArray(parsed)) {
              parsed.forEach(url => {
                if (typeof url === 'string' && url.includes('http')) {
                  urls.push(url);
                }
              });
            }
          } catch {
            // Use as regular URL if JSON parsing fails
            if (img.includes('http')) {
              urls.push(img);
            }
          }
        } 
        // Case 2: Direct URL
        else if (img.includes('http')) {
          urls.push(img);
        }
      }
    });
    
    return urls;
  };
  
  // Handle image loading errors
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null; // Prevent infinite loop
    target.src = defaultImage;
  };
  
  // Get all available image URLs with safety checks
  const extractedProductImages = Array.isArray(images) ? extractImageUrls(images) : [];
  const extractedVariantImages = Array.isArray(selectedVariantImages) ? extractImageUrls(selectedVariantImages) : [];
  
  // Prioritize variant images - if variant is selected and has images, use only those
  // This prevents duplication when both product and variant images are present
  let allImagesUrls: string[] = [];
  
  if (selectedVariant && extractedVariantImages.length > 0) {
    // Use only variant images when a variant is selected and has images
    allImagesUrls = [...extractedVariantImages];
    console.log("Using only variant images:", extractedVariantImages.length, "images");
  } else {
    // Otherwise, use product images
    allImagesUrls = [...extractedProductImages];
    console.log("Using only product images:", extractedProductImages.length, "images");
  }
  
  // De-duplicate images (in case there are duplicates in the source)
  allImagesUrls = [...new Set(allImagesUrls)];
  
  // Ensure we always have at least one image
  if (allImagesUrls.length === 0) {
    allImagesUrls.push(defaultImage);
    console.log("No images found, using default placeholder");
  }
  
  // Handle thumbnail click
  const handleThumbnailClick = (index: number) => {
    setActiveIndex(index);
    setViewMode('normal');
  };

  return (
    <div className="space-y-4 product-image-slider">
      {/* Variant badge */}
      {selectedVariant && (
        <div className="rounded-md bg-green-50 border border-green-200 p-3 mb-3 text-sm">
          <div className="flex items-center">
            <Check size={18} className="text-green-600 mr-2 flex-shrink-0" />
            <div>
              <span className="text-green-700 font-medium">
                {selectedVariant.color} {selectedVariant.size && `/ ${selectedVariant.size}`} variant selected
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* View mode toggle buttons */}
      <div className="flex gap-2 justify-end">
        <Button
          variant={viewMode === 'normal' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('normal')}
          className="flex items-center gap-1"
        >
          <Image size={16} />
          <span>Normal</span>
        </Button>
        
        <Button
          variant={viewMode === 'zoom' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('zoom')}
          className="flex items-center gap-1"
        >
          <ZoomIn size={16} />
          <span>Zoom</span>
        </Button>
        
        <Button
          variant={viewMode === '360' ? 'default' : 'outline'}
          size="sm" 
          onClick={() => setViewMode('360')}
          className="flex items-center gap-1"
        >
          <RotateCw size={16} />
          <span>360° View</span>
        </Button>
      </div>
      
      <div className="flex">
        {/* Thumbnails on the left */}
        <div className="flex flex-col gap-2 mr-4">
          {allImagesUrls.length > 0 ? allImagesUrls.map((image, index) => (
            <div 
              key={`thumb-${index}`}
              className={`w-16 h-16 border cursor-pointer hover:border-primary ${index === activeIndex ? 'border-primary' : 'border-gray-200'}`}
              onClick={() => handleThumbnailClick(index)}
            >
              <img 
                src={image} 
                alt={`${name} thumbnail ${index + 1}`} 
                className="w-full h-full object-contain"
                onError={handleImageError}
              />
            </div>
          )) : (
            <div className="w-16 h-16 border border-gray-200 flex items-center justify-center">
              <span className="text-xs text-gray-400">No images</span>
            </div>
          )}
        </div>
        
        {/* Main image area */}
        <div ref={containerRef} className="flex-1">
          {viewMode === 'normal' && (
            <div className="w-full h-96 border border-gray-100 flex items-center justify-center bg-white relative">
              <img 
                src={allImagesUrls[activeIndex] || defaultImage} 
                alt={name} 
                className="max-w-full max-h-full object-contain cursor-zoom-in transition-transform hover:scale-105"
                onError={handleImageError}
                onClick={() => setViewMode('zoom')}
              />
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white p-1 rounded text-xs">
                Click to zoom
              </div>
            </div>
          )}
          
          {viewMode === 'zoom' && (
            <div className="w-full h-96 border border-gray-100 bg-white">
              <div className="h-full relative flex items-center justify-center">
                <Zoom>
                  <img 
                    src={allImagesUrls[activeIndex] || defaultImage}
                    alt={name} 
                    className="max-w-full max-h-full object-contain"
                    onError={handleImageError}
                    style={{ maxHeight: '384px', margin: '0 auto' }}
                  />
                </Zoom>
              </div>
              <div className="mt-2 text-center text-xs text-gray-500">
                Click on the image to zoom in, move mouse to pan, click again to zoom out
              </div>
            </div>
          )}
          
          {viewMode === '360' && (
            <div className="w-full h-96 border border-gray-100 bg-white flex items-center justify-center">
              <div className="relative w-full h-full flex items-center justify-center">
                {allImagesUrls.length > 0 ? (
                  <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-transparent opacity-30 pointer-events-none" />
                    <img 
                      src={allImagesUrls[activeIndex] || defaultImage} 
                      alt={name} 
                      className="max-w-full max-h-full object-contain transition-all duration-200"
                      onError={handleImageError}
                    />
                    <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-gray-50 to-transparent opacity-20 pointer-events-none" />
                  </div>
                ) : (
                  <span className="text-gray-400">No images available</span>
                )}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 text-white p-2 rounded text-xs flex items-center gap-2">
                  <RotateCw size={14} className="animate-spin-slow" />
                  <span>Move mouse left/right to rotate view</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}