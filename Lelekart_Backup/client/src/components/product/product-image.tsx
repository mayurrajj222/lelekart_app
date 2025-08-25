import React from "react";
import { Product } from "@shared/schema";

// Extended product type that might include different image naming conventions
interface ProductWithImage extends Partial<Product> {
  image?: string;
  image_url?: string;
  imageUrl?: string | null;
  category?: string;
}

interface ProductImageProps {
  product: ProductWithImage;
  size?: "small" | "medium" | "large";
  priority?: boolean;
}

export function ProductImage({
  product,
  size = "medium",
  priority = false,
}: ProductImageProps) {
  // Generate size class based on the size prop
  const sizeClass = {
    small: "w-10 h-10",
    medium: "w-16 h-16",
    large: "w-24 h-24",
  }[size];

  // Get the image source with fallbacks
  const imageSource =
    product.image_url || product.image || product.imageUrl || "";

  // Determine if proxy is needed
  const needsProxy =
    !!imageSource &&
    (imageSource.includes("flixcart.com") ||
      imageSource.includes("lelekart.com"));

  // Final image URL
  const imageUrl = needsProxy
    ? `/api/image-proxy?url=${encodeURIComponent(imageSource)}&category=${encodeURIComponent(product.category || "")}`
    : imageSource;

  // Handle image error
  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null; // Prevent infinite loop

    // Use category-specific placeholder or default placeholder
    if (product.category) {
      // Convert to lowercase for category-specific image
      const categoryLower = product.category.toLowerCase();
      target.src = `../images/${categoryLower}.svg`;
    } else {
      target.src = "../images/placeholder.svg";
    }
  };

  return (
    <img
      src={imageUrl}
      alt={product.name || "Product image"}
      className={`${sizeClass} rounded-md object-cover`}
      onError={handleError}
      loading={priority ? "eager" : "lazy"}
    />
  );
}
