import React, { useState } from 'react';

interface FashionProductImageProps {
  product: {
    id: number;
    name: string;
    image_url?: string;
    image?: string;
    imageUrl?: string;
    category?: string;
  };
  className?: string;
}

export function FashionProductImage({ product, className = "" }: FashionProductImageProps) {
  // Always use the fashion category image for fashion products
  const getCategoryImage = () => {
    return `/images/categories/fashion.svg`;
  };

  const [imageLoaded, setImageLoaded] = useState(false);
  
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Always show the category image */}
      <img
        src={getCategoryImage()}
        alt={product.name}
        className={`max-w-full max-h-full object-contain`}
      />
    </div>
  );
}