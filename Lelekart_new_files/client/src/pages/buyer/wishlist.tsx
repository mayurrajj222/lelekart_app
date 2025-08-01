import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Trash2, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Define the product type for wishlist items
interface WishlistProduct {
  id: number;
  product: {
    id: number;
    name: string;
    description: string;
    price: number;
    salePrice?: number;
    imageUrl: string;
    images?: string; // JSON string of images
    category: string;
    stock: number;
  };
  userId: number;
  dateAdded: string;
}

export default function BuyerWishlistPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch wishlist data
  const { data: wishlistItems = [], isLoading: isLoadingWishlist } = useQuery<WishlistProduct[]>({
    queryKey: ['/api/wishlist'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/wishlist');
        return res.json();
      } catch (error) {
        console.error('Error fetching wishlist:', error);
        return [];
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Remove item from wishlist mutation
  const removeFromWishlistMutation = useMutation({
    mutationFn: async (productId: number) => {
      const res = await apiRequest('DELETE', `/api/wishlist/${productId}`);
      if (!res.ok) {
        throw new Error('Failed to remove item from wishlist');
      }
    },
    onSuccess: () => {
      // Invalidate wishlist query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
      toast({
        title: "Item removed",
        description: "The item has been removed from your wishlist",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle add to cart
  const addToCartMutation = useMutation({
    mutationFn: async (product: WishlistProduct["product"]) => {
      const res = await apiRequest('POST', '/api/cart', {
        productId: product.id,
        quantity: 1,
      });
      
      if (!res.ok) {
        throw new Error('Failed to add item to cart');
      }
      
      return product;
    },
    onSuccess: (product) => {
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
      });
      // Refresh cart data if needed
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive", 
      });
    }
  });
  
  const handleAddToCart = (product: WishlistProduct["product"]) => {
    addToCartMutation.mutate(product);
  };

  return (
    <div className="min-h-screen bg-[#F8F5E4]">
      <DashboardLayout>
        <div className="w-full">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">My Wishlist</h1>
          </div>

          {isLoadingWishlist ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : wishlistItems.length === 0 ? (
            <div className="text-center py-10 border rounded-lg bg-[#F8F5E4]">
              <div className="mb-4">
                <svg className="w-16 h-16 mx-auto text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Your wishlist is empty</h3>
              <p className="text-muted-foreground mb-6">Items added to your wishlist will be saved here</p>
              <Button asChild>
                <Link href="/">Continue Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlistItems.map((item) => (
                <Card key={item.product.id} className="border shadow-sm bg-[#F8F5E4]">
                  <div className="relative h-48 bg-slate-100">
                    <Link href={`/product/${item.product.id}`}>
                      {item.product.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="h-full w-full object-contain object-center"
                          onError={(e) => {
                            // Set a fallback image if the product image fails to load
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300?text=No+Image';
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-200">
                          <span className="text-sm text-slate-500">No image available</span>
                        </div>
                      )}
                    </Link>
                  </div>
                  <CardContent className="p-4">
                    <Link href={`/product/${item.product.id}`}>
                      <h3 className="font-medium line-clamp-2 hover:text-primary transition-colors">{item.product.name}</h3>
                    </Link>
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="font-semibold">₹{item.product.salePrice || item.product.price}</span>
                      {item.product.salePrice && (
                        <>
                          <span className="text-sm text-muted-foreground line-through">₹{item.product.price}</span>
                          <span className="text-sm text-green-600">
                            {Math.round(((item.product.price - item.product.salePrice) / item.product.price) * 100)}% off
                          </span>
                        </>
                      )}
                    </div>
                    <div className="mt-4 flex space-x-2">
                      <Button
                        className="flex-1"
                        onClick={() => handleAddToCart(item.product)}
                        disabled={item.product.stock <= 0 || addToCartMutation.isPending}
                      >
                        {addToCartMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ShoppingCart className="mr-2 h-4 w-4" />
                        )}
                        {item.product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removeFromWishlistMutation.mutate(item.product.id)}
                        disabled={removeFromWishlistMutation.isPending}
                      >
                        {removeFromWishlistMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </div>
  );
}