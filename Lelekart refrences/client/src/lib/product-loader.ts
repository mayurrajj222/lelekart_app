// Product loading optimization utility

interface ProductLoaderOptions {
  preloadPages?: number; // Number of pages to preload
  concurrency?: number; // Number of concurrent requests
  cacheTime?: number; // Cache time in milliseconds
}

class ProductLoader {
  private cache = new Map<string, any>();
  private loadingPromises = new Map<string, Promise<any>>();
  private preloadedPages = new Set<string>();

  /**
   * Preload multiple pages of products
   */
  async preloadProductPages(
    baseUrl: string,
    currentPage: number,
    totalPages: number,
    options: ProductLoaderOptions = {}
  ): Promise<void> {
    const {
      preloadPages = 2,
      concurrency = 3,
      cacheTime = 5 * 60 * 1000, // 5 minutes
    } = options;

    const pagesToPreload: number[] = [];

    // Calculate which pages to preload
    for (let i = 1; i <= preloadPages; i++) {
      const nextPage = currentPage + i;
      if (nextPage <= totalPages) {
        pagesToPreload.push(nextPage);
      }
    }

    if (pagesToPreload.length === 0) return;

    // Preload pages with concurrency control
    const chunks = this.chunkArray(pagesToPreload, concurrency);

    for (const chunk of chunks) {
      await Promise.allSettled(
        chunk.map((pageNum) => this.preloadPage(baseUrl, pageNum, cacheTime))
      );
    }
  }

  /**
   * Preload a single page
   */
  private async preloadPage(
    baseUrl: string,
    pageNum: number,
    cacheTime: number
  ): Promise<void> {
    const cacheKey = `${baseUrl}_page_${pageNum}`;

    // Skip if already preloaded
    if (this.preloadedPages.has(cacheKey)) {
      return;
    }

    // Skip if already loading
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey);
    }

    const promise = this.fetchPage(baseUrl, pageNum, cacheTime);
    this.loadingPromises.set(cacheKey, promise);

    try {
      await promise;
      this.preloadedPages.add(cacheKey);
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  /**
   * Fetch a page with caching
   */
  private async fetchPage(
    baseUrl: string,
    pageNum: number,
    cacheTime: number
  ): Promise<any> {
    const cacheKey = `${baseUrl}_page_${pageNum}`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheTime) {
      return cached.data;
    }

    // Fetch from API
    const url = new URL(baseUrl);
    url.searchParams.set("page", pageNum.toString());
    url.searchParams.set("limit", "36"); // Larger page size for faster loading
    url.searchParams.set("approved", "true");
    url.searchParams.set("status", "approved");
    url.searchParams.set("homepage", "true");

    const response = await fetch(url.toString(), {
      headers: {
        "Cache-Control": "max-age=300", // 5 minutes cache
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page ${pageNum}`);
    }

    const data = await response.json();

    // Cache the result
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    return data;
  }

  /**
   * Get cached page data
   */
  getCachedPage(baseUrl: string, pageNum: number): any | null {
    const cacheKey = `${baseUrl}_page_${pageNum}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      return cached.data;
    }

    return null;
  }

  /**
   * Clear cache for memory management
   */
  clearCache(): void {
    this.cache.clear();
    this.preloadedPages.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cachedPages: this.cache.size,
      preloadedPages: this.preloadedPages.size,
      loadingPromises: this.loadingPromises.size,
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

// Create singleton instance
export const productLoader = new ProductLoader();

// Hook for React components
export const useProductLoader = () => {
  return {
    preloadProductPages: productLoader.preloadProductPages.bind(productLoader),
    getCachedPage: productLoader.getCachedPage.bind(productLoader),
    clearCache: productLoader.clearCache.bind(productLoader),
    getCacheStats: productLoader.getCacheStats.bind(productLoader),
  };
};
