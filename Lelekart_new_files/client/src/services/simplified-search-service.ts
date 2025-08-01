import { Product } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

// No more caching at the service level - let React Query handle the caching strategy

export async function searchProducts(query: string): Promise<Product[]> {
  try {
    if (!query || query.trim() === '') {
      return [];
    }

    // Normalize the query
    const normalizedQuery = query.trim();
    
    console.log('SIMPLIFIED SEARCH SERVICE - Searching for:', normalizedQuery);
    
    // Use the lelekart-search endpoint directly instead of products?search
    // Include a query parameter to ensure only approved products for buyers
    const cacheBuster = new Date().getTime();
    
    // Create URL with query parameters
    const searchUrl = new URL('/api/lelekart-search', window.location.origin);
    searchUrl.searchParams.append('q', normalizedQuery);
    searchUrl.searchParams.append('limit', '50');
    searchUrl.searchParams.append('_', cacheBuster.toString());
    
    // Always set showOnlyApproved=true for safety
    // The server will override this based on user role if needed
    searchUrl.searchParams.append('showOnlyApproved', 'true');
    
    const response = await fetch(searchUrl.toString(), {
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`SIMPLIFIED SEARCH SERVICE - Found ${data.length} results for "${normalizedQuery}"`);
    
    return data || [];
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
}