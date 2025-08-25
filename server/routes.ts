import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import * as rewardsHandler from "./handlers/rewards-handlers";
import {
  createRazorpayOrder,
  generateReceiptId,
  handleSuccessfulPayment,
  getRazorpayKeyId,
  getRazorpayConfigStatus,
} from "./utils/razorpay";

export function registerUserProfileRoute(app: Express) {
  app.get("/api/user", async (req: Request, res: Response) => {
    // @ts-ignore: isAuthenticated and user are set by auth middleware
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      // @ts-ignore: user is set by auth middleware
      const user = await storage.getUser(req.user.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Products endpoint for React Native app
  app.get("/api/products", async (req: Request, res: Response) => {
    try {
      // Return a larger dataset of products (100-200) for similar products functionality
      const mockProducts = [
        // Electronics Category
        {
          id: 1,
          name: "Smartphone",
          price: 15999,
          imageUrl: "https://images.unsplash.com/photo-1511707171634-5f400&h=400&fit=crop",
          category: "Electronics",
          description: "Latest smartphone with amazing features",
          rating: 4.5,
          ratingCount: 128
        },
        {
          id: 2,
          name: "Laptop",
          price: 45999,
          imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop",
          category: "Electronics",
          description: "High-performance laptop for work and gaming",
          rating: 4.7,
          ratingCount: 89
        },
        {
          id: 3,
          name: "Wireless Headphones",
          price: 2999,
          imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
          category: "Electronics",
          description: "Premium wireless headphones with noise cancellation",
          rating: 4.3,
          ratingCount: 156
        },
        {
          id: 4,
          name: "Smart Watch",
          price: 8999,
          imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
          category: "Electronics",
          description: "Feature-rich smartwatch for fitness tracking",
          rating: 4.6,
          ratingCount: 203
        },
        {
          id: 5,
          name: "Gaming Console",
          price: 35999,
          imageUrl: "https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=400&h=400&fit=crop",
          category: "Electronics",
          description: "Next-gen gaming console for immersive gaming",
          rating: 4.8,
          ratingCount: 67
        },
        {
          id: 6,
          name: "Tablet",
          price: 25999,
          imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop",
          category: "Electronics",
          description: "Versatile tablet for work and entertainment",
          rating: 4.4,
          ratingCount: 92
        },
        // Honey Category - for similar products
        {
          id: 101,
          name: "Organic Honey - Premium Grade",
          price: 180,
          imageUrl: "https://placehold.co/200x200?text=Honey+Premium",
          category: "honey",
          description: "Pure organic honey sourced from pristine forests",
          rating: 4.5,
          ratingCount: 89
        },
        {
          id: 102,
          name: "Wild Forest Honey",
          price: 220,
          imageUrl: "https://placehold.co/200x200?text=Forest+Honey",
          category: "honey",
          description: "Natural wild forest honey with rich flavor",
          rating: 4.7,
          ratingCount: 156
        },
        {
          id: 103,
          name: "Manuka Honey - Special Blend",
          price: 350,
          imageUrl: "https://placehold.co/200x200?text=Manuka+Honey",
          category: "honey",
          description: "Premium Manuka honey with medicinal properties",
          rating: 4.8,
          ratingCount: 203
        },
        {
          id: 104,
          name: "Acacia Honey - Light & Sweet",
          price: 165,
          imageUrl: "https://placehold.co/200x200?text=Acacia+Honey",
          category: "honey",
          description: "Light and sweet acacia honey",
          rating: 4.3,
          ratingCount: 67
        },
        {
          id: 105,
          name: "Multi-Flower Honey",
          price: 140,
          imageUrl: "https://placehold.co/200x200?text=Multi+Flower",
          category: "honey",
          description: "Blend of multiple flower varieties",
          rating: 4.2,
          ratingCount: 45
        },
        {
          id: 106,
          name: "Buckwheat Honey - Dark & Rich",
          price: 195,
          imageUrl: "https://placehold.co/200x200?text=Buckwheat+Honey",
          category: "honey",
          description: "Dark and rich buckwheat honey",
          rating: 4.6,
          ratingCount: 78
        },
        {
          id: 107,
          name: "Eucalyptus Honey - Minty Fresh",
          price: 185,
          imageUrl: "https://placehold.co/200x200?text=Eucalyptus+Honey",
          category: "honey",
          description: "Refreshing eucalyptus honey",
          rating: 4.4,
          ratingCount: 92
        },
        {
          id: 108,
          name: "Orange Blossom Honey - Citrus Sweet",
          price: 175,
          imageUrl: "https://placehold.co/200x200?text=Orange+Blossom",
          category: "honey",
          description: "Citrus-scented orange blossom honey",
          rating: 4.5,
          ratingCount: 113
        },
        // Clothing Category
        {
          id: 201,
          name: "Men's T-Shirt",
          price: 599,
          imageUrl: "https://placehold.co/200x200?text=Men+T-Shirt",
          category: "clothing",
          description: "Comfortable cotton t-shirt for men",
          rating: 4.2,
          ratingCount: 45
        },
        {
          id: 202,
          name: "Women's Dress",
          price: 1299,
          imageUrl: "https://placehold.co/200x200?text=Women+Dress",
          category: "clothing",
          description: "Elegant dress for women",
          rating: 4.4,
          ratingCount: 78
        },
        {
          id: 203,
          name: "Kids Jeans",
          price: 799,
          imageUrl: "https://placehold.co/200x200?text=Kids+Jeans",
          category: "clothing",
          description: "Durable jeans for kids",
          rating: 4.1,
          ratingCount: 34
        },
        // Home & Garden Category
        {
          id: 301,
          name: "Garden Plant Pot",
          price: 299,
          imageUrl: "https://placehold.co/200x200?text=Plant+Pot",
          category: "home_garden",
          description: "Beautiful ceramic plant pot",
          rating: 4.3,
          ratingCount: 56
        },
        {
          id: 302,
          name: "LED Table Lamp",
          price: 899,
          imageUrl: "https://placehold.co/200x200?text=Table+Lamp",
          category: "home_garden",
          description: "Modern LED table lamp",
          rating: 4.6,
          ratingCount: 89
        },
        // Books Category
        {
          id: 401,
          name: "Programming Book",
          price: 599,
          imageUrl: "https://placehold.co/200x200?text=Programming+Book",
          category: "books",
          description: "Learn programming from scratch",
          rating: 4.7,
          ratingCount: 123
        },
        {
          id: 402,
          name: "Fiction Novel",
          price: 399,
          imageUrl: "https://placehold.co/200x200?text=Fiction+Novel",
          category: "books",
          description: "Bestselling fiction novel",
          rating: 4.5,
          ratingCount: 67
        }
      ];

      // Add more products to reach 100-200 range
      for (let i = 500; i <= 600; i++) {
        const categories = ["Electronics", "honey", "clothing", "home_garden", "books", "sports", "beauty", "automotive"];
        const category = categories[i % categories.length];
        
        mockProducts.push({
          id: i,
          name: `Product ${i}`,
          price: Math.floor(Math.random() * 5000) + 100,
          imageUrl: `https://placehold.co/200x200?text=Product+${i}`,
          category: category,
          description: `Description for product ${i}`,
          rating: (Math.random() * 2 + 3).toFixed(1), // Random rating between 3.0 and 5.0
          ratingCount: Math.floor(Math.random() * 200) + 10
        });
      }

      res.json({
        products: mockProducts,
        pagination: {
          total: mockProducts.length,
          totalPages: 1,
          currentPage: 1,
          limit: mockProducts.length
        }
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Product creation endpoint with variant support
  app.post("/api/products/draft", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { productData } = req.body;
      
      if (!productData) {
        return res.status(400).json({ error: "Product data is required" });
      }

      // Validate required fields
      if (!productData.name || productData.name.length < 5) {
        return res.status(400).json({ error: "Product name must be at least 5 characters" });
      }
      if (!productData.category) {
        return res.status(400).json({ error: "Category is required" });
      }
      if (!productData.description || productData.description.length < 20) {
        return res.status(400).json({ error: "Description must be at least 20 characters" });
      }

      // Validate variants if provided
      if (productData.variants && Array.isArray(productData.variants)) {
        for (let i = 0; i < productData.variants.length; i++) {
          const variant = productData.variants[i];
          if (!variant.weight || !variant.weight.trim()) {
            return res.status(400).json({ error: `Variant ${i + 1}: Weight is required` });
          }
          if (!variant.price || isNaN(Number(variant.price)) || Number(variant.price) <= 0) {
            return res.status(400).json({ error: `Variant ${i + 1}: Price must be a positive number` });
          }
          if (!variant.stock || isNaN(Number(variant.stock)) || Number(variant.stock) < 0) {
            return res.status(400).json({ error: `Variant ${i + 1}: Stock must be a non-negative number` });
          }
        }
      } else {
        // If no variants, validate main product fields
        if (!productData.price || isNaN(Number(productData.price)) || Number(productData.price) <= 0) {
          return res.status(400).json({ error: "Price must be a positive number" });
        }
        if (!productData.stock || isNaN(Number(productData.stock)) || Number(productData.stock) < 0) {
          return res.status(400).json({ error: "Stock must be a non-negative number" });
        }
      }

      // For now, just return success since we don't have a full database setup
      // In production, you would save this to your database
      const mockProduct = {
        id: Date.now(),
        ...productData,
        sellerId: req.user.id,
        isDraft: true,
        approved: false,
        createdAt: new Date(),
      };

      console.log("Product draft created:", mockProduct);
      
      res.json({
        success: true,
        product: mockProduct,
        message: "Product draft created successfully"
      });
    } catch (error) {
      console.error("Error creating product draft:", error);
      res.status(500).json({ error: "Failed to create product draft" });
    }
  });

  // Product update endpoint with variant support
  app.put("/api/seller/products/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const productId = parseInt(req.params.id);
      const { productData } = req.body;
      
      if (isNaN(productId)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }
      
      if (!productData) {
        return res.status(400).json({ error: "Product data is required" });
      }

      // Validate required fields
      if (!productData.name || productData.name.length < 5) {
        return res.status(400).json({ error: "Product name must be at least 5 characters" });
      }
      if (!productData.category) {
        return res.status(400).json({ error: "Category is required" });
      }
      if (!productData.description || productData.description.length < 20) {
        return res.status(400).json({ error: "Description must be at least 20 characters" });
      }

      // Validate variants if provided
      if (productData.variants && Array.isArray(productData.variants)) {
        for (let i = 0; i < productData.variants.length; i++) {
          const variant = productData.variants[i];
          if (!variant.weight || !variant.weight.trim()) {
            return res.status(400).json({ error: `Variant ${i + 1}: Weight is required` });
          }
          if (!variant.price || isNaN(Number(variant.price)) || Number(variant.price) <= 0) {
            return res.status(400).json({ error: `Variant ${i + 1}: Price must be a positive number` });
          }
          if (!variant.stock || isNaN(Number(variant.stock)) || Number(variant.stock) < 0) {
            return res.status(400).json({ error: `Variant ${i + 1}: Stock must be a non-negative number` });
          }
        }
      } else {
        // If no variants, validate main product fields
        if (!productData.price || isNaN(Number(productData.price)) || Number(productData.price) <= 0) {
          return res.status(400).json({ error: "Price must be a positive number" });
        }
        if (!productData.stock || isNaN(Number(productData.stock)) || Number(productData.stock) < 0) {
          return res.status(400).json({ error: "Stock must be a non-negative number" });
        }
      }

      // For now, just return success since we don't have a full database setup
      // In production, you would update this in your database
      const mockUpdatedProduct = {
        id: productId,
        ...productData,
        sellerId: req.user.id,
        updatedAt: new Date(),
      };

      console.log("Product updated:", mockUpdatedProduct);
      
      res.json({
        success: true,
        product: mockUpdatedProduct,
        message: "Product updated successfully"
      });
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  // Get seller products endpoint
  app.get("/api/seller/products/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const productId = parseInt(req.params.id);
      
      if (isNaN(productId)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }

      // For now, return mock data since we don't have a full database setup
      // In production, you would fetch this from your database
      const mockProduct = {
        id: productId,
        name: "Sample Product",
        description: "This is a sample product description",
        category: "Electronics",
        price: 1000,
        stock: 10,
        variants: [
          {
            id: 1,
            weight: "250g",
            price: 120,
            stock: 5,
            mrp: 150,
            sku: "PROD-250G"
          },
          {
            id: 2,
            weight: "500g",
            price: 220,
            stock: 3,
            mrp: 280,
            sku: "PROD-500G"
          }
        ],
        images: ["https://via.placeholder.com/300x300?text=Product"],
        sellerId: req.user.id,
        isDraft: true,
        approved: false,
        createdAt: new Date(),
      };

      res.json(mockProduct);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  // Get single product (customer-facing)
  app.get("/api/products/:id", async (req: Request, res: Response) => {
    const { id: productId } = req.params;
    
          // Mock product data with variants - matching the website's structure
      // This will be returned for any product ID to ensure variants are shown
      const mockProduct = {
        id: productId,
        name: "Pure Honey - 100% Natural",
        description: "Experience the golden goodness of nature with LeLekart's Pure Honey — straight from the hive to your home. Sourced from high-quality honeycombs and packed without any additives, this natural sweetener is as real as it gets. With its rich aroma, smooth texture, and deep amber color, our honey is a delicious addition to your daily routine — whether drizzled over toast, mixed into warm water, or used in traditional remedies.",
        price: 150,
        stock: 266,
        rating: 4.3,
        ratingCount: "1,234 ratings",
        discount: "20",
        imageUrl: "https://placehold.co/400x400?text=Honey",
        images: [
          "https://placehold.co/400x400?text=Honey+1",
          "https://placehold.co/400x400?text=Honey+2",
          "https://placehold.co/400x400?text=Honey+3"
        ],
        sellerName: "Nature's Best",
        highlights: [
          "Genuine product",
          "Easy returns",
          "Secure payment"
        ],
        variants: [
          { id: 1, color: "Golden Amber", size: "250g", price: 150, stock: 100, mrp: 200, sku: "HNY-250G" },
          { id: 2, color: "Golden Amber", size: "500g", price: 280, stock: 80, mrp: 350, sku: "HNY-500G" },
          { id: 3, color: "Golden Amber", size: "1kg", price: 520, stock: 50, mrp: 650, sku: "HNY-1KG" },
          { id: 4, color: "Dark Amber", size: "250g", price: 160, stock: 75, mrp: 210, sku: "HNY-DARK-250G" },
          { id: 5, color: "Dark Amber", size: "500g", price: 290, stock: 60, mrp: 360, sku: "HNY-DARK-500G" },
          { id: 6, color: "Light Golden", size: "250g", price: 140, stock: 90, mrp: 190, sku: "HNY-LIGHT-250G" },
          { id: 7, color: "Light Golden", size: "500g", price: 270, stock: 70, mrp: 340, sku: "HNY-LIGHT-500G" }
        ]
      };
    
    console.log('API Response for product:', productId, mockProduct);
    res.json(mockProduct);
  });

  // Enhanced GET /api/orders for mobile app: include items with product details
  app.get("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user.id;
      // Get all orders for this user
      const orders = await storage.getOrders(userId);
      // For each order, fetch its items with product details
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
          const items = await storage.getOrderItems(order.id);
          return {
            ...order,
            items, // Each item includes { product: { imageUrl, name, ... } }
          };
        })
      );
      res.json(ordersWithItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Allow user to cancel their own order (with debug logging)
  app.post("/api/orders/:id/cancel", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const orderId = parseInt(req.params.id);
    const userId = req.user.id;
    console.log(`[CANCEL] Attempting to cancel order`, { orderId, userId });
    if (isNaN(orderId)) {
      console.log(`[CANCEL] Invalid order ID`, { orderId });
      return res.status(400).json({ error: "Invalid order ID" });
    }
    try {
      const order = await storage.getOrder(orderId);
      console.log(`[CANCEL] Fetched order:`, order);
      if (!order || order.userId !== userId) {
        console.log(`[CANCEL] Not authorized or order not found`, { order, userId });
        return res.status(403).json({ error: "Not authorized" });
      }
      if (["shipped", "completed", "cancelled"].includes(order.status)) {
        console.log(`[CANCEL] Order not cancellable`, { status: order.status });
        return res.status(400).json({ error: "Order cannot be cancelled" });
      }
      const updated = await storage.updateOrder(orderId, { status: "cancelled" });
      console.log(`[CANCEL] Order cancelled successfully`, updated);
      res.json({ success: true, message: "Order cancelled successfully" });
    } catch (err) {
      console.error(`[CANCEL] Error cancelling order`, err);
      res.status(500).json({ error: "Failed to cancel order", details: err?.message || err });
    }
  });

  // --- Minimal order placement endpoint for React Native app ---
  app.post("/api/orders", async (req: Request, res: Response) => {
    // @ts-ignore: isAuthenticated and user are set by auth middleware
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { addressId, cartItems, subtotal, total, deliveryCharge, gst, shippingDetails, paymentMethod, rewardPointsToRedeem, rewardDiscount, rewardPointsUsed, walletToRedeem } = req.body;
    if (!addressId) return res.status(400).json({ error: "Missing addressId" });
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: "Missing or empty cart items" });
    }
    try {
      // Fetch user rewards
      let userRewards = await storage.getUserRewards(req.user.id);
      if (!userRewards) {
        userRewards = await storage.createUserRewards({
          userId: req.user.id,
          points: 0,
          lifetimePoints: 0,
          lastUpdated: new Date()
        });
      }
      // Check if user has enough reward points
      if (rewardPointsUsed > 0) {
        if (userRewards.points < rewardPointsUsed) {
          return res.status(400).json({ error: "Insufficient reward points" });
        }
      }
      // Deduct wallet if used
      if (walletToRedeem > 0) {
        try {
          await storage.deductFromWallet(req.user.id, walletToRedeem, `Order payment deduction`);
        } catch (walletErr) {
          return res.status(400).json({ error: walletErr.message || 'Wallet deduction failed' });
        }
      }
      // Use subtotal from frontend if provided, fallback to calculated total
      const orderSubtotal = typeof subtotal === 'number' ? subtotal : cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const orderDeliveryCharge = deliveryCharge || 0;
      const orderTotal = Math.max(0, orderSubtotal + orderDeliveryCharge - (rewardDiscount || 0) - (walletToRedeem || 0));
      
      // Insert order
      const orderData = {
        userId: req.user.id,
        addressId,
        shippingDetails: shippingDetails ? JSON.stringify(shippingDetails) : null,
        paymentMethod: paymentMethod || "cod",
        status: "placed",
        total: orderTotal,
        rewardDiscount: rewardDiscount || 0,
        rewardPointsUsed: rewardPointsUsed || 0,
        walletDiscount: walletToRedeem || 0,
        date: new Date(),
      };
      const order = await storage.createOrder(orderData);
      
      // Create order items
      for (const cartItem of cartItems) {
        await storage.createOrderItem({
          orderId: order.id,
          productId: cartItem.productId,
          quantity: cartItem.quantity,
          price: cartItem.price,
          variant: cartItem.variant ? JSON.stringify(cartItem.variant) : null
        });
      }
      
      // Deduct reward points and create transaction if used
      if (rewardPointsUsed > 0) {
        await storage.createRewardTransaction({
          userId: req.user.id,
          orderId: order.id,
          points: -rewardPointsUsed,
          type: "redeem",
          description: `Redeemed ${rewardPointsUsed} points for order #${order.id}`,
          transactionDate: new Date(),
          status: "used",
        });
        await storage.updateUserRewards(req.user.id, {
          points: userRewards.points - rewardPointsUsed,
          lastUpdated: new Date(),
        });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to place order", details: error?.message || error });
    }
  });

  // Addresses
  app.get("/api/addresses", async (req: Request, res: Response) => {
    // @ts-ignore: isAuthenticated and user are set by auth middleware
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const addresses = await storage.getAddresses(req.user.id);
      res.json(addresses);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      res.status(500).json({ error: "Failed to fetch addresses" });
    }
  });

  app.post("/api/addresses", async (req: Request, res: Response) => {
    // @ts-ignore: isAuthenticated and user are set by auth middleware
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const addressData = {
        ...req.body,
        userId: req.user.id,
      };
      const address = await storage.createAddress(addressData);
      res.json(address);
    } catch (error) {
      console.error("Error creating address:", error);
      res.status(500).json({ error: "Failed to create address" });
    }
  });

  app.put("/api/addresses/:id", async (req: Request, res: Response) => {
    // @ts-ignore: isAuthenticated and user are set by auth middleware
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const addressId = parseInt(req.params.id);
      const address = await storage.updateAddress(addressId, req.body);
      res.json(address);
    } catch (error) {
      console.error("Error updating address:", error);
      res.status(500).json({ error: "Failed to update address" });
    }
  });

  app.delete("/api/addresses/:id", async (req: Request, res: Response) => {
    // @ts-ignore: isAuthenticated and user are set by auth middleware
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const addressId = parseInt(req.params.id);
      await storage.deleteAddress(addressId);
      res.json({ message: "Address deleted successfully" });
    } catch (error) {
      console.error("Error deleting address:", error);
      res.status(500).json({ error: "Failed to delete address" });
    }
  });

  // Returns
  app.get("/api/returns/reasons", returnHandler.getReturnReasons);
  app.get("/api/returns/:id", returnHandler.getReturnById);

  // Rewards
  app.get("/api/rewards/rules", rewardsHandler.getRewardRules);
  app.get("/api/rewards/:userId", rewardsHandler.getUserRewards);
  app.get("/api/rewards/:userId/transactions", rewardsHandler.getUserRewardTransactions);
  app.post("/api/rewards/process-order", rewardsHandler.processOrderReward);

  // Razorpay payment routes
  app.get("/api/razorpay/key", (req: Request, res: Response) => {
    try {
      const keyId = getRazorpayKeyId();
      res.json({ keyId });
    } catch (error) {
      console.error("Error fetching Razorpay key:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch Razorpay key" });
    }
  });

  app.get("/api/razorpay/config", (req: Request, res: Response) => {
    try {
      const config = getRazorpayConfigStatus();
      res.json(config);
    } catch (error) {
      console.error("Error fetching Razorpay config:", error);
      res.status(500).json({ error: "Failed to fetch Razorpay configuration" });
    }
  });

  app.post("/api/razorpay/create-order", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      // Get cart items to calculate total
      const cartItems = await storage.getCartItems(req.user.id);

      if (cartItems.length === 0) {
        return res.status(400).json({ error: "Cart is empty" });
      }

      // Calculate total in lowest currency unit (paise for INR)
      const totalInPaise = Math.round(
        cartItems.reduce(
          (acc, item) => acc + item.product.price * item.quantity,
          0
        ) * 100
      );

      // Create a unique receipt ID
      const receiptId = generateReceiptId();

      // Notes for the order
      const notes = {
        userId: req.user.id.toString(),
        email: req.user.email,
        items: JSON.stringify(
          cartItems.map((item) => ({
            productId: item.product.id,
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
          }))
        ),
      };

      // Create Razorpay order
      const order = await createRazorpayOrder(totalInPaise, receiptId, notes);

      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      });
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        error: "Failed to create Razorpay order",
        details: errorMessage,
      });
    }
  });

  app.post("/api/razorpay/verify-payment", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        shippingDetails,
        addressId,
        walletDetails,
      } = req.body;

      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return res
          .status(400)
          .json({ error: "Missing payment verification details" });
      }

      // Verify the payment signature
      const result = await handleSuccessfulPayment(
        razorpayPaymentId,
        razorpayOrderId,
        razorpaySignature
      );

      if (!result.success) {
        return res.status(400).json({ error: "Payment verification failed" });
      }

      // Get cart items
      const cartItems = await storage.getCartItems(req.user.id);

      if (cartItems.length === 0) {
        return res.status(400).json({ error: "Cart is empty" });
      }

      // Calculate total
      const total = cartItems.reduce(
        (acc, item) => acc + item.product.price * item.quantity,
        0
      );

      // Create order in our system
      const orderData: any = {
        userId: req.user.id,
        status: "paid", // Payment successful, so mark as paid
        total,
        date: new Date(),
        shippingDetails:
          typeof shippingDetails === "string"
            ? shippingDetails
            : JSON.stringify(shippingDetails || {}),
        paymentMethod: "razorpay",
        paymentId: razorpayPaymentId,
        orderId: razorpayOrderId,
      };

      // Add address ID if available
      if (addressId) {
        orderData.addressId = parseInt(addressId);
      }

      // Add wallet details if provided
      if (walletDetails) {
        orderData.walletDiscount = walletDetails.amount || 0;
      }

      const order = await storage.createOrder(orderData);

      // Clear cart after successful order
      await storage.clearCart(req.user.id);

      res.json({
        success: true,
        order,
        message: "Payment successful and order placed",
      });
    } catch (error) {
      console.error("Error verifying Razorpay payment:", error);
      res.status(500).json({
        error: "Failed to verify payment",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Cart endpoints with variant support
  app.get("/api/cart", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const cartItems = await storage.getCartItems(req.user.id);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ error: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { productId, quantity, variantWeight, variantPrice, variantStock } = req.body;
      
      if (!productId || !quantity) {
        return res.status(400).json({ error: "Product ID and quantity are required" });
      }

      // Get product details (in a real app, this would come from database)
      const product = {
        id: productId,
        name: "Product Name", // This would be fetched from database
        price: variantPrice || 0,
        imageUrl: "https://placehold.co/200x200?text=Product",
        selectedVariant: variantWeight ? {
          weight: variantWeight,
          price: variantPrice,
          stock: variantStock
        } : null
      };

      const cartItem = await storage.addToCart(req.user.id, product, quantity);
      res.json(cartItem);
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(500).json({ error: "Failed to add to cart" });
    }
  });

  app.put("/api/cart/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { quantity } = req.body;
      const cartItemId = parseInt(req.params.id);
      
      if (!quantity || quantity < 1) {
        return res.status(400).json({ error: "Valid quantity is required" });
      }

      await storage.updateCartItemQuantity(req.user.id, cartItemId, quantity);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating cart item:", error);
      res.status(500).json({ error: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const cartItemId = parseInt(req.params.id);
      await storage.removeFromCart(req.user.id, cartItemId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ error: "Failed to remove from cart" });
    }
  });

  app.post("/api/cart/clear", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      await storage.clearCart(req.user.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(500).json({ error: "Failed to clear cart" });
    }
  });

  // Product reviews endpoint
  app.get("/api/products/:id/reviews", async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.id);
      
      // Get the product to check if it's approved
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Check if product is approved (buyers can only see reviews for approved products)
      if (product.status !== "approved" && req.isAuthenticated() && req.user.role === "buyer") {
        console.log(
          `Unauthorized access attempt by buyer to reviews of unapproved product ${productId}`
        );
        return res.status(403).json({ error: "Product not available for review" });
      }

      const reviews = await storage.getProductReviews(productId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching product reviews:", error);
      res.status(500).json({ error: "Failed to fetch product reviews" });
    }
  });

  // Submit product review endpoint
  app.post("/api/products/:id/reviews", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const productId = parseInt(req.params.id);
      const { rating, comment } = req.body;
      const userId = req.user.id;

      if (isNaN(productId)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 1 and 5" });
      }

      if (!comment || comment.trim().length < 10) {
        return res.status(400).json({ error: "Review comment must be at least 10 characters long" });
      }

      // Save the review to the database
      const newReview = await storage.createReview({
        userId: userId,
        productId: productId,
        rating: rating,
        comment: comment.trim()
      });

      console.log('New review saved:', newReview);
      
      res.status(201).json({ 
        success: true, 
        message: "Review submitted successfully",
        review: newReview
      });
    } catch (error) {
      console.error("Error submitting review:", error);
      res.status(500).json({ error: "Failed to submit review" });
    }
  });

  // Product variant update endpoint
  app.put("/api/products/:productId/variants/:variantId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const productId = parseInt(req.params.productId);
      const variantId = parseInt(req.params.variantId);
      const { price, mrp, stock, color, size, images } = req.body;

      if (isNaN(productId) || isNaN(variantId)) {
        return res.status(400).json({ error: "Invalid product or variant ID" });
      }

      // Get the product to verify ownership
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Check if user owns the product (for sellers) or is admin
      if (product.sellerId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Unauthorized to update this product" });
      }

      // Get the current variant
      const currentVariant = await storage.getProductVariant(variantId);
      if (!currentVariant) {
        return res.status(404).json({ error: "Variant not found" });
      }

      // Prepare update data
      const updateData: any = {};

      if (price !== undefined) {
        updateData.price = Number(price);
        console.log(`Updating price to ${updateData.price}`);
      }

      if (mrp !== undefined) {
        updateData.mrp = Number(mrp);
        console.log(`Updating mrp to ${updateData.mrp}`);
      }

      if (stock !== undefined) {
        updateData.stock = Number(stock);
        console.log(`Updating stock to ${updateData.stock}`);
      }

      if (color !== undefined) {
        updateData.color = color;
        console.log(`Updating color to ${updateData.color}`);
      }

      if (size !== undefined) {
        updateData.size = size;
        console.log(`Updating size to ${updateData.size}`);
      }

      if (images !== undefined && Array.isArray(images)) {
        updateData.images = images;
        console.log(`Updating images array with ${images.length} images`);
      }

      // Log the final update data
      console.log(
        `Updating variant ${variantId} for product ${productId} with data:`,
        updateData
      );

      // Update the variant
      const updatedVariant = await storage.updateProductVariant(variantId, updateData);

      res.json(updatedVariant);
    } catch (error) {
      console.error("Error updating product variant:", error);
      res.status(500).json({ error: "Failed to update product variant" });
    }
  });



  // Fallback for all other GET requests
  app.get("*", (req: Request, res: Response) => {
    res.status(404).json({ error: "Not found" });
  });
} 