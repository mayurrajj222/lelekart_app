import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import { Product as BaseProduct, User, ProductVariant } from "@shared/schema";

// Extend the Product type to include the isVariant property and variant-related fields
type Product = BaseProduct & {
  isVariant?: boolean;
  parentProductId?: number;
  hasVariants?: boolean;
  variants?: ProductVariant[];
};
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { fbq } from "../lib/metaPixel";

interface CartItem {
  product: Product;
  quantity: number;
  id?: number | string; // Allow both number and string for guest vs logged-in users
  userId?: number;
  variant?: ProductVariant;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (
    product: Product,
    quantity?: number,
    variant?: ProductVariant
  ) => void;
  removeFromCart: (itemId: number | string) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  toggleCart: () => void;
  buyNow: (
    product: Product,
    quantity?: number,
    variant?: ProductVariant
  ) => void;
  validateCart: () => Promise<boolean>;
  cleanupInvalidCartItems: () => Promise<boolean>;
  removeCartItems: (itemIds: (number | string)[]) => void;
}

export const CartContext = createContext<CartContextType | undefined>(
  undefined
);

export function CartProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [guestCart, setGuestCart] = useState<CartItem[]>([]);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Helper: localStorage key
  const GUEST_CART_KEY = "lelekart_guest_cart";

  // Load guest cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(GUEST_CART_KEY);
      if (stored) {
        try {
          setGuestCart(JSON.parse(stored));
        } catch {
          setGuestCart([]);
        }
      }
    }
  }, []);

  // Save guest cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(guestCart));
    }
  }, [guestCart]);

  // Get user data with better error handling and logging
  const {
    data: user,
    error: userError,
    isLoading: isUserLoading,
  } = useQuery<User>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/user", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            // User not authenticated, return null
            return null;
          }
          throw new Error(`Failed to fetch user: ${res.status}`);
        }

        const userData = await res.json();
        return userData;
      } catch (err) {
        console.error("Error fetching user", err);
        // Don't throw, just return null to prevent query from entering error state
        return null;
      }
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Fetch cart items using React Query for real-time updates
  const { data: serverCartItems = [], isLoading: isCartLoading } = useQuery<
    CartItem[]
  >({
    queryKey: ["/api/cart"],
    queryFn: async () => {
      if (!user) {
        return [];
      }

      try {
        // Fetch cart items for logged-in user
        const res = await fetch("/api/cart", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            // Handle auth error gracefully by returning empty cart
            return [];
          }
          throw new Error(`Failed to fetch cart: ${res.status}`);
        }

        const cartData = await res.json();
        return cartData;
      } catch (err) {
        // Log error but return empty cart for graceful degradation
        console.error("Error fetching cart", err);
        // Return empty cart on error for graceful degradation
        return [];
      }
    },
    // Only fetch cart if user is logged in
    enabled: !!user && !isUserLoading,
    staleTime: 10000, // 10 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 2,
    retryDelay: 1000,
    // Removed frequent polling to avoid performance issues
  });

  // Merge guest cart into server cart on login
  useEffect(() => {
    const mergeGuestCart = async () => {
      // Only proceed if we have a user and guest cart items
      if (!user || guestCart.length === 0) return;

      try {
        // Show toast to indicate merging process
        toast({
          title: "Merging cart items",
          description: "Adding your items to your account...",
        });

        // Add each guest cart item to server cart sequentially
        for (const item of guestCart) {
          try {
            await apiRequest("POST", "/api/cart", {
              productId: item.product.id,
              quantity: item.quantity,
              variantId: item.variant?.id,
            });
          } catch (error: any) {
            console.error("Error merging cart item:", error);
            // Show error for this specific item but continue with others
            toast({
              title: "Couldn't add item",
              description: `Failed to add ${item.product.name} to your cart: ${error.message}`,
              variant: "destructive",
            });
          }
        }

        // Clear guest cart only after all items are processed
        setGuestCart([]);
        localStorage.removeItem(GUEST_CART_KEY);

        // Refresh server cart data
        await queryClient.invalidateQueries({ queryKey: ["/api/cart"] });

        // Show success message
        toast({
          title: "Cart merged successfully",
          description: "Your items have been added to your account",
        });
      } catch (error) {
        console.error("Error during cart merge:", error);
        toast({
          title: "Error merging cart",
          description: "Some items may not have been added to your cart",
          variant: "destructive",
        });
      }
    };

    // Call the merge function
    mergeGuestCart();
  }, [user, queryClient]);

  // Helper: get current cart items (guest or server)
  const cartItems = user ? serverCartItems : guestCart;

  // Add to cart API mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({
      productId,
      quantity,
      variantId,
    }: {
      productId: number;
      quantity: number;
      variantId?: number;
    }) => {
      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
          body: JSON.stringify({
            productId,
            quantity,
            variantId,
          }),
        });

        if (!res.ok) {
          if (res.status === 401) {
            // Handle authentication error
            toast({
              title: "Authentication Required",
              description: "Please log in to add items to your cart",
              variant: "destructive",
            });

            // Redirect to auth page
            setTimeout(() => navigate("/auth"), 1500);
            throw new Error("Authentication required");
          }

          const errorData = await res.json();
          throw new Error(errorData.error || `Server error: ${res.status}`);
        }

        return res.json();
      } catch (error) {
        console.error("Error in addToCartMutation:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Force refresh cart data immediately
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: Error) => {
      // Don't show auth errors as they are already handled in the mutation function
      if (error.message !== "Authentication required") {
        toast({
          title: "Failed to add to cart",
          description: error.message || "An error occurred",
          variant: "destructive",
        });
      }
    },
  });

  // Update cart API mutation
  const updateCartMutation = useMutation({
    mutationFn: async ({
      cartItemId,
      quantity,
    }: {
      cartItemId: number;
      quantity: number;
    }) => {
      try {
        const res = await fetch(`/api/cart/${cartItemId}`, {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
          body: JSON.stringify({
            quantity,
          }),
        });

        if (!res.ok) {
          if (res.status === 401) {
            // Handle authentication error
            toast({
              title: "Authentication Required",
              description: "Please log in to update your cart",
              variant: "destructive",
            });

            // Redirect to auth page
            setTimeout(() => navigate("/auth"), 1500);
            throw new Error("Authentication required");
          }

          const errorData = await res.json();
          throw new Error(errorData.error || `Server error: ${res.status}`);
        }

        return res.json();
      } catch (error) {
        console.error("Error in updateCartMutation:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Force refresh cart data immediately
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: Error) => {
      // Don't show auth errors as they are already handled in the mutation function
      if (error.message !== "Authentication required") {
        toast({
          title: "Failed to update cart",
          description: error.message || "An error occurred",
          variant: "destructive",
        });
      }
    },
  });

  // Remove from cart API mutation
  const removeFromCartMutation = useMutation({
    mutationFn: async (cartItemId: number) => {
      try {
        const res = await fetch(`/api/cart/${cartItemId}`, {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            // Handle authentication error
            toast({
              title: "Authentication Required",
              description: "Please log in to manage your cart",
              variant: "destructive",
            });

            // Redirect to auth page
            setTimeout(() => navigate("/auth"), 1500);
            throw new Error("Authentication required");
          }

          // Try to get error details if possible
          const errorData = await res
            .json()
            .catch(() => ({ error: `Server error: ${res.status}` }));
          throw new Error(errorData.error || `Server error: ${res.status}`);
        }

        // Some DELETE endpoints don't return JSON, handle that gracefully
        return res.json().catch(() => ({}));
      } catch (error) {
        console.error("Error in removeFromCartMutation:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Force refresh cart data immediately
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: Error) => {
      // Don't show auth errors as they are already handled in the mutation function
      if (error.message !== "Authentication required") {
        toast({
          title: "Failed to remove item",
          description: error.message || "An error occurred",
          variant: "destructive",
        });
      }
    },
  });

  // Add to cart function (for both guest and logged-in users)
  const addToCart = async (
    product: Product,
    quantity = 1,
    variant?: ProductVariant
  ) => {
    // Fire Meta Pixel AddToCart event
    fbq("track", "AddToCart", {
      content_name: product.name,
      content_ids: [product.id],
      content_type: "product",
      value: variant ? variant.price : product.price,
      currency: "INR",
      ...(variant && {
        variant_id: variant.id,
        variant_color: variant.color,
        variant_size: variant.size,
      }),
    });
    // Check if user is logged in
    if (user) {
      // User is logged in, use server-side cart
      try {
        await addToCartMutation.mutateAsync({
          productId: product.id,
          quantity,
          variantId: variant?.id,
        });
        toast({
          title: "Added to cart",
          description: `${product.name} has been added to your cart`,
        });
      } catch (error) {
        // Error toast is handled in mutation's onError
      }
    } else {
      // User is a guest, use local storage cart
      setGuestCart((prevCart) => {
        const existingItemIndex = prevCart.findIndex(
          (item) =>
            item.product.id === product.id && item.variant?.id === variant?.id
        );

        let newCart;
        if (existingItemIndex > -1) {
          // Update quantity if item exists
          newCart = [...prevCart];
          newCart[existingItemIndex].quantity += quantity;
        } else {
          // Add new item to cart
          const newItem: CartItem = {
            product,
            quantity,
            variant,
            // Use a string ID for guest cart items
            id: `${Date.now()}_${Math.random()}`,
          };
          newCart = [...prevCart, newItem];
        }

        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(newCart));
        return newCart;
      });

      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
      });
    }
  };

  // Remove from cart function
  const removeFromCart = (itemId: number | string) => {
    if (user) {
      removeFromCartMutation.mutate(Number(itemId), {
        onSuccess: () => {
          toast({
            title: "Item removed",
            description: "The item has been removed from your cart",
          });
        },
        onError: (error: Error) => {
          toast({
            title: "Failed to remove item",
            description: error.message || "An error occurred",
            variant: "destructive",
          });
        },
      });
    } else {
      // Guest cart: itemId is the index
      setGuestCart((prevCart) => {
        const newCart = prevCart.filter((_, index) => index !== Number(itemId));
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(newCart));
        return newCart;
      });
      toast({
        title: "Item removed",
        description: "The item has been removed from your cart",
      });
    }
  };

  // Update quantity function
  const updateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    if (user) {
      // Optimistically update the cart in the UI
      const prevCart = [...serverCartItems];
      const cartItemIdx = serverCartItems.findIndex(
        (item) => item.id === itemId
      );
      if (cartItemIdx > -1) {
        const updatedCart = [...serverCartItems];
        updatedCart[cartItemIdx] = {
          ...updatedCart[cartItemIdx],
          quantity: newQuantity,
        };
        queryClient.setQueryData(["/api/cart"], updatedCart);
      }
      // Send update to server
      updateCartMutation.mutate(
        { cartItemId: itemId, quantity: newQuantity },
        {
          onError: () => {
            // Roll back to previous cart if server call fails
            queryClient.setQueryData(["/api/cart"], prevCart);
          },
        }
      );
    } else {
      // Guest cart: itemId is the index
      setGuestCart((prevCart) => {
        const newCart = prevCart.map((item, index) => {
          if (index === Number(itemId)) {
            return { ...item, quantity: newQuantity };
          }
          return item;
        });
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(newCart));
        return newCart;
      });
    }
  };

  // Clear cart API mutation
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      if (user) {
        await apiRequest("POST", "/api/cart/clear", {});
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to clear cart",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const clearCart = async () => {
    if (user) {
      try {
        await clearCartMutation.mutateAsync();
        toast({
          title: "Cart cleared",
          description: "All items have been removed from your cart",
        });
      } catch (error: any) {
        toast({
          title: "Failed to clear cart",
          description: error.message || "An error occurred",
          variant: "destructive",
        });
      }
    } else {
      setGuestCart([]);
      localStorage.removeItem(GUEST_CART_KEY);
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart",
      });
    }
  };

  // Remove specific items from cart
  const removeCartItems = async (itemIds: (number | string)[]) => {
    console.log("=== removeCartItems DEBUG START ===");
    console.log("removeCartItems called with:", itemIds);
    console.log(
      "Current cart items:",
      cartItems.map((item) => ({ id: item.id, name: item.product.name }))
    );
    console.log("User authenticated:", !!user);

    if (user) {
      // For logged-in users, use the new bulk delete endpoint
      try {
        const numericIds = itemIds
          .map((id) => Number(id))
          .filter((id) => !isNaN(id));
        console.log("Original itemIds:", itemIds);
        console.log("Converted to numeric IDs:", numericIds);
        console.log("Calling bulk delete API with IDs:", numericIds);

        const response = await fetch("/api/cart/bulk-delete", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
          body: JSON.stringify({ itemIds: numericIds }),
        });

        console.log("Bulk delete response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Bulk delete failed with response:", errorText);
          throw new Error(`Failed to remove cart items: ${response.status}`);
        }

        const result = await response.json();
        console.log("Bulk delete result:", result);

        // Refresh cart data to get updated state from server
        console.log("Invalidating cart cache to refresh from server");
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });

        console.log("=== removeCartItems DEBUG END (SUCCESS) ===");
      } catch (error) {
        console.error("Error bulk deleting cart items:", error);
        console.log("=== removeCartItems DEBUG END (ERROR) ===");
        toast({
          title: "Error removing items",
          description: "Failed to remove some items from cart",
          variant: "destructive",
        });
      }
    } else {
      // For guests, compare IDs as strings
      console.log(
        "Guest cart before removal:",
        guestCart.map((item) => ({ id: item.id, name: item.product.name }))
      );
      setGuestCart((prevCart) => {
        const itemIdsAsStrings = itemIds.map(String);
        console.log("IDs to remove (as strings):", itemIdsAsStrings);

        const newCart = prevCart.filter((item) => {
          const itemIdAsString = String(item.id);
          const shouldKeep = !itemIdsAsStrings.includes(itemIdAsString);
          console.log(
            `Item ${item.product.name} (id: ${itemIdAsString}) should keep: ${shouldKeep}`
          );
          return shouldKeep;
        });

        console.log(
          "Guest cart after removal:",
          newCart.map((item) => ({ id: item.id, name: item.product.name }))
        );
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(newCart));
        console.log("=== removeCartItems DEBUG END (GUEST SUCCESS) ===");
        return newCart;
      });
    }
  };

  // Toggle cart sidebar visibility
  const toggleCart = () => {
    setIsOpen((prev) => !prev);
  };

  // Buy now functionality (add to cart and redirect to checkout)
  const buyNow = async (
    product: Product,
    quantity = 1,
    variant?: ProductVariant
  ) => {
    // Handle buy now flow for direct purchase
    console.log("buyNow called in cart context with:", {
      productId: product.id,
      quantity,
      variantId: variant?.id,
      hasVariant: !!variant,
    });

    if (isUserLoading) {
      toast({
        title: "Please wait",
        description: "We're preparing your purchase",
        variant: "default",
      });
      return;
    }

    if (!user) {
      // Redirect to auth page if not logged in
      toast({
        title: "Please log in",
        description: "You need to be logged in to make a purchase",
        variant: "default",
      });
      navigate("/auth");
      return;
    }

    // Only buyers can purchase
    if (user.role !== "buyer") {
      toast({
        title: "Action Not Allowed",
        description:
          "Only buyers can make purchases. Please switch to a buyer account.",
        variant: "destructive",
      });
      return;
    }

    // Check for available stock
    const availableStock = variant?.stock ?? product.stock ?? 0;
    if (availableStock <= 0) {
      toast({
        title: "Out of Stock",
        description: "This product is currently out of stock.",
        variant: "destructive",
      });
      return;
    }

    // Limit quantity to available stock
    const requestedQuantity = Math.min(quantity, availableStock);
    if (requestedQuantity < quantity) {
      toast({
        title: "Limited Stock",
        description: `Only ${availableStock} units available. Proceeding with maximum available quantity.`,
        variant: "default",
      });
    }

    // Validate that the product ID is valid
    if (
      !product ||
      !product.id ||
      typeof product.id !== "number" ||
      isNaN(product.id)
    ) {
      toast({
        title: "Invalid Product",
        description: "The selected product cannot be purchased.",
        variant: "destructive",
      });
      return;
    }

    // Check if product has variants but none are selected
    if (
      (product.hasVariants ||
        (product.variants && product.variants.length > 0)) &&
      !variant
    ) {
      toast({
        title: "Selection Required",
        description:
          "Please select product options before proceeding to checkout",
        variant: "default",
      });

      // Don't proceed - user needs to select variant first
      return;
    }

    try {
      // Use direct fetch API for more explicit control over the buy now process
      // This avoids race conditions with React Query and ensures the cart item is created
      const response = await fetch("/api/cart", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
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
      console.log("Successfully added to cart:", cartItem);

      // Force refresh cart data
      await queryClient.invalidateQueries({ queryKey: ["/api/cart"] });

      // Show success message
      toast({
        title: "Added to cart",
        description: `${product.name}${variant ? ` (${variant.color || ""}${variant.size ? `, ${variant.size}` : ""})` : ""} has been added to your cart`,
        variant: "default",
      });

      // Redirect to checkout with buynow parameter
      setTimeout(() => {
        window.location.href = "/checkout?buynow=true";
      }, 500); // Increased delay to ensure server processing completes
    } catch (error) {
      console.error("Buy Now error:", error);
      toast({
        title: "Purchase Failed",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while processing your purchase",
        variant: "destructive",
      });
    }
  };

  // Cart validation function
  const validateCart = async (): Promise<boolean> => {
    // Check if cart validation is needed
    if (!user) {
      return true; // No validation needed for unauthenticated users
    }

    try {
      const response = await fetch("/api/cart/validate", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Cart validation failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.invalid && result.invalid.length > 0) {
        // Show notifications about invalid items
        toast({
          title: "Cart Updated",
          description:
            "Some items in your cart are no longer available and will be removed.",
          variant: "destructive",
        });

        // Auto-remove invalid items from cart
        for (const item of result.invalid) {
          // Find the cart item with this product ID
          const invalidCartItem = cartItems.find(
            (ci) =>
              ci.product.id === item.productId &&
              (!item.variantId || ci.variant?.id === item.variantId)
          );

          if (invalidCartItem?.id) {
            // Remove the invalid item from cart
            removeFromCart(invalidCartItem.id);

            toast({
              title: "Item Removed",
              description: `${invalidCartItem.product.name} was removed from your cart (${item.error})`,
              variant: "destructive",
            });
          }
        }

        // After cleanup, cart is still considered invalid
        return false;
      }

      // Validation passed successfully
      return true;
    } catch (error) {
      // Log error but return false for validation
      console.error("Error validating cart:", error);
      return false;
    }
  };

  // New function to clean up invalid cart items
  const cleanupInvalidCartItems = async (): Promise<boolean> => {
    if (!user) {
      return true; // No cleanup needed for unauthenticated users
    }

    try {
      // First validate to identify invalid items
      const response = await fetch("/api/cart/validate", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Cart validation failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.invalid && result.invalid.length > 0) {
        // Show notification about cleanup action
        toast({
          title: "Cart Updated",
          description:
            "Some items in your cart were no longer available and have been removed. Please review your updated cart.",
          variant: "destructive",
        });

        // Process each invalid item
        let cleanupSuccessful = true;

        for (const item of result.invalid) {
          if (item.id) {
            try {
              // Remove the invalid item directly using its ID
              const deleteResponse = await fetch(`/api/cart/${item.id}`, {
                method: "DELETE",
                credentials: "include",
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
                const deleteResponse = await fetch(
                  `/api/cart/${Number(invalidCartItem.id)}`,
                  {
                    method: "DELETE",
                    credentials: "include",
                  }
                );

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
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });

        if (!cleanupSuccessful) {
          return false;
        }
      }

      return true; // Cleanup succeeded or no invalid items found
    } catch (error) {
      return false;
    }
  };

  const contextValue: CartContextType = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isOpen,
    toggleCart,
    buyNow,
    validateCart,
    cleanupInvalidCartItems,
    removeCartItems, // add to context
  };

  return (
    <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
