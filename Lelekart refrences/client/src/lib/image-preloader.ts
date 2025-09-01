// Image preloader utility for optimizing image loading performance

interface PreloadOptions {
  priority?: "high" | "low";
  timeout?: number;
}

class ImagePreloader {
  private preloadedImages = new Set<string>();
  private loadingPromises = new Map<string, Promise<void>>();

  /**
   * Preload a single image
   */
  async preloadImage(src: string, options: PreloadOptions = {}): Promise<void> {
    if (this.preloadedImages.has(src)) {
      return Promise.resolve();
    }

    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)!;
    }

    const promise = new Promise<void>((resolve, reject) => {
      const img = new Image();

      const timeout = options.timeout || 10000; // 10 second default timeout
      const timeoutId = setTimeout(() => {
        reject(new Error(`Image preload timeout: ${src}`));
      }, timeout);

      img.onload = () => {
        clearTimeout(timeoutId);
        this.preloadedImages.add(src);
        this.loadingPromises.delete(src);
        resolve();
      };

      img.onerror = () => {
        clearTimeout(timeoutId);
        this.loadingPromises.delete(src);
        reject(new Error(`Failed to preload image: ${src}`));
      };

      // Set priority for high priority images
      if (options.priority === "high") {
        img.fetchPriority = "high";
      }

      img.src = src;
    });

    this.loadingPromises.set(src, promise);
    return promise;
  }

  /**
   * Preload multiple images with concurrency control
   */
  async preloadImages(
    urls: string[],
    options: PreloadOptions & { concurrency?: number } = {}
  ): Promise<void> {
    const concurrency = options.concurrency || 3;
    const chunks = this.chunkArray(urls, concurrency);

    for (const chunk of chunks) {
      await Promise.allSettled(
        chunk.map((url) => this.preloadImage(url, options))
      );
    }
  }

  /**
   * Preload critical images for above-the-fold content
   */
  async preloadCriticalImages(urls: string[]): Promise<void> {
    return this.preloadImages(urls, {
      priority: "high",
      concurrency: 2,
      timeout: 5000,
    });
  }

  /**
   * Check if an image is already preloaded
   */
  isPreloaded(src: string): boolean {
    return this.preloadedImages.has(src);
  }

  /**
   * Clear preloaded images cache (useful for memory management)
   */
  clearCache(): void {
    this.preloadedImages.clear();
    this.loadingPromises.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      preloadedCount: this.preloadedImages.size,
      loadingCount: this.loadingPromises.size,
    };
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// Create a singleton instance
export const imagePreloader = new ImagePreloader();

// Utility functions for common preloading scenarios
export const preloadProductImages = (products: any[], count = 5) => {
  const imageUrls = products
    .slice(0, count)
    .map((product) => {
      const imageUrl = product.imageUrl || product.image_url || product.image;
      return imageUrl && typeof imageUrl === "string" ? imageUrl : null;
    })
    .filter(Boolean) as string[];

  if (imageUrls.length > 0) {
    imagePreloader.preloadCriticalImages(imageUrls);
  }
};

export const preloadCategoryImages = (category: string) => {
  // Preload category-specific placeholder images
  const categoryImage = `/images/categories/${category.toLowerCase()}.svg`;
  imagePreloader.preloadImage(categoryImage, { priority: "high" });
};

// Hook for React components
export const useImagePreloader = () => {
  return {
    preloadImage: imagePreloader.preloadImage.bind(imagePreloader),
    preloadImages: imagePreloader.preloadImages.bind(imagePreloader),
    preloadCriticalImages:
      imagePreloader.preloadCriticalImages.bind(imagePreloader),
    isPreloaded: imagePreloader.isPreloaded.bind(imagePreloader),
    clearCache: imagePreloader.clearCache.bind(imagePreloader),
    getCacheStats: imagePreloader.getCacheStats.bind(imagePreloader),
  };
};
