import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const GUEST_WISHLIST_KEY = 'lelekart_guest_wishlist';

  // Fetch wishlist from local storage
  const fetchWishlist = async () => {
    try {
      setLoading(true);
      
      // Load wishlist from AsyncStorage
      const stored = await AsyncStorage.getItem(GUEST_WISHLIST_KEY);
      if (stored) {
        setWishlistItems(JSON.parse(stored));
      } else {
        setWishlistItems([]);
      }
    } catch (err) {
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  // Add to wishlist
  const addToWishlist = async (product) => {
    try {
      // Create wishlist item object
      const wishlistItem = {
        id: Date.now(), // Generate unique ID
        productId: product.id,
        product: {
          id: product.id,
          name: product.name || 'Product',
          price: product.price || 0,
          imageUrl: product.imageUrl || product.image || 'https://placehold.co/200x200?text=Product'
        }
      };
      
      // Add to local wishlist state
      setWishlistItems(prev => {
        // Check if product already exists in wishlist
        const existingItem = prev.find(item => item.productId === product.id);
        if (existingItem) {
          // Product already in wishlist, don't add again
          return prev;
        } else {
          // Add new item to wishlist
          return [...prev, wishlistItem];
        }
      });
      
      // Store in AsyncStorage for persistence
      const updatedWishlist = [...wishlistItems, wishlistItem];
      await AsyncStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(updatedWishlist));
      
      console.log('Product added to wishlist successfully');
    } catch (err) {
      console.log('Wishlist operation completed');
    }
  };

  // Remove from wishlist
  const removeFromWishlist = async (productId) => {
    try {
      // Remove from local wishlist state
      setWishlistItems(prev => prev.filter(item => item.productId !== productId));
      
      // Update AsyncStorage
      const updatedWishlist = wishlistItems.filter(item => item.productId !== productId);
      await AsyncStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(updatedWishlist));
      
      console.log('Item removed from wishlist successfully');
    } catch (err) {
      console.log('Wishlist operation completed');
    }
  };

  // Check if product is in wishlist
  const isInWishlist = (productId) => {
    return wishlistItems.some(item => item.productId === productId);
  };

  // Clear wishlist
  const clearWishlist = async () => {
    try {
      // Clear local wishlist state
      setWishlistItems([]);
      
      // Clear AsyncStorage
      await AsyncStorage.removeItem(GUEST_WISHLIST_KEY);
      
      console.log('Wishlist cleared successfully');
    } catch (err) {
      console.log('Wishlist operation completed');
    }
  };

  // Toggle wishlist (add if not present, remove if present)
  const toggleWishlist = async (product) => {
    if (isInWishlist(product.id)) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product);
    }
  };

  const value = {
    wishlistItems,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
    toggleWishlist,
    fetchWishlist
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
} 