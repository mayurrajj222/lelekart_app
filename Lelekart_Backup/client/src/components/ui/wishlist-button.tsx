import React, { useContext } from "react";
import { useWishlist } from "@/context/wishlist-context";
import { AuthContext } from "@/hooks/use-auth";
import { Heart } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface WishlistButtonProps {
  productId: number;
  variant?: "icon" | "icon-label" | "card"; // Different visual styles
  className?: string;
}

export function WishlistButton({
  productId,
  variant = "icon",
  className = "",
}: WishlistButtonProps) {
  // Safely access auth context
  const authContext = useContext(AuthContext);
  const user = authContext?.user || null;
  const { toast } = useToast();

  // Safely access wishlist context
  let isInWishlist = (id: number) => false;
  let toggleWishlist = async (id: number) => {};

  try {
    const wishlistContext = useWishlist();
    if (wishlistContext) {
      isInWishlist = wishlistContext.isInWishlist;
      toggleWishlist = wishlistContext.toggleWishlist;
    }
  } catch (error) {
    console.warn("Wishlist context not available, returning default state");
  }

  const [, setLocation] = useLocation();
  const inWishlist = isInWishlist(productId);

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent event bubbling to parent (like card clicks)
    e.stopPropagation();

    if (!user) {
      setLocation("/auth");
      return;
    }

    // Disable wishlist functionality for sellers and admins
    if (user.role === "admin" || user.role === "seller") {
      toast({
        title: "Wishlist Not Available",
        description:
          "Sellers and admins cannot add items to wishlist. Please login with a buyer account to use this feature.",
        variant: "destructive",
      });
      return;
    }

    await toggleWishlist(productId);
  };

  // This is similar to Flipkart's implementation: a heart icon that toggles fill
  if (variant === "icon") {
    const isDisabled =
      user && (user.role === "admin" || user.role === "seller");
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "rounded-full p-2 absolute top-2 right-2 z-10",
          isDisabled
            ? "opacity-50"
            : "hover:bg-slate-100 dark:hover:bg-slate-800",
          className
        )}
        onClick={handleWishlistClick}
        aria-label={
          isDisabled
            ? "Wishlist not available - login with buyer account"
            : inWishlist
              ? "Remove from wishlist"
              : "Add to wishlist"
        }
      >
        <Heart
          className={cn(
            "h-6 w-6 transition-colors",
            inWishlist ? "fill-red-500 text-red-500" : "text-gray-500"
          )}
        />
      </Button>
    );
  }

  // For card variant (used in product cards)
  if (variant === "card") {
    const isDisabled =
      user && (user.role === "admin" || user.role === "seller");
    return (
      <button
        className={cn(
          "absolute right-2 top-2 z-10 rounded-full bg-white/80 p-1.5 backdrop-blur-sm transition-colors",
          isDisabled ? "opacity-50" : "hover:bg-white",
          className
        )}
        onClick={handleWishlistClick}
        aria-label={
          isDisabled
            ? "Wishlist not available - login with buyer account"
            : inWishlist
              ? "Remove from wishlist"
              : "Add to wishlist"
        }
      >
        <Heart
          className={cn(
            "h-5 w-5 transition-colors",
            inWishlist ? "fill-red-500 text-red-500" : "text-gray-500"
          )}
        />
      </button>
    );
  }

  // Icon with label (like in product details page)
  const isDisabled = user && (user.role === "admin" || user.role === "seller");
  return (
    <Button
      variant="outline"
      className={cn(
        "flex items-center gap-2",
        isDisabled ? "opacity-50" : "",
        className
      )}
      onClick={handleWishlistClick}
    >
      <Heart
        className={cn("h-5 w-5", inWishlist ? "fill-red-500 text-red-500" : "")}
      />
      {isDisabled
        ? "Login with Buyer Account"
        : inWishlist
          ? "Remove from Wishlist"
          : "Add to Wishlist"}
    </Button>
  );
}
