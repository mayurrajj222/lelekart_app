import { Product, User } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { CartContext } from "@/context/cart-context";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { apiRequest } from "@/lib/queryClient";
import { WishlistButton } from "./wishlist-button";

// Define an extended Product interface to include image_url
interface ExtendedProduct extends Product {
  image?: string;
  image_url?: string;
}

interface FashionProductCardProps {
  product: ExtendedProduct;
}

export function FashionProductCard({ product }: FashionProductCardProps) {
  const cartContext = useContext(CartContext);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Get user data to check if logged in
  const { data: user } = useQuery<User | null>({
    queryKey: ['/api/user'],
    retry: false,
    staleTime: 60000,
  });

  // Format price in Indian Rupees
  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };
  
  // Strip HTML tags from string
  const stripHtmlTags = (html: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };
  
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Remove login check, allow add to cart for all
    try {
      if (cartContext) {
        cartContext.addToCart(product);
      }
      // Show toast is handled in context
    } catch (error) {
      toast({
        title: "Failed to add to cart",
        description: "There was an error adding the product to your cart",
        variant: "destructive",
      });
    }
  };

  // Use a consistent fashion image for all fashion products
  return (
    <div className="relative">
      {/* Add Wishlist button on top right of card */}
      <WishlistButton productId={product.id} variant="card" />
      
      <Card 
        className="product-card h-full flex flex-col items-center p-3 transition-transform duration-200 hover:cursor-pointer hover:shadow-md hover:-translate-y-1 bg-[#F8F5E4] border border-[#e0c9a6] rounded-2xl"
        onClick={() => {
          try {
            console.log(`Navigating to product details page: /product/${product.id}`);
            setLocation(`/product/${product.id}`);
          } catch (e) {
            console.error('Navigation error:', e);
          }
        }}
      >
        <CardContent className="p-0 w-full flex flex-col items-center h-full bg-transparent">
          <div className="w-full flex-shrink-0 h-40 flex items-center justify-center mb-3 bg-[#F8F5E4] rounded-2xl">
            <img
              src="/images/categories/fashion.svg"
              alt={product.name}
              className="max-w-full max-h-full object-contain rounded-xl"
            />
          </div>
          
          <div className="flex flex-col flex-grow w-full">
            <h3 className="font-medium text-center text-sm line-clamp-2 h-10">{product.name}</h3>
            <div className="text-green-600 font-medium mt-1 text-center">{formatPrice(product.price)}</div>
            <div className="text-xs text-gray-500 mt-1 text-center line-clamp-1">{stripHtmlTags(product.description).slice(0, 30)}...</div>
          </div>
          
          <Button
            className="mt-2 w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-bold text-base px-4 py-2 rounded-full shadow-md hover:from-orange-400 hover:to-yellow-400 border-none flex items-center justify-center gap-2"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}