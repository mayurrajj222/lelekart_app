import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";

interface SliderImage {
  url: string;
  alt: string;
  productId?: number; // For navigation to a specific product
  category?: string;  // For navigation to a category page
}

interface HeroSliderProps {
  images: SliderImage[];
  autoplayInterval?: number;
}

export function HeroSlider({ images, autoplayInterval = 5000 }: HeroSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);
  const [, navigate] = useLocation();

  const goToSlide = (slideIndex: number) => {
    let newIndex = slideIndex;
    if (newIndex < 0) newIndex = images.length - 1;
    if (newIndex >= images.length) newIndex = 0;
    
    setCurrentSlide(newIndex);
    
    if (sliderRef.current) {
      sliderRef.current.style.transform = `translateX(-${newIndex * 100}%)`;
    }
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    goToSlide(currentSlide - 1);
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    goToSlide(currentSlide + 1);
  };

  const handleSlideClick = (image: SliderImage) => {
    if (image.productId) {
      console.log("Navigating to product page:", image.productId);
      navigate(`/product/${image.productId}`);
    } else if (image.category) {
      console.log("Navigating to category:", image.category);
      navigate(`/category/${encodeURIComponent(image.category)}`);
    }
  };

  // Set up autoplay
  useEffect(() => {
    const startAutoplay = () => {
      intervalRef.current = window.setInterval(() => {
        goToSlide(currentSlide + 1);
      }, autoplayInterval);
    };

    const stopAutoplay = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    startAutoplay();

    return () => stopAutoplay();
  }, [currentSlide, autoplayInterval]);

  // Pause autoplay on hover
  const handleMouseEnter = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    intervalRef.current = window.setInterval(() => {
      goToSlide(currentSlide + 1);
    }, autoplayInterval);
  };

  return (
    <div 
      className="relative overflow-hidden bg-white"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div 
        ref={sliderRef}
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {images.map((image, index) => (
          <div 
            key={index} 
            className="w-full flex-shrink-0 cursor-pointer"
            onClick={() => handleSlideClick(image)}
          >
            <img 
              src={image.url} 
              alt={image.alt} 
              className="w-full object-cover h-64 md:h-96" 
            />
          </div>
        ))}
      </div>
      
      {/* Slider Controls */}
      <Button
        variant="outline"
        size="icon"
        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg z-10"
        onClick={prevSlide}
      >
        <ChevronLeft className="text-primary" />
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg z-10"
        onClick={nextSlide}
      >
        <ChevronRight className="text-primary" />
      </Button>
      
      {/* Indicator Dots */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {images.map((_, index) => (
          <button 
            key={index}
            className={`w-2 h-2 rounded-full ${
              index === currentSlide ? 'bg-white opacity-100' : 'bg-white opacity-50'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              goToSlide(index);
            }}
          />
        ))}
      </div>
    </div>
  );
}
