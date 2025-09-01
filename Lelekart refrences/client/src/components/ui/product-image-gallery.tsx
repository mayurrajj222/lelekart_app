import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation, Thumbs } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';

interface ProductImageGalleryProps {
  imageUrl?: string | null;
  additionalImages?: string | string[] | null;
  productName?: string;
  category?: string;
}

export function ProductImageGallery({ imageUrl, additionalImages, productName = "Product", category }: ProductImageGalleryProps) {
  // Process and extract images from different possible formats
  const processImages = useMemo(() => {
    const allImages: string[] = [];
    
    // Helper function to safely parse JSON strings
    const safeJsonParse = (jsonString: string) => {
      try {
        return JSON.parse(jsonString);
      } catch (e) {
        return null;
      }
    };
    
    try {
      // Add the main image if it exists
      if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
        // Check if it's a proper URL or a JSON string
        if (imageUrl.startsWith('http')) {
          allImages.push(imageUrl);
        } else if (imageUrl.includes('[') && imageUrl.includes(']')) {
          // May be a JSON array as a string
          const parsed = safeJsonParse(imageUrl);
          if (Array.isArray(parsed) && parsed.length > 0) {
            allImages.push(...parsed.filter(Boolean));
          }
        }
      }
  
      // Add additional images based on their type
      if (additionalImages) {
        // Case 1: additionalImages is a string array
        if (Array.isArray(additionalImages)) {
          allImages.push(...additionalImages.filter(img => 
            typeof img === 'string' && img.trim() !== ''
          ));
        } 
        // Case 2: additionalImages is a single string
        else if (typeof additionalImages === 'string') {
          try {
            // First, check if this is a JSON string of an array
            if (additionalImages.includes('[') && additionalImages.includes(']')) {
              const parsed = safeJsonParse(additionalImages);
              if (Array.isArray(parsed)) {
                // Filter out any null or empty strings
                allImages.push(...parsed.filter((item: unknown) => Boolean(item)));
              }
            }
            // Check if it's a JSON object with URLs as keys in a specific format
            else if (additionalImages.includes('{') && additionalImages.includes('}')) {
              try {
                // Extract URLs with regex
                const urlMatches = additionalImages.match(/https?:\/\/[^",\\]+/g);
                if (urlMatches && urlMatches.length > 0) {
                  allImages.push(...urlMatches);
                }
              } catch (parseErr) {
                // If regex extraction failed, try to extract URLs directly
                const urlMatches = additionalImages.match(/https?:\/\/[^",\\]+/g);
                if (urlMatches && urlMatches.length > 0) {
                  allImages.push(...urlMatches);
                }
              }
            }
            // Case 3: It's a single URL string
            else if (additionalImages.trim() !== '') {
              allImages.push(additionalImages);
            }
          } catch (e) {
            // If it's a valid URL despite parsing error, still add it
            if (additionalImages.startsWith('http')) {
              allImages.push(additionalImages);
            } else {
              // Last resort: try to extract URLs with regex
              const urlMatches = additionalImages.match(/https?:\/\/[^",\\]+/g);
              if (urlMatches && urlMatches.length > 0) {
                allImages.push(...urlMatches);
              }
            }
          }
        }
      }
    } catch (err) {
      // Silent error handling to prevent console spam
    }

    // Return the unique images as an array to avoid TypeScript issues and remove duplicates
    return Array.from(new Set(allImages));
  }, [imageUrl, additionalImages]);

  // References to Swiper instances
  const mainSwiperRef = useRef<SwiperType | null>(null);
  const thumbsSwiperRef = useRef<SwiperType | null>(null);
  
  // State
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [renderedImages, setRenderedImages] = useState<string[]>([]);
  
  // Process images when they change
  useEffect(() => {
    const finalImages = processImages.length > 0 
      ? processImages 
      : ['https://placehold.co/600x400?text=No+Image'];
    
    // Skip verification for better performance
    setRenderedImages(finalImages);
    
    // Reset active index when images change
    setActiveIndex(0);
    
    // Update swiper if available - use a more efficient approach
    if (mainSwiperRef.current) {
      mainSwiperRef.current.slideTo(0, 0);
      
      // Using requestAnimationFrame instead of setTimeout for better performance
      requestAnimationFrame(() => {
        if (mainSwiperRef.current) {
          mainSwiperRef.current.update();
        }
        if (thumbsSwiperRef.current) {
          thumbsSwiperRef.current.update();
        }
      });
    }
  }, [processImages]);

  // Navigate between images
  const goToSlide = (index: number) => {
    if (mainSwiperRef.current) {
      mainSwiperRef.current.slideTo(index);
    }
    setActiveIndex(index);
  };

  // Get placeholder image based on category
  const getPlaceholderImage = () => {
    if (category) {
      const categoryLower = category.toLowerCase();
      return `../images/${categoryLower}.svg`;
    }
    return '../images/placeholder.svg';
  };

  // Placeholder image for errors
  const placeholderImage = getPlaceholderImage();

  return (
    <div className="product-gallery">
      {/* Main large image with swipe capability */}
      <div className="main-image-container relative mb-3">
        <Swiper
          modules={[Pagination, Navigation, Thumbs]}
          thumbs={{ swiper: thumbsSwiper }}
          pagination={{ 
            clickable: true,
            dynamicBullets: true
          }}
          navigation={renderedImages.length > 1}
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          className="rounded-lg overflow-hidden"
          onSwiper={(swiper) => {
            mainSwiperRef.current = swiper;
          }}
          key={`main-${renderedImages.length}`} // Force re-render when images change
        >
          {renderedImages.map((image, idx) => (
            <SwiperSlide key={`slide-${idx}`}>
              <div className="aspect-[4/3] flex items-center justify-center bg-white">
                <img 
                  src={image.includes('flixcart.com') || image.includes('lelekart.com') 
                    ? `/api/image-proxy?url=${encodeURIComponent(image)}&category=${encodeURIComponent(category || '')}` 
                    : image}
                  alt={`${productName} - Image ${idx + 1}`} 
                  className="max-h-80 max-w-full object-contain"
                  loading="eager"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = placeholderImage;
                  }}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        
        {/* Navigation arrows for desktop */}
        {renderedImages.length > 1 && (
          <div className="hidden sm:block">
            <Button 
              variant="outline" 
              size="icon" 
              className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 rounded-full w-8 h-8 bg-white opacity-80 hover:opacity-100 shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                if (activeIndex > 0) {
                  goToSlide(activeIndex - 1);
                }
              }}
              disabled={activeIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 rounded-full w-8 h-8 bg-white opacity-80 hover:opacity-100 shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                if (activeIndex < renderedImages.length - 1) {
                  goToSlide(activeIndex + 1);
                }
              }}
              disabled={activeIndex === renderedImages.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Thumbnail images for navigation */}
      {renderedImages.length > 1 && (
        <div className="thumbnails-container">
          <Swiper
            onSwiper={(swiper) => {
              setThumbsSwiper(swiper);
              thumbsSwiperRef.current = swiper;
            }}
            slidesPerView="auto"
            spaceBetween={10}
            modules={[Thumbs]}
            watchSlidesProgress={true}
            className="thumbnail-swiper"
            key={`thumbs-${renderedImages.length}`} // Force re-render when images change
          >
            {renderedImages.map((image, idx) => (
              <SwiperSlide key={`thumb-${idx}`} className="w-16">
                <div 
                  className={`cursor-pointer rounded-md overflow-hidden border-2 h-16 ${
                    activeIndex === idx ? 'border-primary' : 'border-transparent'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    goToSlide(idx);
                  }}
                >
                  <img 
                    src={image.includes('flixcart.com') || image.includes('lelekart.com') 
                      ? `/api/image-proxy?url=${encodeURIComponent(image)}&category=${encodeURIComponent(category || '')}` 
                      : image}
                    alt={`Thumbnail ${idx + 1}`} 
                    className="w-full h-full object-cover"
                    loading="eager"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = placeholderImage;
                    }}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </div>
  );
}