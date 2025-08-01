import { Request, Response } from "express";
import { storage } from "../storage";

/**
 * Get all items in a user's wishlist
 */
export async function getWishlist(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to view your wishlist" });
    }
    
    const userId = req.user?.id;
    const wishlistItems = await storage.getWishlistByUserId(userId);
    
    res.status(200).json(wishlistItems);
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ message: "Failed to fetch wishlist" });
  }
}

/**
 * Add an item to the wishlist
 */
export async function addToWishlist(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to add items to your wishlist" });
    }
    
    const userId = req.user?.id;
    const { productId } = req.body;
    
    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }
    
    // Check if item already exists in wishlist
    const existingItem = await storage.getWishlistItem(userId, productId);
    if (existingItem) {
      return res.status(200).json({ message: "Item already in wishlist", inWishlist: true });
    }
    
    // Add item to wishlist
    const wishlistItem = await storage.addToWishlist(userId, productId);
    
    res.status(201).json({ message: "Item added to wishlist", wishlistItem, inWishlist: true });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res.status(500).json({ message: "Failed to add item to wishlist" });
  }
}

/**
 * Remove an item from the wishlist
 */
export async function removeFromWishlist(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to remove items from your wishlist" });
    }
    
    const userId = req.user?.id;
    const productId = parseInt(req.params.productId);
    
    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }
    
    // Remove item from wishlist
    await storage.removeFromWishlist(userId, productId);
    
    res.status(200).json({ message: "Item removed from wishlist", inWishlist: false });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    res.status(500).json({ message: "Failed to remove item from wishlist" });
  }
}

/**
 * Check if a product is in the user's wishlist
 */
export async function checkWishlistItem(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(200).json({ inWishlist: false });
    }
    
    const userId = req.user?.id;
    const productId = parseInt(req.params.productId);
    
    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }
    
    // Check if item exists in wishlist
    const existingItem = await storage.getWishlistItem(userId, productId);
    
    res.status(200).json({ inWishlist: !!existingItem });
  } catch (error) {
    console.error("Error checking wishlist item:", error);
    res.status(500).json({ message: "Failed to check wishlist item" });
  }
}

/**
 * Clear all items from the wishlist
 */
export async function clearWishlist(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to clear your wishlist" });
    }
    
    const userId = req.user?.id;
    
    // Clear all items from wishlist
    await storage.clearWishlist(userId);
    
    res.status(200).json({ message: "Wishlist cleared" });
  } catch (error) {
    console.error("Error clearing wishlist:", error);
    res.status(500).json({ message: "Failed to clear wishlist" });
  }
}