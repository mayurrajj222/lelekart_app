/**
 * AI Search Service
 * 
 * This service handles processing search queries with AI to extract structured search parameters.
 * It provides methods for both natural language processing and query building.
 */

// Define the filter structure for search queries
export interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  color?: string;
  size?: string;
  brand?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popularity';
}

// Define the response structure from query processing
export interface ProcessQueryResult {
  success: boolean;
  filters?: SearchFilters;
  enhancedQuery?: string;
  error?: string;
}

export class AISearchService {
  /**
   * Process a search query to extract structured search parameters
   * @param query The search query to process
   * @returns A result containing success status, extracted filters, and enhanced query
   */
  static async processQuery(query: string): Promise<ProcessQueryResult> {
    if (!query || query.trim().length === 0) {
      return {
        success: false,
        error: 'Empty search query'
      };
    }

    try {
      // Send the query to our API endpoint for processing
      const response = await fetch('/api/search/process-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`Failed to process query: ${response.statusText}`);
      }

      const result = await response.json();

      // Format the result
      return {
        success: true,
        filters: result.filters || {},
        enhancedQuery: result.enhancedQuery || query.trim(),
      };
    } catch (error) {
      console.error('Error processing query with AI:', error);
      
      // Return a fallback result that uses the original query
      return {
        success: true,
        filters: {},
        enhancedQuery: query.trim(),
      };
    }
  }

  /**
   * Build a search URL from extracted filters and query
   * @param filters The filters extracted from the query
   * @param query The search query (either original or enhanced)
   * @returns A URL string for the search page
   */
  static buildSearchUrl(filters: SearchFilters = {}, query: string = ''): string {
    // Start with the base search path
    let url = '/search';
    
    // Add the query parameters
    const params = new URLSearchParams();
    
    // Always add the query parameter if it exists
    if (query && query.trim()) {
      params.append('q', query.trim());
    }
    
    // Add filter parameters if they exist
    if (filters.category) params.append('category', filters.category);
    if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters.color) params.append('color', filters.color);
    if (filters.size) params.append('size', filters.size);
    if (filters.brand) params.append('brand', filters.brand);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    
    // Combine the URL and parameters
    const paramString = params.toString();
    if (paramString) {
      url += `?${paramString}`;
    }
    
    return url;
  }

  // Add a cache to store recent search results
  private static suggestionCache: {[key: string]: {timestamp: number, results: any[]}} = {};
  private static pendingQueries: {[key: string]: Promise<any[]>} = {};
  
  /**
   * Get search suggestions for the provided query
   * @param query The search query to get suggestions for
   * @param isAdmin Whether to get admin-specific suggestions
   * @returns An array of search suggestions
   */
  static async getSuggestions(query: string, isAdmin: boolean = false): Promise<any[]> {
    // Skip invalid or too short queries
    if (!query || query.trim().length < 2) {
      console.log("AI Search Service: Query too short, returning empty results");
      return [];
    }
    
    // Clean the query
    const cleanedQuery = query.trim();
    
    // Create a cache key
    const cacheKey = `${cleanedQuery}:${isAdmin ? 'admin' : 'user'}`;
    
    // Check if this exact query is already pending
    if (this.pendingQueries[cacheKey]) {
      console.log(`AI Search Service: Using existing pending request for "${cleanedQuery}"`);
      return this.pendingQueries[cacheKey];
    }
    
    // Check if we have a recent cache entry (valid for 1 minute)
    const cacheEntry = this.suggestionCache[cacheKey];
    if (cacheEntry && (Date.now() - cacheEntry.timestamp < 60000)) {
      console.log(`AI Search Service: Using cached results for "${cleanedQuery}"`);
      return cacheEntry.results;
    }

    // Create a function to handle the actual API request
    const fetchData = async () => {
      try {
        // Cache-busting parameter
        const cacheBuster = new Date().getTime();
        
        // Always use the lelekart-search endpoint directly
        const endpoint = `/api/lelekart-search?q=${encodeURIComponent(cleanedQuery)}&limit=6&_=${cacheBuster}`;
        
        console.log(`AI Search Service: Fetching suggestions from: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Search endpoint failed: ${response.statusText}`);
        }
        
        const results = await response.json();
        console.log(`Found ${results.length} search suggestions for "${cleanedQuery}"`);
        
        // Format the results to match our expected structure
        const formattedResults = results.map((product: any) => {
          // Handle the image array which might be a JSON string or an array
          let imageUrl = null;
          if (product.imageUrl) {
            imageUrl = product.imageUrl;
          } else if (product.images) {
            try {
              const imagesArray = typeof product.images === 'string' 
                ? JSON.parse(product.images) 
                : product.images;
              
              if (Array.isArray(imagesArray) && imagesArray.length > 0) {
                imageUrl = imagesArray[0];
              }
            } catch (err) {
              console.error('Error parsing product images:', err);
            }
          }

          return {
            id: product.id,
            name: product.name,
            image: imageUrl,
            price: product.price || 0,
            category: product.category || 'Uncategorized'
          };
        });
        
        // Store in cache before returning
        this.suggestionCache[cacheKey] = {
          timestamp: Date.now(),
          results: formattedResults
        };
        
        // Clean up the pending query reference
        delete this.pendingQueries[cacheKey];
        
        return formattedResults;
      } catch (error) {
        console.error('Error fetching search suggestions:', error);
        
        // Clean up the pending query reference on error
        delete this.pendingQueries[cacheKey];
        
        return [];
      }
    };
    
    // Store the promise in pendingQueries and return it
    const promise = fetchData();
    this.pendingQueries[cacheKey] = promise;
    return promise;
  }
}