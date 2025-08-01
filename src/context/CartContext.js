import React, { createContext, useState, useEffect, useContext } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '../lib/api';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [guestCart, setGuestCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const GUEST_CART_KEY = 'lelekart_guest_cart';

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsUserLoading(true);
        const res = await fetch(`${API_BASE}/api/user`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
        });
        
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Error checking auth:', err);
        setUser(null);
      } finally {
        setIsUserLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Load guest cart from AsyncStorage on mount
  useEffect(() => {
    const loadGuestCart = async () => {
      try {
        const stored = await AsyncStorage.getItem(GUEST_CART_KEY);
        if (stored) {
          const parsedCart = JSON.parse(stored);
          setGuestCart(parsedCart);
        }
      } catch (err) {
        console.error('Error loading guest cart:', err);
        setGuestCart([]);
      }
    };
    
    loadGuestCart();
  }, []);

  // Save guest cart to AsyncStorage whenever it changes
  useEffect(() => {
    const saveGuestCart = async () => {
      try {
        await AsyncStorage.setItem(GUEST_CART_KEY, JSON.stringify(guestCart));
      } catch (err) {
        console.error('Error saving guest cart:', err);
      }
    };
    
    saveGuestCart();
  }, [guestCart]);

  // Fetch cart from server or use guest cart
  const fetchCart = async () => {
    try {
      setLoading(true);
      
      if (user) {
        // Fetch from server for authenticated users
        const res = await fetch(`${API_BASE}/api/cart`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
        });
        
        if (res.ok) {
          const serverCart = await res.json();
          setCartItems(serverCart);
        } else {
          setCartItems([]);
        }
      } else {
        // Use guest cart for unauthenticated users
        setCartItems(guestCart);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user, guestCart]);

  // Merge guest cart into server cart on login
  useEffect(() => {
    const mergeGuestCart = async () => {
      if (!user || guestCart.length === 0) return;
      
      try {
        // Add each guest cart item to server cart
        for (const item of guestCart) {
          try {
            await fetch(`${API_BASE}/api/cart`, {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                productId: item.product.id,
                quantity: item.quantity,
                variantId: item.variant?.id,
              }),
            });
          } catch (error) {
            console.error('Error merging cart item:', error);
          }
        }
        
        // Clear guest cart after successful merge
        setGuestCart([]);
        await AsyncStorage.removeItem(GUEST_CART_KEY);
        
        // Refresh cart data
        await fetchCart();
      } catch (error) {
        console.error('Error during cart merge:', error);
      }
    };

    mergeGuestCart();
  }, [user]);

  // Add to cart with proper variant handling and server sync
  const addToCart = async (product, quantity = 1, variant = null, showAlert = true) => {
    try {
      // Handle negative quantities (decrease quantity)
      if (quantity < 0) {
        const existingItem = cartItems.find(item => {
          const sameProduct = item.productId === product.id;
          const sameVariant = JSON.stringify(item.variant) === JSON.stringify(variant || product.selectedVariant);
          return sameProduct && sameVariant;
        });

        if (existingItem) {
          const newQuantity = existingItem.quantity + quantity;
          if (newQuantity <= 0) {
            await removeFromCart(existingItem.id, showAlert);
          } else {
            await updateQuantity(existingItem.id, newQuantity);
          }
        }
        return;
      }

      if (user) {
        // Add to server cart for authenticated users
        const res = await fetch(`${API_BASE}/api/cart`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId: product.id,
            quantity: quantity,
            variantId: variant?.id,
          }),
        });

        if (!res.ok) {
          if (res.status === 401) {
            Alert.alert('Login Required', 'Please login to add items to your cart');
            return;
          }
          throw new Error('Failed to add to cart');
        }

        // Refresh cart from server
        await fetchCart();
      } else {
        // Add to local cart for guest users
        const cartItem = {
          id: Date.now(), // Generate unique ID
          productId: product.id,
          quantity: quantity,
          product: {
            id: product.id,
            name: product.name || 'Product',
            price: variant ? variant.price : product.price,
            imageUrl: product.imageUrl || product.image || 'https://placehold.co/200x200?text=Product',
            selectedVariant: product.selectedVariant,
            selectedColor: product.selectedColor,
            selectedSize: product.selectedSize,
            color: product.color,
            size: product.size
          },
          variant: variant || product.selectedVariant
        };
        
        setGuestCart(prev => {
          const existingItem = prev.find(item => {
            const sameProduct = item.productId === product.id;
            const sameVariant = JSON.stringify(item.variant) === JSON.stringify(cartItem.variant);
            return sameProduct && sameVariant;
          });
          
          let newCart;
          if (existingItem) {
            newCart = prev.map(item => {
              const sameProduct = item.productId === product.id;
              const sameVariant = JSON.stringify(item.variant) === JSON.stringify(cartItem.variant);
              if (sameProduct && sameVariant) {
                return { ...item, quantity: item.quantity + quantity };
              }
              return item;
            });
          } else {
            newCart = [...prev, cartItem];
          }
          
          return newCart;
        });
      }
      
      console.log('Product added to cart successfully');
    } catch (err) {
      console.error('Error adding to cart:', err);
      if (showAlert) {
        Alert.alert('Error', 'Failed to add item to cart');
      }
    }
  };

  // Remove from cart with server sync
  const removeFromCart = async (itemId, showAlert = true) => {
    try {
      if (user) {
        // Remove from server cart
        const res = await fetch(`${API_BASE}/api/cart/${itemId}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            Alert.alert('Login Required', 'Please login to manage your cart');
            return;
          }
          throw new Error('Failed to remove from cart');
        }

        // Refresh cart from server
        await fetchCart();
      } else {
        // Remove from local cart
        setGuestCart(prev => {
          const updatedCart = prev.filter(item => item.id !== itemId);
          return updatedCart;
        });
      }
      
      console.log('Item removed from cart successfully');
    } catch (err) {
      console.error('Error removing from cart:', err);
      if (showAlert) {
        Alert.alert('Error', 'Failed to remove item from cart');
      }
    }
  };

  // Update quantity with server sync
  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) return;
    
    try {
      if (user) {
        // Update server cart
        const res = await fetch(`${API_BASE}/api/cart/${itemId}`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ quantity }),
        });

        if (!res.ok) {
          if (res.status === 401) {
            Alert.alert('Login Required', 'Please login to update your cart');
            return;
          }
          throw new Error('Failed to update cart');
        }

        // Refresh cart from server
        await fetchCart();
      } else {
        // Update local cart
        setGuestCart(prev => {
          const updatedCart = prev.map(item =>
            item.id === itemId ? { ...item, quantity } : item
          );
          return updatedCart;
        });
      }
      
      console.log('Quantity updated successfully');
    } catch (err) {
      console.error('Error updating quantity:', err);
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  // Clear cart with server sync
  const clearCart = async () => {
    try {
      if (user) {
        // Clear server cart
        const res = await fetch(`${API_BASE}/api/cart/clear`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            Alert.alert('Login Required', 'Please login to clear your cart');
            return;
          }
          throw new Error('Failed to clear cart');
        }
      }
      
      // Clear local state and storage
      setCartItems([]);
      setGuestCart([]);
      await AsyncStorage.removeItem(GUEST_CART_KEY);
      console.log('Cart cleared successfully');
    } catch (err) {
      console.error('Error clearing cart:', err);
      Alert.alert('Error', 'Failed to clear cart');
    }
  };

  // Remove specific items from cart
  const removeCartItems = async (itemIds) => {
    console.log('=== removeCartItems DEBUG START ===');
    console.log('removeCartItems called with:', itemIds);
    console.log('Current cart items:', cartItems.map(item => ({ id: item.id, name: item.product.name })));
    console.log('User authenticated:', !!user);

    if (user) {
      // For logged-in users, use the bulk delete endpoint
      try {
        const numericIds = itemIds.map(id => Number(id)).filter(id => !isNaN(id));
        console.log('Original itemIds:', itemIds);
        console.log('Converted to numeric IDs:', numericIds);
        console.log('Calling bulk delete API with IDs:', numericIds);

        const response = await fetch(`${API_BASE}/api/cart/bulk-delete`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
          body: JSON.stringify({ itemIds: numericIds }),
        });

        console.log('Bulk delete response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Bulk delete failed with response:', errorText);
          throw new Error(`Failed to remove cart items: ${response.status}`);
        }

        const result = await response.json();
        console.log('Bulk delete result:', result);

        // Refresh cart data
        await fetchCart();

        console.log('=== removeCartItems DEBUG END (SUCCESS) ===');
      } catch (error) {
        console.error('Error bulk deleting cart items:', error);
        console.log('=== removeCartItems DEBUG END (ERROR) ===');
        Alert.alert('Error removing items', 'Failed to remove some items from cart');
      }
    } else {
      // For guests, compare IDs as strings
      console.log('Guest cart before removal:', guestCart.map(item => ({ id: item.id, name: item.product.name })));
      setGuestCart(prev => {
        const itemIdsAsStrings = itemIds.map(String);
        console.log('IDs to remove (as strings):', itemIdsAsStrings);

        const newCart = prev.filter(item => {
          const itemIdAsString = String(item.id);
          const shouldKeep = !itemIdsAsStrings.includes(itemIdAsString);
          console.log(`Item ${item.product.name} (id: ${itemIdAsString}) should keep: ${shouldKeep}`);
          return shouldKeep;
        });

        console.log('Guest cart after removal:', newCart.map(item => ({ id: item.id, name: item.product.name })));
        console.log('=== removeCartItems DEBUG END (GUEST SUCCESS) ===');
        return newCart;
      });
    }
  };

  // Validate cart items
  const validateCart = async () => {
    if (!user) return true; // No validation needed for guest users
    
    try {
      const res = await fetch(`${API_BASE}/api/cart/validate`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error('Cart validation failed');
      }

      const result = await res.json();

      if (result.invalid && result.invalid.length > 0) {
        // Remove invalid items
        for (const item of result.invalid) {
          const invalidCartItem = cartItems.find(
            (ci) =>
              ci.product.id === item.productId &&
              (!item.variantId || ci.variant?.id === item.variantId)
          );

          if (invalidCartItem?.id) {
            await removeFromCart(invalidCartItem.id, false);
          }
        }

        Alert.alert(
          'Cart Updated',
          'Some items in your cart are no longer available and have been removed.'
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating cart:', error);
      return false;
    }
  };

  // Clean up invalid cart items
  const cleanupInvalidCartItems = async () => {
    if (!user) {
      return true; // No cleanup needed for unauthenticated users
    }

    try {
      // First validate to identify invalid items
      const response = await fetch(`${API_BASE}/api/cart/validate`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Cart validation failed');
      }

      const result = await response.json();

      if (result.invalid && result.invalid.length > 0) {
        // Show notification about cleanup action
        Alert.alert(
          'Cart Updated',
          'Some items in your cart were no longer available and have been removed. Please review your updated cart.'
        );

        // Process each invalid item
        let cleanupSuccessful = true;

        for (const item of result.invalid) {
          if (item.id) {
            try {
              // Remove the invalid item directly using its ID
              const deleteResponse = await fetch(`${API_BASE}/api/cart/${item.id}`, {
                method: 'DELETE',
                credentials: 'include',
              });

              if (!deleteResponse.ok) {
                cleanupSuccessful = false;
              }
            } catch (error) {
              cleanupSuccessful = false;
            }
          } else {
            // If the item doesn't have an ID, try to find it by product ID
            const invalidCartItem = cartItems.find(
              (ci) =>
                ci.product.id === item.productId &&
                (!item.variantId || ci.variant?.id === item.variantId)
            );

            if (invalidCartItem?.id) {
              try {
                const deleteResponse = await fetch(`${API_BASE}/api/cart/${Number(invalidCartItem.id)}`, {
                  method: 'DELETE',
                  credentials: 'include',
                });

                if (!deleteResponse.ok) {
                  cleanupSuccessful = false;
                }
              } catch (error) {
                cleanupSuccessful = false;
              }
            } else {
              cleanupSuccessful = false;
            }
          }
        }

        // Refresh cart data after cleanup
        await fetchCart();

        if (!cleanupSuccessful) {
          return false;
        }
      }

      return true; // Cleanup succeeded or no invalid items found
    } catch (error) {
      return false;
    }
  };

  // Buy now functionality
  const buyNow = async (product, quantity = 1, variant = null) => {
    console.log('buyNow called in cart context with:', {
      productId: product.id,
      quantity,
      variantId: variant?.id,
      hasVariant: !!variant,
    });

    if (isUserLoading) {
      Alert.alert('Please wait', 'We\'re preparing your purchase');
      return;
    }

    if (!user) {
      // Redirect to auth page if not logged in
      Alert.alert('Please log in', 'You need to be logged in to make a purchase');
      // Note: In React Native, you'd navigate to auth screen here
      return;
    }

    // Only buyers can purchase
    if (user.role !== 'buyer') {
      Alert.alert(
        'Action Not Allowed',
        'Only buyers can make purchases. Please switch to a buyer account.'
      );
      return;
    }

    // Check for available stock
    const availableStock = variant?.stock ?? product.stock ?? 0;
    if (availableStock <= 0) {
      Alert.alert('Out of Stock', 'This product is currently out of stock.');
      return;
    }

    // Limit quantity to available stock
    const requestedQuantity = Math.min(quantity, availableStock);
    if (requestedQuantity < quantity) {
      Alert.alert(
        'Limited Stock',
        `Only ${availableStock} units available. Proceeding with maximum available quantity.`
      );
    }

    // Validate that the product ID is valid
    if (!product || !product.id || typeof product.id !== 'number' || isNaN(product.id)) {
      Alert.alert('Invalid Product', 'The selected product cannot be purchased.');
      return;
    }

    // Check if product has variants but none are selected
    if ((product.hasVariants || (product.variants && product.variants.length > 0)) && !variant) {
      Alert.alert(
        'Selection Required',
        'Please select product options before proceeding to checkout'
      );
      return;
    }

    try {
      // Use direct fetch API for more explicit control over the buy now process
      const response = await fetch(`${API_BASE}/api/cart`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: requestedQuantity,
          variantId: variant?.id,
          buyNow: true, // Signal to the server this is a buy now request
        }),
      });

      if (!response.ok) {
        // Handle error response
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      // Get the response data
      const cartItem = await response.json();
      console.log('Successfully added to cart:', cartItem);

      // Force refresh cart data
      await fetchCart();

      // Show success message
      Alert.alert(
        'Added to cart',
        `${product.name}${variant ? ` (${variant.color || ''}${variant.size ? `, ${variant.size}` : ''})` : ''} has been added to your cart`
      );

      // Note: In React Native, you'd navigate to checkout here
      // navigation.navigate('OrderSummary', { buyNowProduct: product, buyNowQty: requestedQuantity });
    } catch (error) {
      console.error('Buy Now error:', error);
      Alert.alert(
        'Purchase Failed',
        error instanceof Error ? error.message : 'An error occurred while processing your purchase'
      );
    }
  };

  // Handle post-login cart sync
  const handlePostLoginCartSync = async () => {
    try {
      // Fetch cart from server after login
      await fetchCart();
    } catch (error) {
      console.error('Error syncing cart after login:', error);
    }
  };

  // Refresh cart (for debugging)
  const refreshCart = async () => {
    await fetchCart();
  };

  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      loading,
      fetchCart,
      refreshCart,
      totalCartItems,
      validateCart,
      cleanupInvalidCartItems,
      removeCartItems,
      buyNow,
      handlePostLoginCartSync,
      user,
      isUserLoading
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 