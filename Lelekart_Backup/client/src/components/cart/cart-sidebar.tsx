import { useEffect, useRef } from "react";
import { X, Minus, Plus, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/cart-context";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function CartSidebar() {
  const { isOpen, toggleCart, cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
  // Temporarily remove authentication dependency
  const user = null;
  const { toast } = useToast();
  const cartRef = useRef<HTMLDivElement>(null);
  
  // Calculate subtotal, discount and total (using variant price if available)
  const subtotal = cartItems.reduce((total, item) => {
    // Use variant price if available, otherwise use product price
    const itemPrice = item.variant?.price || item.product.price;
    return total + (itemPrice * item.quantity);
  }, 0);
  const discount = Math.round(subtotal * 0.05); // 5% discount for example
  // Always set shipping to 0 (FREE shipping)
  const shipping = 0;
  const total = subtotal - discount;

  // Checkout mutation
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/orders", {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      clearCart();
      toast({
        title: "Order placed successfully!",
        description: "Thank you for your purchase.",
        variant: "default",
      });
      toggleCart();
    },
    onError: (error: Error) => {
      toast({
        title: "Checkout failed",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Format price in Indian Rupees
  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  // Handle checkout
  const handleCheckout = () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to checkout",
        variant: "destructive",
      });
      return;
    }
    
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before checkout",
        variant: "destructive",
      });
      return;
    }

    checkoutMutation.mutate();
  };

  // Close cart when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cartRef.current && !cartRef.current.contains(event.target as Node) && isOpen) {
        toggleCart();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, toggleCart]);

  // Prevent body scroll when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div 
        ref={cartRef}
        className="w-full md:w-96 bg-white shadow-lg h-full flex flex-col animate-in slide-in-from-right duration-300"
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Shopping Cart ({cartItems.length})</h3>
          <Button variant="ghost" size="icon" onClick={toggleCart}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex-grow overflow-y-auto p-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <AlertCircle className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500">Your cart is empty</p>
              <Button 
                variant="outline"
                className="mt-4"
                onClick={toggleCart}
              >
                Continue Shopping
              </Button>
            </div>
          ) : (
            cartItems.map((item) => (
              <Card key={`${item.product.id}-${item.variant?.id || 'main'}`} className="mb-4">
                <CardContent className="p-3">
                  <div className="flex">
                    <img 
                      src={item.variant?.images ? 
                            JSON.parse(item.variant.images as string)[0] || item.product.imageUrl 
                            : item.product.imageUrl} 
                      alt={item.product.name} 
                      className="w-20 h-20 object-contain rounded" 
                    />
                    <div className="ml-4 flex-grow">
                      <h4 className="font-medium text-sm">{item.product.name}</h4>
                      
                      {/* Show variant details if available */}
                      {item.variant && (
                        <div className="text-xs text-gray-600 mt-1">
                          <span className="inline-block px-2 py-1 bg-gray-100 rounded-sm mr-1">
                            {item.variant.color || 'Default'}
                          </span>
                          <span className="inline-block px-2 py-1 bg-gray-100 rounded-sm">
                            {item.variant.size || 'Default'}
                          </span>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500 mt-1">
                        {item.product.category}
                      </div>
                      
                      <div className="text-green-600 font-medium mt-1">
                        {formatPrice(item.variant?.price || item.product.price)}
                      </div>
                      
                      <div className="flex items-center mt-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-6 w-6 rounded-l" 
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 h-6 bg-white flex items-center justify-center text-sm border-t border-b">
                          {item.quantity}
                        </span>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-6 w-6 rounded-r" 
                          onClick={() => {
                            // Check stock limits against available stock
                            const availableStock = item.variant?.stock || item.product.stock || 999;
                            updateQuantity(item.id, Math.min(availableStock, item.quantity + 1));
                          }}
                          disabled={item.variant?.stock ? item.quantity >= item.variant.stock : 
                                   item.product.stock ? item.quantity >= item.product.stock : false}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="ml-auto text-red-500 text-xs h-6 px-2"
                          onClick={() => removeFromCart(item.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        
        {cartItems.length > 0 && (
          <div className="border-t p-4">
            <div className="flex justify-between mb-3">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between mb-3">
              <span className="text-gray-600">Discount:</span>
              <span className="text-green-600">- {formatPrice(discount)}</span>
            </div>
            <div className="flex justify-between mb-4">
              <span className="text-gray-600">Delivery:</span>
              <span className="text-green-600">FREE</span>
            </div>
            <Separator className="my-3" />
            <div className="flex justify-between mb-4 text-lg font-bold">
              <span>Total:</span>
              <span>{formatPrice(total)}</span>
            </div>
            <Button 
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-2xl rounded-lg font-extrabold shadow-lg mt-4 mb-2 border-4 border-orange-300"
              onClick={handleCheckout}
              disabled={checkoutMutation.isPending}
            >
              {checkoutMutation.isPending ? "Processing..." : "Proceed to Checkout"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
