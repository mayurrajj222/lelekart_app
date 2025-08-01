import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Try to get auth context safely
const useSafeAuth = () => {
  try {
    return useAuth();
  } catch (e) {
    console.warn('Auth context not available, returning null');
    return { user: null };
  }
};

interface WishlistItem {
  id: number;
  userId: number;
  product: {
    id: number;
    name: string;
    price: number;
    imageUrl: string;
    [key: string]: any;
  };
  dateAdded: string;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  isLoading: boolean;
  error: Error | null;
  isInWishlist: (productId: number) => boolean;
  addToWishlist: (productId: number) => Promise<void>;
  removeFromWishlist: (productId: number) => Promise<void>;
  toggleWishlist: (productId: number) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const auth = useSafeAuth();
  const user = auth?.user || null;
  const { toast } = useToast();

  // Fetch wishlist items when user changes
  useEffect(() => {
    fetchWishlistItems();
  }, [user]);

  // Function to fetch wishlist items
  const fetchWishlistItems = async () => {
    if (!user) {
      setWishlistItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest('GET', '/api/wishlist');
      if (!response.ok) {
        throw new Error('Failed to fetch wishlist items');
      }
      const data = await response.json();
      setWishlistItems(data);
    } catch (err) {
      console.error('Error fetching wishlist:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  };

  // Check if a product is in the wishlist
  const isInWishlist = (productId: number): boolean => {
    return wishlistItems.some(item => item.product.id === productId);
  };

  // Add a product to the wishlist
  const addToWishlist = async (productId: number): Promise<void> => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to add items to your wishlist',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await apiRequest('POST', '/api/wishlist', { productId });
      if (!response.ok) {
        throw new Error('Failed to add item to wishlist');
      }
      
      toast({
        title: 'Item Added to Wishlist',
        description: 'The product has been added to your wishlist',
      });
      
      // Refresh wishlist data
      fetchWishlistItems();
      
      // Invalidate any queries that might display wishlist status
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
      
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      toast({
        title: 'Error',
        description: 'Failed to add item to wishlist',
        variant: 'destructive',
      });
    }
  };

  // Remove a product from the wishlist
  const removeFromWishlist = async (productId: number): Promise<void> => {
    if (!user) return;

    try {
      const response = await apiRequest('DELETE', `/api/wishlist/${productId}`);
      if (!response.ok) {
        throw new Error('Failed to remove item from wishlist');
      }
      
      toast({
        title: 'Item Removed',
        description: 'The product has been removed from your wishlist',
      });
      
      // Update local state
      setWishlistItems(prev => prev.filter(item => item.product.id !== productId));
      
      // Invalidate any queries that might display wishlist status
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
      
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      toast({
        title: 'Error',
        description: 'Failed to remove item from wishlist',
        variant: 'destructive',
      });
    }
  };

  // Toggle wishlist status (add or remove)
  const toggleWishlist = async (productId: number): Promise<void> => {
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  };

  const contextValue: WishlistContextType = {
    wishlistItems,
    isLoading,
    error,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
  };

  return (
    <WishlistContext.Provider value={contextValue}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}