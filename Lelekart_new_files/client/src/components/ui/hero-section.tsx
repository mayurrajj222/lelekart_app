import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";

// Hero slider image interface
interface SliderImage {
  url: string;
  alt: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  category?: string;
  subcategory?: string;
  badgeText?: string;
  productId?: number;
}

interface HeroSectionProps {
  sliderImages: SliderImage[];
  dealOfTheDay?: {
    title: string;
    subtitle: string;
    image: string;
    originalPrice: number | string;
    discountPrice: number | string;
    discountPercentage: number;
    hours: number;
    minutes: number;
    seconds: number;
    productId?: number; // Added product ID for linking
  };
}

export function HeroSection({ sliderImages, dealOfTheDay }: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);
  const [, navigate] = useLocation();
  const { cartItems, addToCart } = useCart();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Helper function to get category-specific image
  const getCategoryImage = (category?: string) => {
    if (category) {
      const categoryLower = category.toLowerCase();
      // List of known categories with images
      const knownCategories = [
        "electronics",
        "fashion",
        "mobiles",
        "home",
        "beauty",
        "grocery",
        "toys",
        "appliances",
      ];
      if (knownCategories.includes(categoryLower)) {
        return `/images/categories/${categoryLower}.svg`;
      }
    }
    return "/images/placeholder.svg";
  };

  // Helper function to get deal of the day category image
  const getDealCategory = () => {
    // Extract category from subtitle if available
    const category = dealOfTheDay?.subtitle.includes("Electronics")
      ? "electronics"
      : dealOfTheDay?.subtitle.includes("Fashion")
        ? "fashion"
        : dealOfTheDay?.subtitle.includes("Home")
          ? "home"
          : dealOfTheDay?.subtitle.includes("Appliances")
            ? "appliances"
            : dealOfTheDay?.subtitle.includes("Mobiles")
              ? "mobiles"
              : dealOfTheDay?.subtitle.includes("Beauty")
                ? "beauty"
                : dealOfTheDay?.subtitle.includes("Toys")
                  ? "toys"
                  : dealOfTheDay?.subtitle.includes("Grocery")
                    ? "grocery"
                    : "general";

    return `/images/categories/${category}.svg`;
  };

  // Deal of the day countdown - only initialize if we have a deal
  const [countdown, setCountdown] = useState({
    hours: dealOfTheDay?.hours || 0,
    minutes: dealOfTheDay?.minutes || 0,
    seconds: dealOfTheDay?.seconds || 0,
  });

  // Reset countdown when dealOfTheDay changes
  useEffect(() => {
    setCountdown({
      hours: dealOfTheDay?.hours || 0,
      minutes: dealOfTheDay?.minutes || 0,
      seconds: dealOfTheDay?.seconds || 0,
    });
  }, [dealOfTheDay]);

  // Update countdown timer - only if we have a deal of the day
  useEffect(() => {
    if (!dealOfTheDay) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        let newSeconds = prev.seconds - 1;
        let newMinutes = prev.minutes;
        let newHours = prev.hours;

        if (newSeconds < 0) {
          newSeconds = 59;
          newMinutes--;
        }

        if (newMinutes < 0) {
          newMinutes = 59;
          newHours--;
        }

        if (
          newHours < 0 ||
          (newHours === 0 && newMinutes === 0 && newSeconds === 0)
        ) {
          // When timer ends, refetch the deal and reset timer
          queryClient.invalidateQueries(["/api/deal-of-the-day"]);
          return { hours: 0, minutes: 0, seconds: 0 };
        }

        return { hours: newHours, minutes: newMinutes, seconds: newSeconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [dealOfTheDay, queryClient]);

  const goToSlide = (slideIndex: number) => {
    let newIndex = slideIndex;
    if (newIndex < 0) newIndex = sliderImages.length - 1;
    if (newIndex >= sliderImages.length) newIndex = 0;

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
      // Use Wouter navigation instead of direct location change
      navigate(`/product/${image.productId}`);
    } else if (image.category) {
      let url = `/category/${image.category.toLowerCase()}`;
      if (image.subcategory) {
        url += `?subcategory=${image.subcategory.toLowerCase()}`;
      }
      navigate(url);
    }
  };

  // Set up autoplay
  useEffect(() => {
    // Function to advance to the next slide
    const advanceSlide = () => {
      setCurrentSlide((prevSlide) => {
        const nextSlide =
          prevSlide + 1 >= sliderImages.length ? 0 : prevSlide + 1;

        // Update the transform directly
        if (sliderRef.current) {
          sliderRef.current.style.transform = `translateX(-${
            nextSlide * 100
          }%)`;
        }

        return nextSlide;
      });
    };

    // Start autoplay with 5 second intervals
    const autoplayInterval = setInterval(advanceSlide, 5000);

    // Clear interval on component unmount
    return () => clearInterval(autoplayInterval);
  }, [sliderImages.length]); // Only re-run if the number of slides changes

  // Pause autoplay on hover
  const handleMouseEnter = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    // Restart the autoplay when mouse leaves
    if (!intervalRef.current) {
      intervalRef.current = window.setInterval(() => {
        const nextSlide =
          currentSlide + 1 >= sliderImages.length ? 0 : currentSlide + 1;
        goToSlide(nextSlide);
      }, 5000);
    }
  };

  const handleDealAddToCart = async () => {
    if (!dealOfTheDay?.productId) return;

    // Check if user is logged in
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to add items to cart",
        variant: "default",
      });
      navigate("/auth");
      return;
    }

    // Check if user is admin or seller
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
      const response = await fetch(`/api/products/${dealOfTheDay.productId}`);
      if (!response.ok) throw new Error("Failed to fetch product");
      const product = await response.json();

      await addToCart(product, 1);
      toast({
        title: "Added to cart",
        description: "The deal of the day has been added to your cart",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add product to cart",
        variant: "destructive",
      });
    }
  };

  // Check if deal product is in cart
  const isDealInCart = dealOfTheDay?.productId
    ? cartItems.some((item) => item.product.id === dealOfTheDay.productId)
    : false;

  const handleGoToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate("/cart");
  };

  // Helper to format price in INR with max 2 decimals
  function formatINR(price: number | string) {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(num)) return price;
    return Math.round(num).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0, minimumFractionDigits: 0 });
  }

  return (
    <>
      {/* Main hero slider */}
      <div
        className="relative w-full overflow-hidden bg-[#EADDCB]"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          ref={sliderRef}
          className="flex transition-transform duration-500 ease-in-out w-full"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {sliderImages.map((image, index) => (
            <div
              key={index}
              className="w-full flex-shrink-0 cursor-pointer"
              onClick={() => handleSlideClick(image)}
            >
              <div className="w-full flex flex-col md:flex-row items-center justify-center p-0 m-0">
                {/* Content area */}
                <div className="md:w-1/2 text-black mb-8 md:mb-0 md:pr-8 flex flex-col items-start justify-center px-4">
                  {image.badgeText && (
                    <span className="bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-md uppercase">
                      {image.badgeText}
                    </span>
                  )}
                  <h2 className="text-3xl md:text-5xl font-bold mt-4 leading-tight">
                    {image.title || "Summer Sale Collection"}
                  </h2>
                  <p className="mt-4 text-lg md:text-xl opacity-90 max-w-md">
                    {image.subtitle || "Up to 50% off on all summer essentials"}
                  </p>
                  <Button
                    className="mt-6 bg-[#F8F5E4] text-black hover:bg-[#EADDCB] border border-[#EADDCB]"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSlideClick(image);
                    }}
                  >
                    {image.buttonText || "Shop Now"}
                  </Button>
                </div>

                {/* Image area - full width, no white bg, edge-to-edge */}
                <div className="md:w-1/2 w-full flex items-center justify-center p-0 m-0">
                  <img
                    src={
                      image.url && !image.url.includes("placeholder.com")
                        ? image.url
                        : getCategoryImage(image.category)
                    }
                    alt={image.alt}
                    className="w-full h-64 md:h-96 object-contain"
                    style={{ maxHeight: '420px', background: 'none', border: 'none', boxShadow: 'none', borderRadius: 0 }}
                    onError={(e) => {
                      // Use a category-specific fallback image on error
                      const target = e.target as HTMLImageElement;
                      target.onerror = null; // Prevent infinite loop
                      target.src = getCategoryImage(image.category);
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Slider Controls - move below banner, center, and use modern color */}
        <div className="w-full flex justify-center items-center gap-4 mt-2 mb-4">
          <Button
            variant="outline"
            size="icon"
            className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black rounded-full p-3 shadow-lg border-none hover:from-orange-400 hover:to-yellow-400"
            onClick={prevSlide}
          >
            <ChevronLeft className="text-black" />
          </Button>
          <div className="flex space-x-2">
            {sliderImages.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full border-2 border-yellow-400 ${
                  index === currentSlide ? "bg-orange-400" : "bg-yellow-200"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  goToSlide(index);
                }}
              />
            ))}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black rounded-full p-3 shadow-lg border-none hover:from-orange-400 hover:to-yellow-400"
            onClick={nextSlide}
          >
            <ChevronRight className="text-black" />
          </Button>
        </div>
      </div>

      {/* Deal of the Day Section - only show if we have deal data */}
      {dealOfTheDay && (
        <div className="bg-[#EADDCB] py-8">
          <div className="container mx-auto px-4">
            <div className="bg-[#F8F5E4] rounded-2xl shadow-2xl p-8 flex flex-col md:flex-row items-center justify-center border border-[#e0c9a6]">
              {/* Left side - Deal info */}
              <div className="md:w-2/3 w-full mb-8 md:mb-0 md:pr-12 text-center">
                <div className="flex items-center mb-4 justify-center">
                  <span className="bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded mr-4 tracking-wide shadow-sm">DEAL OF THE DAY</span>
                  <div className="flex space-x-3">
                    <div className="text-center">
                      <div className="text-xl font-bold text-[#e76f51]">{countdown.hours}</div>
                      <div className="text-xs text-gray-500">Hours</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-[#e76f51]">{countdown.minutes}</div>
                      <div className="text-xs text-gray-500">Minutes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-[#e76f51]">{countdown.seconds}</div>
                      <div className="text-xs text-gray-500">Seconds</div>
                    </div>
                  </div>
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-black mb-2 leading-snug">{dealOfTheDay.title}</h3>
                <p className="text-gray-700 mb-4 text-sm md:text-base">{dealOfTheDay.subtitle}</p>
                <div className="flex items-end mb-4 gap-3 flex-wrap justify-center">
                  <span className="text-xl md:text-2xl font-bold text-black">{formatINR(dealOfTheDay.discountPrice)}</span>
                  <span className="text-base md:text-lg line-through text-gray-400">{formatINR(dealOfTheDay.originalPrice)}</span>
                  <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded shadow-sm">{dealOfTheDay.discountPercentage}% OFF</span>
                </div>
                <Button
                  className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-bold text-lg px-8 py-3 rounded-full shadow-md hover:from-orange-400 hover:to-yellow-400 transition-colors border-none"
                  style={{boxShadow: '0 4px 16px 0 rgba(0,0,0,0.10)'}}
                  onClick={isDealInCart ? handleGoToCart : handleDealAddToCart}
                >
                  {isDealInCart ? "Go to Cart" : "Add to Cart"}
                </Button>
              </div>
              {/* Right side - Deal image */}
              <div className="md:w-1/3 w-full flex items-center justify-center">
                <div className="bg-[#F8F5E4] rounded-2xl shadow-xl p-2 flex items-center justify-center border border-[#e0c9a6]">
                  <img
                    src={dealOfTheDay.image}
                    alt={dealOfTheDay.title}
                    className="w-48 h-48 object-cover rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
