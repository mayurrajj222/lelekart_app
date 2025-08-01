import express from 'express';
import { storage } from './storage';

// Define interfaces for structured search
interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  color?: string;
  size?: string;
  brand?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popularity';
}

interface ProcessQueryResult {
  filters: SearchFilters;
  enhancedQuery: string;
}

// This is a dedicated API server for handling product search
// It is set up separately to avoid conflicts with the main routes and Vite
const searchApiRouter = express.Router();

// Regular search endpoint
searchApiRouter.get("/api/special-search", async (req, res) => {
  try {
    const query = req.query.q as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    // Determine user role for filtering results
    const userRole = req.isAuthenticated() ? req.user.role : 'buyer';
    
    if (!query || query.trim().length < 1) {
      return res.json([]);
    }
    
    console.log("Special search endpoint hit. Searching for:", query, "userRole:", userRole);
    const results = await storage.searchProducts(query, limit, userRole);
    console.log(`Found ${results.length} results for "${query}"`);
    
    // Set explicit headers to prevent caching and ensure JSON response
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Type', 'application/json');
    
    return res.json(results);
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({ error: "Failed to search products" });
  }
});

// Search suggestions API for customer-facing frontend
searchApiRouter.get("/api/search/suggestions", async (req, res) => {
  try {
    const query = req.query.q as string;
    
    if (!query || query.trim().length < 2) {
      return res.json([]);
    }
    
    // Limit to 6 suggestions
    console.log("Search suggestions endpoint hit. Searching for:", query);
    
    // Set filters for customer-facing search (only approved products)
    const filters = {
      search: query,
      approved: true,
      deleted: false
    };
    
    // For search suggestions, always use buyer role to ensure only approved products
    const results = await storage.searchProducts(query, 6, 'buyer');
    console.log(`Found ${results.length} suggestion results for "${query}"`);
    
    if (!results || results.length === 0) {
      return res.json([]);
    }
    
    // Format results to include only necessary fields
    const suggestions = results.map(product => ({
      id: product.id,
      name: product.name,
      image: product.images && product.images.length > 0 ? product.images[0] : null,
      price: product.price || 0,
      category: product.category || 'Uncategorized'
    }));
    
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    return res.json(suggestions);
  } catch (error) {
    console.error("Error getting search suggestions:", error);
    res.status(500).json({ error: "Failed to get search suggestions" });
  }
});

// Admin search suggestions API
searchApiRouter.get("/api/admin/search/suggestions", async (req, res) => {
  // Check if user is authenticated and is an admin
  if (!req.isAuthenticated || !req.isAuthenticated() || !req.user || req.user.role !== 'admin') {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const query = req.query.q as string;
    
    if (!query || query.trim().length < 2) {
      return res.json([]);
    }
    
    console.log("Admin search suggestions endpoint hit. Searching for:", query);
    // For admin searches, explicitly pass admin role to see all products
    const results = await storage.searchProducts(query, 6, 'admin');
    console.log(`Found ${results.length} admin suggestion results for "${query}"`);
    
    // Format results to include only necessary fields
    const suggestions = results.map(product => ({
      id: product.id,
      name: product.name,
      image: product.images && product.images.length > 0 ? product.images[0] : null,
      price: product.price,
      category: product.category
    }));
    
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    return res.json(suggestions);
  } catch (error) {
    console.error("Error getting admin search suggestions:", error);
    res.status(500).json({ error: "Failed to get admin search suggestions" });
  }
});

// AI-powered search query processing
searchApiRouter.post("/api/search/process-query", async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: "Empty search query" });
    }
    
    console.log("Processing search query:", query);
    
    // Basic query processing to extract structured parameters
    // In a real implementation, this would use NLP or ML to understand the query intent
    const processedQuery = query.trim().toLowerCase();
    const result: ProcessQueryResult = {
      filters: {},
      enhancedQuery: query.trim()
    };
    
    // Simple rule-based processing to extract common search parameters
    // This is a basic implementation that could be replaced with a more sophisticated ML model
    
    // Extract price ranges
    const pricePattern = /(\bunder\s*(\d+))|(\bbelow\s*(\d+))|(\bless than\s*(\d+))|(\bover\s*(\d+))|(\babove\s*(\d+))|(\bmore than\s*(\d+))|(\b(\d+)\s*-\s*(\d+)\b)|(\bbetween\s*(\d+)\s*and\s*(\d+))/i;
    const priceMatch = processedQuery.match(pricePattern);
    
    if (priceMatch) {
      if (priceMatch[2] || priceMatch[4] || priceMatch[6]) {
        // Under/Below/Less than X
        const maxPrice = parseInt(priceMatch[2] || priceMatch[4] || priceMatch[6]);
        result.filters.maxPrice = maxPrice;
      } else if (priceMatch[8] || priceMatch[10] || priceMatch[12]) {
        // Over/Above/More than X
        const minPrice = parseInt(priceMatch[8] || priceMatch[10] || priceMatch[12]);
        result.filters.minPrice = minPrice;
      } else if (priceMatch[14] && priceMatch[15]) {
        // X - Y format
        const minPrice = parseInt(priceMatch[14]);
        const maxPrice = parseInt(priceMatch[15]);
        result.filters.minPrice = minPrice;
        result.filters.maxPrice = maxPrice;
      } else if (priceMatch[17] && priceMatch[18]) {
        // Between X and Y
        const minPrice = parseInt(priceMatch[17]);
        const maxPrice = parseInt(priceMatch[18]);
        result.filters.minPrice = minPrice;
        result.filters.maxPrice = maxPrice;
      }
    }
    
    // Extract color
    const colorPattern = /\b(red|blue|green|yellow|black|white|purple|pink|orange|brown|grey|gray|silver|gold)\b/i;
    const colorMatch = processedQuery.match(colorPattern);
    if (colorMatch) {
      result.filters.color = colorMatch[1].toLowerCase();
    }
    
    // Extract size
    const sizePattern = /\b(small|medium|large|xl|xxl|xs|s|m|l)\b/i;
    const sizeMatch = processedQuery.match(sizePattern);
    if (sizeMatch) {
      result.filters.size = sizeMatch[1].toLowerCase();
    }
    
    // Extract sort order
    if (processedQuery.includes('cheapest') || processedQuery.includes('lowest price')) {
      result.filters.sortBy = 'price_asc';
    } else if (processedQuery.includes('expensive') || processedQuery.includes('highest price')) {
      result.filters.sortBy = 'price_desc';
    } else if (processedQuery.includes('newest') || processedQuery.includes('latest')) {
      result.filters.sortBy = 'newest';
    } else if (processedQuery.includes('popular') || processedQuery.includes('best selling')) {
      result.filters.sortBy = 'popularity';
    }
    
    // Check for common categories
    const categories = await storage.getCategories();
    for (const category of categories) {
      if (processedQuery.includes(category.name.toLowerCase())) {
        result.filters.category = category.name;
        break;
      }
    }
    
    console.log("Processed query result:", result);
    
    res.json(result);
  } catch (error) {
    console.error("Error processing search query:", error);
    res.status(500).json({ error: "Failed to process search query" });
  }
});

// There is already a handler for this endpoint elsewhere
// Making sure we don't have duplicate route handlers

export default searchApiRouter;