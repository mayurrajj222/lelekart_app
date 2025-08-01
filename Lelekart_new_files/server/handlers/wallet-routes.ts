import { Request, Response } from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { giftCards } from '@shared/schema';
import { spendRedeemedCoinsAtCheckout, redeemCoinsFromWallet } from './wallet-handlers';

// Zod schemas for request validation
const walletSettingsSchema = z.object({
  firstPurchaseCoins: z.number().int().min(1, "First purchase coins must be at least 1"),
  coinToCurrencyRatio: z.number().min(0.01, "Coin to currency ratio must be at least 0.01"),
  minOrderValue: z.number().int().min(0, "Minimum order value must be a positive number"),
  maxRedeemableCoins: z.number().int().min(1, "Maximum redeemable coins must be at least 1"),
  coinExpiryDays: z.number().int().min(1, "Coin expiry days must be at least 1"),
  maxUsagePercentage: z.number().min(0).max(100, "Must be between 0 and 100"),
  minCartValue: z.number().min(0, "Must be a non-negative value"),
  applicableCategories: z.string().optional(),
  isEnabled: z.boolean()
});

const redeemCoinsSchema = z.object({
  amount: z.number().int().positive("Amount must be a positive number"),
  referenceType: z.string().optional(),
  referenceId: z.number().int().optional(),
  description: z.string().optional(),
  orderValue: z.number().optional(),
  category: z.string().optional()
});

const adjustWalletSchema = z.object({
  userId: z.number().int().positive("User ID must be a positive number"),
  amount: z.number().int().refine(val => val !== 0, "Amount cannot be zero"),
  reason: z.string().min(3, "Reason must be at least 3 characters")
});

// Get wallet settings
export async function getWalletSettings(req: Request, res: Response) {
  try {
    const settings = await storage.getWalletSettings();
    return res.json(settings);
  } catch (error) {
    console.error("Error fetching wallet settings:", error);
    return res.status(500).json({ error: "Failed to fetch wallet settings" });
  }
}

// Update wallet settings (admin only)
export async function updateWalletSettings(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    // Validate request body
    const validationResult = walletSettingsSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid request data",
        details: validationResult.error.format()
      });
    }
    
    const settings = await storage.updateWalletSettings(validationResult.data);
    return res.json(settings);
  } catch (error) {
    console.error("Error updating wallet settings:", error);
    return res.status(500).json({ error: "Failed to update wallet settings" });
  }
}

// Get user wallet
export async function getUserWallet(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Create wallet if it doesn't exist and return it
      const wallet = await storage.createUserWalletIfNotExists(req.user.id);
      return res.json(wallet);
    } catch (err) {
      console.error("Error creating/fetching wallet:", err);
      return res.status(404).json({ error: "Wallet not found" });
    }
  } catch (error) {
    console.error("Error fetching user wallet:", error);
    return res.status(500).json({ error: "Failed to fetch user wallet" });
  }
}

// Get user wallet transactions
export async function getUserWalletTransactions(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Optional pagination parameters
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    // Try to create the wallet if it doesn't exist
    try {
      const wallet = await storage.createUserWalletIfNotExists(req.user.id);
      const result = await storage.getUserWalletTransactions(req.user.id, page, limit);
      return res.json(result);
    } catch (err) {
      console.error("Error with wallet:", err);
      return res.status(404).json({ error: "Wallet not found" });
    }
  } catch (error) {
    console.error("Error fetching wallet transactions:", error);
    return res.status(500).json({ error: "Failed to fetch wallet transactions" });
  }
}

// Redeem coins from wallet
export async function redeemCoins(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Validate request body
    const validationResult = redeemCoinsSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid request data",
        details: validationResult.error.format()
      });
    }
    
    const { amount, referenceType, referenceId, description } = validationResult.data;
    
    // Get wallet settings
    const settings = await storage.getWalletSettings();
    if (!settings.isEnabled) {
      return res.status(400).json({ error: "Wallet system is currently disabled" });
    }
    
    // Get or create user wallet
    let wallet;
    try {
      wallet = await storage.createUserWalletIfNotExists(req.user.id);
    } catch (err) {
      console.error("Error creating wallet:", err);
      return res.status(404).json({ error: "Wallet not found" });
    }
    
    // Check if user has enough balance
    if (wallet.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }
    
    // Check if amount is within limits
    if (amount > settings.maxRedeemableCoins) {
      return res.status(400).json({ 
        error: `Cannot redeem more than ${settings.maxRedeemableCoins} coins at once` 
      });
    }
    
    // Check if there's a reference to an order or cart (for validation with new fields)
    if (referenceType === 'ORDER' || referenceType === 'CART') {
      // Get the order or cart value if provided
      let orderValue = 0;
      if (referenceId) {
        // In a real implementation, we would fetch the actual order/cart value
        // For now, let's assume we have it from the request
        orderValue = req.body.orderValue ? Number(req.body.orderValue) : 0;
        
        // Check minimum cart value requirement
        if (settings.minCartValue > 0 && orderValue < settings.minCartValue) {
          return res.status(400).json({
            error: `Order value must be at least ₹${settings.minCartValue} to use coins`
          });
        }
        
        // Check if the category is applicable (if categories are restricted)
        if (settings.applicableCategories) {
          const categories = settings.applicableCategories.split(',').map((c: string) => c.trim().toLowerCase());
          const orderCategory = req.body.category ? req.body.category.toLowerCase() : '';
          
          if (categories.length > 0 && orderCategory && !categories.includes(orderCategory)) {
            return res.status(400).json({
              error: `Coins cannot be used for this product category`
            });
          }
        }
        
        // Check maximum usage percentage
        if (settings.maxUsagePercentage > 0) {
          const discountAmount = amount * 1; // 1 coin = 1 rupee
          const maxDiscount = (orderValue * settings.maxUsagePercentage) / 100;
          if (discountAmount > maxDiscount) {
            const maxCoins = Math.floor(maxDiscount / 1);
            return res.status(400).json({
              error: `You can use a maximum of ${maxCoins} coins (${settings.maxUsagePercentage}% of order value) for this order`
            });
          }
        }
      }
    }
    
    // Process the redemption
    const result = await redeemCoinsFromWallet(
      req.user.id,
      amount, 
      referenceType || 'REDEMPTION', 
      referenceId, 
      description
    );
    
    // Calculate the discount amount
    const discountAmount = amount * 1; // 1 coin = 1 rupee
    
    return res.json({
      wallet: result.wallet,
      discountAmount
    });
  } catch (error) {
    console.error("Error redeeming coins:", error);
    return res.status(500).json({ error: "Failed to redeem coins" });
  }
}

// Process expired coins (admin only)
export async function processExpiredCoins(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    const result = await storage.processExpiredCoins();
    return res.json({
      processedCount: result,
      message: `Processed ${result} expired coins`
    });
  } catch (error) {
    console.error("Error processing expired coins:", error);
    return res.status(500).json({ error: "Failed to process expired coins" });
  }
}

// Manual wallet adjustment (admin only)
export async function manualWalletAdjustment(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    // Validate request body
    const validationResult = adjustWalletSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid request data",
        details: validationResult.error.format()
      });
    }
    
    const { userId, amount, reason } = validationResult.data;
    
    // Check if the user exists
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Get or create user wallet
    const wallet = await storage.createUserWalletIfNotExists(userId);
    
    // For negative adjustments, check balance
    if (amount < 0 && wallet.balance < Math.abs(amount)) {
      return res.status(400).json({ error: "Insufficient balance for deduction" });
    }
    
    // Process the adjustment
    const result = await storage.adjustWallet(
      wallet.id,
      amount,
      "MANUAL",
      null,
      `Admin adjustment: ${reason}`
    );
    
    return res.json(result);
  } catch (error) {
    console.error("Error adjusting wallet:", error);
    return res.status(500).json({ error: "Failed to adjust wallet" });
  }
}

// Get wallet by user ID (admin only)
export async function getWalletByUserId(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    // Check if the user exists
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    try {
      const wallet = await storage.createUserWalletIfNotExists(userId);
      return res.json(wallet);
    } catch (err) {
      console.error("Error creating/fetching wallet:", err);
      return res.status(404).json({ error: "Wallet not found" });
    }
  } catch (error) {
    console.error("Error fetching wallet by user ID:", error);
    return res.status(500).json({ error: "Failed to fetch wallet" });
  }
}

// Get wallet transactions by user ID (admin only)
export async function getWalletTransactionsByUserId(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    // Optional pagination parameters
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    // Check if the user exists
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Try to create wallet if it doesn't exist
    try {
      const wallet = await storage.createUserWalletIfNotExists(userId);
      const result = await storage.getUserWalletTransactions(userId, page, limit);
      return res.json(result);
    } catch (err) {
      console.error("Error with wallet:", err);
      return res.status(404).json({ error: "Wallet not found" });
    }
  } catch (error) {
    console.error("Error fetching wallet transactions by user ID:", error);
    return res.status(500).json({ error: "Failed to fetch wallet transactions" });
  }
}

// Get users with wallets (admin only)
export async function getUsersWithWallets(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    const users = await storage.getUsersWithWallets();
    return res.json(users);
  } catch (error) {
    console.error("Error fetching users with wallets:", error);
    return res.status(500).json({ error: "Failed to fetch users with wallets" });
  }
}

export async function getActiveWalletVoucher(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user.id;
    const vouchers = await storage.getUserGiftCards(userId);
    const activeVoucher = vouchers
      .filter((v) => v.isActive)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    if (activeVoucher) {
      return res.json(activeVoucher);
    } else {
      return res.status(404).json({ error: 'No active wallet voucher found' });
    }
  } catch (error) {
    console.error('Error fetching active wallet voucher:', error);
    return res.status(500).json({ error: 'Failed to fetch active wallet voucher' });
  }
}

// POST /api/wallet/spend-redeemed
export async function spendRedeemedCoins(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { amount, orderId, description } = req.body;
    if (!amount || !orderId) return res.status(400).json({ error: 'Amount and orderId required' });
    const wallet = await storage.spendRedeemedCoinsAtCheckout(req.user.id, amount, orderId, description);
    return res.json(wallet);
  } catch (error) {
    console.error('Error spending redeemed coins:', error);
    return res.status(500).json({ error: 'Failed to spend redeemed coins' });
  }
}