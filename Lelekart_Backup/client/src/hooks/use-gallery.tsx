import { useState } from "react";

export interface GalleryImage {
  id: string;
  url: string;
  title: string;
  type: "banner" | "category" | "product" | "custom";
}

export function useGallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  
  const addImage = (image: GalleryImage) => {
    setImages([...images, image]);
  };
  
  const removeImage = (id: string) => {
    setImages(images.filter(img => img.id !== id));
  };
  
  const updateImage = (id: string, updates: Partial<GalleryImage>) => {
    setImages(images.map(img => img.id === id ? { ...img, ...updates } : img));
  };
  
  return {
    images,
    addImage,
    removeImage,
    updateImage
  };
}