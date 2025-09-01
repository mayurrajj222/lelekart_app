import React, { useState, useEffect, useRef, useCallback } from "react";

interface ProductImageProps {
  product: {
    id: number;
    name: string;
    image_url?: string;
    image?: string;
    imageUrl?: string | null; // Allow null for imageUrl
    category?: string;
    hasVariants?: boolean;
    variants?: any[];
  };
  className?: string;
  priority?: boolean; // For above-the-fold images
  sizes?: string; // For responsive images
}

export function ProductImage({
  product,
  className = "",
  priority = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
}: ProductImageProps) {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Default to category-specific placeholder or general placeholder
  const getCategoryImage = useCallback(() => {
    if (product.category) {
      const category = product.category.toLowerCase();

      // For fashion items like shapewear, return a special fashion image
      if (
        category === "fashion" &&
        product.name?.toLowerCase().includes("shapewear")
      ) {
        return `/images/categories/fashion.svg`;
      }

      // Check if category image exists by matching against known categories
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
      if (knownCategories.includes(category)) {
        return `/images/categories/${category}.svg`;
      }
    }
    return "/images/placeholder.svg";
  }, [product.category, product.name]);

  // Determine if a URL should be skipped (only clearly invalid URLs)
  const shouldSkipUrl = useCallback((url: string) => {
    return (
      !url ||
      url === "null" ||
      url === "undefined" ||
      url === "" ||
      // Only skip obvious placeholder URLs
      url?.includes("placeholder.com/50") ||
      url?.includes("via.placeholder.com/100") ||
      // Skip URL shorteners that frequently expire
      url.includes("bit.ly")
    );
  }, []);

  // Get the best image URL to use, prioritize local paths
  const getImageUrl = useCallback(() => {
    const imageUrl = product.image_url || product.image || product.imageUrl;

    if (imageUrl && !shouldSkipUrl(imageUrl)) {
      if (imageUrl.startsWith("/")) {
        // Local path - always use directly
        return imageUrl;
      } else if (imageUrl.includes("lelekart.com")) {
        // Use proxy for our own domain
        return `/api/image-proxy?url=${encodeURIComponent(imageUrl)}&category=${encodeURIComponent(product.category || "")}`;
      } else if (imageUrl.startsWith("http://")) {
        // Convert http URLs to https where possible
        return imageUrl.replace("http://", "https://");
      } else if (
        imageUrl.includes("amazonaws.com") ||
        imageUrl.includes("s3.") ||
        (imageUrl.startsWith("https://") && imageUrl.length > 20)
      ) {
        // Always use S3 and other HTTPS URLs directly
        return imageUrl;
      } else if (imageUrl.includes("chunumunu")) {
        // Direct use of our S3 bucket images
        return imageUrl;
      } else {
        // For problematic sources, check if the URL seems legitimate
        const hasValidPath =
          imageUrl.includes("/") &&
          imageUrl.lastIndexOf(".") > imageUrl.lastIndexOf("/");
        if (hasValidPath) {
          return imageUrl; // Try using the original URL
        } else {
          return getCategoryImage(); // Fall back to category image
        }
      }
    } else {
      // Go to category-specific image
      return getCategoryImage();
    }
  }, [
    product.image_url,
    product.image,
    product.imageUrl,
    product.category,
    shouldSkipUrl,
    getCategoryImage,
  ]);

  // Always set imageSrc immediately for instant loading
  useEffect(() => {
    const url = getImageUrl();
    setImageSrc(url);
  }, [getImageUrl]);

  // Preload fallback image
  useEffect(() => {
    const fallbackImg = new Image();
    fallbackImg.src = getCategoryImage();
  }, [getCategoryImage]);

  // Show image instantly if already cached/preloaded
  useEffect(() => {
    if (imgRef.current && imageSrc) {
      if (imgRef.current.complete && imgRef.current.naturalWidth !== 0) {
        setIsLoaded(true);
      }
    }
  }, [imageSrc]);

  const handleImageError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      if (!hasError) {
        setHasError(true);
        const target = e.target as HTMLImageElement;
        target.onerror = null; // Prevent infinite loop
        const fallbackSrc = getCategoryImage();
        setImageSrc(fallbackSrc);
      }
    },
    [hasError, getCategoryImage]
  );

  // Always show the image, no skeleton
  return (
    <img
      ref={imgRef}
      src={imageSrc || getCategoryImage()}
      alt={product.name || "Product image"}
      className={`max-w-full max-h-full object-contain transition-opacity duration-100 ${
        isLoaded ? "opacity-100" : "opacity-0"
      } ${className}`}
      loading="eager"
      sizes={sizes}
      onLoad={() => setIsLoaded(true)}
      onError={handleImageError}
      style={{
        aspectRatio: "1",
        minHeight: "160px",
      }}
    />
  );
}
