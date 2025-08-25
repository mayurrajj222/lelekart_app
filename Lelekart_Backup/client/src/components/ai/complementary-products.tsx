import React, { useEffect, useState } from "react";
import { useAIAssistant } from "@/context/ai-assistant-context";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Loader2, Package, Plus, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";

interface ComplementaryProductsProps {
  productId: number;
  productName: string;
  productImage: string;
  productPrice: number;
}

// Safe wrapper component that handles cart context errors gracefully
export const ComplementaryProducts: React.FC<ComplementaryProductsProps> = (props) => {
  const [hasError, setHasError] = useState(false);
  
  // If we already detected an error with the cart context, show fallback UI
  if (hasError) {
    return (
      <div className="p-4 border rounded bg-gray-50">
        <h2 className="font-medium text-xl mb-2">Frequently Bought Together</h2>
        <p className="text-gray-500 text-sm">Loading product recommendations...</p>
      </div>
    );
  }
  
  // Try to render the inner component, but catch any errors that occur
  try {
    return <ComplementaryProductsInner {...props} onError={() => setHasError(true)} />;
  } catch (error) {
    // If an error occurs during render, update state and show fallback
    console.error("Error rendering ComplementaryProducts:", error);
    setHasError(true);
    
    return (
      <div className="p-4 border rounded bg-gray-50">
        <h2 className="font-medium text-xl mb-2">Frequently Bought Together</h2>
        <p className="text-gray-500 text-sm">Loading product recommendations...</p>
      </div>
    );
  }
};

// Inner component that uses cart context
interface ComplementaryProductsInnerProps extends ComplementaryProductsProps {
  onError?: () => void;
}

const ComplementaryProductsInner: React.FC<ComplementaryProductsInnerProps> = ({
  productId,
  productName,
  productImage,
  productPrice,
  onError,
}) => {
  const { getComplementaryProducts } = useAIAssistant();
  
  // Try to use cart context, but handle errors gracefully
  let cart;
  try {
    cart = useCart();
  } catch (error) {
    console.error("Error accessing cart context:", error);
    // Call onError to trigger fallback UI
    if (onError) onError();
    // Return null to prevent further rendering
    return null;
  }
  
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [complementaryProducts, setComplementaryProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [totalPrice, setTotalPrice] = useState(productPrice);

  useEffect(() => {
    setIsLoading(true);
    getComplementaryProducts(productId, 2)
      .then((products) => {
        setComplementaryProducts(products);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [productId, getComplementaryProducts]);

  useEffect(() => {
    // Calculate total price
    let total = productPrice;
    selectedProducts.forEach((selectedId) => {
      const product = complementaryProducts.find((p) => p.id === selectedId);
      if (product) {
        total += product.price;
      }
    });
    setTotalPrice(total);
  }, [selectedProducts, complementaryProducts, productPrice]);

  const toggleProduct = (productId: number) => {
    setSelectedProducts((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const addAllToCart = () => {
    // Add main product - create minimal product object with required fields
    const mainProduct = {
      id: productId,
      name: productName,
      price: productPrice,
      // Include other required fields with default values
      color: null,
      size: null,
      description: "",
      specifications: null,
      sku: null,
      mrp: null,
      purchasePrice: null,
      imageUrl: productImage,
      images: null,
      category: "",
      sellerId: 0,
      approved: true,
      createdAt: new Date(),
      stock: 100 // Add missing stock field
    };
    
    cart.addToCart(mainProduct, 1);

    // Add selected complementary products
    selectedProducts.forEach((id) => {
      const product = complementaryProducts.find(p => p.id === id);
      if (product) {
        cart.addToCart(product, 1);
      }
    });

    toast({
      title: "Items added to cart",
      description: `Added ${1 + selectedProducts.length} items to your cart`,
      variant: "default",
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-muted-foreground text-sm">Finding complementary products...</p>
      </div>
    );
  }

  if (complementaryProducts.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="font-medium text-xl mb-4">Frequently Bought Together</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Main product */}
        <div className="border rounded p-4 flex items-center">
          <div className="w-20 h-20 mr-4">
            <img 
              src={productImage} 
              alt={productName} 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="text-sm font-medium">{productName}</div>
            <div className="text-primary font-medium">{formatPrice(productPrice)}</div>
          </div>
        </div>

        {/* Complementary products */}
        {complementaryProducts.map((product) => (
          <div 
            key={product.id}
            className={`border rounded p-4 flex items-center ${selectedProducts.includes(product.id) ? 'border-primary' : ''}`}
            onClick={() => toggleProduct(product.id)}
          >
            <div className="w-20 h-20 mr-4">
              {product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <Package className="w-12 h-12 text-gray-300" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium line-clamp-2">{product.name}</div>
              <div className="text-primary font-medium">{formatPrice(product.price)}</div>
            </div>
            <div className="ml-2">
              <Button 
                variant={selectedProducts.includes(product.id) ? "default" : "outline"} 
                size="icon"
                className="h-7 w-7"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleProduct(product.id);
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
            
      <div className="mt-4 flex items-center">
        <span className="font-medium mr-4">Total: {formatPrice(totalPrice)}</span>
        <Button 
          variant="outline" 
          size="sm"
          onClick={addAllToCart}
          disabled={selectedProducts.length === 0}
        >
          Add All To Cart
        </Button>
      </div>
    </div>
  );
};