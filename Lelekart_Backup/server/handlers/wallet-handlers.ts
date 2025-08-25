import { db } from '../db';
import { wallets, walletTransactions, walletSettings, SelectWallet, SelectWalletTransaction, SelectWalletSettings, giftCards } from '@shared/schema';
import { eq, and, gt, lte, desc, sql } from 'drizzle-orm';
import { randomBytes } from 'crypto';

/**
 * Get wallet settings
 */
export async function getWalletSettings(): Promise<SelectWalletSettings | null> {
  try {
    const [settings] = await db.select().from(walletSettings).limit(1);
    return settings || null;
  } catch (error) {
    console.error('Error getting wallet settings:', error);
    throw error;
  }
}

/**
 * Update wallet settings
 */
export async function updateWalletSettings(settingsData: Partial<SelectWalletSettings>): Promise<SelectWalletSettings> {
  try {
    const [settings] = await db.select().from(walletSettings).limit(1);
    
    if (!settings) {
      // Create settings if none exist
      const [newSettings] = await db.insert(walletSettings).values({
        ...settingsData,
        updatedAt: new Date(),
      }).returning();
      return newSettings;
    }
    
    // Update existing settings
    const [updatedSettings] = await db
      .update(walletSettings)
      .set({
        ...settingsData,
        updatedAt: new Date(),
      })
      .where(eq(walletSettings.id, settings.id))
      .returning();
    
    return updatedSettings;
  } catch (error) {
    console.error('Error updating wallet settings:', error);
    throw error;
  }
}

/**
 * Get user wallet
 */
export async function getUserWallet(userId: number): Promise<SelectWallet | null> {
  try {
    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId));
    
    return wallet || null;
  } catch (error) {
    console.error(`Error getting wallet for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Create user wallet if it doesn't exist
 */
export async function createUserWalletIfNotExists(userId: number): Promise<SelectWallet> {
  try {
    let wallet = await getUserWallet(userId);
    
    if (!wallet) {
      const [newWallet] = await db
        .insert(wallets)
        .values({
          userId,
          balance: 0,
          lifetimeEarned: 0,
          lifetimeRedeemed: 0,
        })
        .returning();
      
      wallet = newWallet;
    }
    
    return wallet;
  } catch (error) {
    console.error(`Error creating wallet for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Add coins to user wallet
 */
export async function addCoinsToWallet(
  userId: number, 
  amount: number, 
  referenceType: string, 
  referenceId?: number, 
  description?: string
): Promise<SelectWallet> {
  try {
    // Get or create wallet
    const wallet = await createUserWalletIfNotExists(userId);
    
    // Check wallet settings for coin expiry
    const settings = await getWalletSettings();
    const expiryDays = settings?.coinExpiryDays || 90;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);
    
    // Start transaction
    return await db.transaction(async (trx) => {
      // Add transaction record
      await trx.insert(walletTransactions).values({
        walletId: wallet.id,
        amount,
        transactionType: 'CREDIT',
        referenceType,
        referenceId,
        description,
        expiresAt,
      });
      
      // Update wallet balance
      const [updatedWallet] = await trx
        .update(wallets)
        .set({
          balance: wallet.balance + amount,
          lifetimeEarned: wallet.lifetimeEarned + amount,
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, wallet.id))
        .returning();
      
      return updatedWallet;
    });
  } catch (error) {
    console.error(`Error adding coins to wallet for user ${userId}:`, error);
    throw error;
  }
}

/**
 * First purchase reward
 * Add coins to user wallet for their first order
 */
export async function processFirstPurchaseReward(userId: number, orderId: number): Promise<SelectWallet | null> {
  try {
    // Check if this is the user's first purchase
    const previousTransactions = await db
      .select()
      .from(walletTransactions)
      .innerJoin(wallets, eq(walletTransactions.walletId, wallets.id))
      .where(
        and(
          eq(wallets.userId, userId),
          eq(walletTransactions.referenceType, 'FIRST_PURCHASE')
        )
      );
    
    // If user already has a first purchase reward, don't give another
    if (previousTransactions.length > 0) {
      return null;
    }
    
    // Get wallet settings
    const settings = await getWalletSettings();
    if (!settings || !settings.isEnabled) {
      return null;
    }
    
    // Add first purchase reward
    const coinsToAdd = settings.firstPurchaseCoins;
    const description = 'First purchase reward';
    
    return await addCoinsToWallet(
      userId,
      coinsToAdd,
      'FIRST_PURCHASE',
      orderId,
      description
    );
  } catch (error) {
    console.error(`Error processing first purchase reward for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Refund coins to wallet for cancelled or returned orders
 */
export async function refundCoinsToWallet(
  userId: number,
  amount: number,
  referenceType: string,
  referenceId?: number,
  description?: string
): Promise<{ wallet: SelectWallet }> {
  try {
    // Get wallet and settings
    const wallet = await getUserWallet(userId);
    const settings = await getWalletSettings();
    
    if (!wallet || !settings || !settings.isEnabled) {
      throw new Error('Wallet not found or feature disabled');
    }
    
    // Start transaction
    const updatedWallet = await db.transaction(async (trx) => {
      // Add transaction record
      await trx.insert(walletTransactions).values({
        walletId: wallet.id,
        amount: amount, // Positive amount for credit/refund
        transactionType: 'REFUND',
        referenceType,
        referenceId,
        description,
      });
      
      // Update wallet balance
      const [updatedWallet] = await trx
        .update(wallets)
        .set({
          balance: wallet.balance + amount,
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, wallet.id))
        .returning();
      
      return updatedWallet;
    });
    
    return {
      wallet: updatedWallet
    };
  } catch (error) {
    console.error(`Error refunding coins to wallet for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Redeem coins from wallet
 */
export async function redeemCoinsFromWallet(
  userId: number,
  amount: number,
  referenceType: string,
  referenceId?: number,
  description?: string
): Promise<{ wallet: SelectWallet, discountAmount: number, voucherCode: string }> {
  try {
    // Get wallet and settings
    const wallet = await getUserWallet(userId);
    const settings = await getWalletSettings();
    
    if (!wallet || !settings || !settings.isEnabled) {
      throw new Error('Wallet not found or feature disabled');
    }
    
    // Validate amount is within limits
    if (amount > wallet.balance) {
      throw new Error('Insufficient coins in wallet');
    }
    
    if (amount > settings.maxRedeemableCoins) {
      throw new Error(`Maximum redeemable coins is ${settings.maxRedeemableCoins}`);
    }
    
    // Calculate discount amount based on coin-to-currency ratio
    const discountAmount = parseFloat((amount * parseFloat(settings.coinToCurrencyRatio.toString())).toFixed(2));
    
    // Generate a unique voucher code
    const voucherCode = 'WALLET-' + randomBytes(6).toString('hex').toUpperCase();
    
    // Start transaction
    const updatedWallet = await db.transaction(async (trx) => {
      // Add transaction record
      await trx.insert(walletTransactions).values({
        walletId: wallet.id,
        amount: -amount, // Negative amount for deduction
        transactionType: 'DEBIT',
        referenceType,
        referenceId,
        description,
      });
      
      // Move coins from balance to redeemedBalance and update lifetimeRedeemed
      const [updatedWallet] = await trx
        .update(wallets)
        .set({
          balance: wallet.balance - amount,
          redeemedBalance: (wallet.redeemedBalance || 0) + amount,
          lifetimeRedeemed: (wallet.lifetimeRedeemed || 0) + amount,
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, wallet.id))
        .returning();
      
      // Create a voucher (gift card) for this redemption
      await trx.insert(giftCards).values({
        code: voucherCode,
        initialValue: Math.round(discountAmount),
        currentBalance: Math.round(discountAmount),
        issuedTo: userId,
        isActive: true,
        expiryDate: null,
        createdAt: new Date(),
        lastUsed: null,
        recipientEmail: null,
        recipientName: null,
        message: 'Wallet redemption voucher',
        designTemplate: 'default',
      });
      
      return updatedWallet;
    });
    
    return {
      wallet: updatedWallet,
      discountAmount,
      voucherCode
    };
  } catch (error) {
    console.error(`Error redeeming coins from wallet for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get user wallet transactions with pagination
 */
export async function getUserWalletTransactions(
  userId: number,
  page: number = 1,
  limit: number = 10
): Promise<{ transactions: SelectWalletTransaction[], total: number }> {
  try {
    const offset = (page - 1) * limit;
    
    // Get user wallet
    const wallet = await getUserWallet(userId);
    if (!wallet) {
      return { transactions: [], total: 0 };
    }
    
    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(walletTransactions)
      .where(eq(walletTransactions.walletId, wallet.id));
    
    const total = totalResult[0]?.count || 0;
    
    // Get transactions with pagination
    const transactions = await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.walletId, wallet.id))
      .orderBy(desc(walletTransactions.createdAt))
      .limit(limit)
      .offset(offset);
    
    return {
      transactions,
      total
    };
  } catch (error) {
    console.error(`Error getting wallet transactions for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Process expired coins
 * This should be run periodically to expire coins
 */
export async function processExpiredCoins(): Promise<number> {
  try {
    const now = new Date();
    let expiredCoinsCount = 0;
    
    // Find all transactions with coins that have expired
    const expiredTransactions = await db
      .select()
      .from(walletTransactions)
      .where(
        and(
          eq(walletTransactions.transactionType, 'CREDIT'),
          lte(walletTransactions.expiresAt, now),
          // Only include transactions that haven't been marked as expired yet
          sql`NOT EXISTS (
            SELECT 1 FROM ${walletTransactions} as wt
            WHERE wt.reference_type = 'EXPIRED'
            AND wt.reference_id = ${walletTransactions.id}
          )`
        )
      );
    
    // Process each expired transaction
    for (const transaction of expiredTransactions) {
      await db.transaction(async (trx) => {
        // Create an "EXPIRED" transaction that references the original
        await trx.insert(walletTransactions).values({
          walletId: transaction.walletId,
          amount: -transaction.amount, // Negative amount to reverse the credit
          transactionType: 'EXPIRED',
          referenceType: 'EXPIRED',
          referenceId: transaction.id,
          description: `Expired coins from transaction #${transaction.id}`,
        });
        
        // Update wallet balance
        const [wallet] = await trx
          .select()
          .from(wallets)
          .where(eq(wallets.id, transaction.walletId));
        
        if (wallet) {
          await trx
            .update(wallets)
            .set({
              balance: Math.max(0, wallet.balance - transaction.amount), // Ensure balance doesn't go negative
              updatedAt: new Date(),
            })
            .where(eq(wallets.id, transaction.walletId));
          
          expiredCoinsCount += transaction.amount;
        }
      });
    }
    
    return expiredCoinsCount;
  } catch (error) {
    console.error('Error processing expired coins:', error);
    throw error;
  }
}

/**
 * Manual adjustment by admin
 */
export async function manualAdjustWallet(
  userId: number,
  amount: number,
  description: string
): Promise<SelectWallet> {
  try {
    if (amount === 0) {
      throw new Error('Adjustment amount cannot be zero');
    }
    
    const wallet = await createUserWalletIfNotExists(userId);
    
    return await db.transaction(async (trx) => {
      // Add transaction record
      await trx.insert(walletTransactions).values({
        walletId: wallet.id,
        amount,
        transactionType: amount > 0 ? 'CREDIT' : 'DEBIT',
        referenceType: 'MANUAL_ADJUSTMENT',
        description,
      });
      
      // Update wallet balance
      const [updatedWallet] = await trx
        .update(wallets)
        .set({
          balance: wallet.balance + amount,
          lifetimeEarned: amount > 0 ? wallet.lifetimeEarned + amount : wallet.lifetimeEarned,
          lifetimeRedeemed: amount < 0 ? wallet.lifetimeRedeemed - amount : wallet.lifetimeRedeemed,
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, wallet.id))
        .returning();
      
      return updatedWallet;
    });
  } catch (error) {
    console.error(`Error making manual adjustment to wallet for user ${userId}:`, error);
    throw error;
  }
}

// Add a new function to spend redeemed coins at checkout
export async function spendRedeemedCoinsAtCheckout(
  userId: number,
  amount: number,
  orderId: number,
  description?: string
): Promise<SelectWallet> {
  try {
    const wallet = await getUserWallet(userId);
    if (!wallet) throw new Error('Wallet not found');
    if (amount > wallet.redeemedBalance) throw new Error('Not enough redeemed coins');
    // Deduct from redeemedBalance
    const [updatedWallet] = await db
      .update(wallets)
      .set({
        redeemedBalance: wallet.redeemedBalance - amount,
        updatedAt: new Date(),
      })
      .where(eq(wallets.id, wallet.id))
      .returning();
    // Add transaction record
    await db.insert(walletTransactions).values({
      walletId: wallet.id,
      amount: -amount,
      transactionType: 'REDEEMED_SPENT',
      referenceType: 'ORDER',
      referenceId: orderId,
      description: description || 'Spent redeemed coins at checkout',
    });
    return updatedWallet;
  } catch (error) {
    console.error(`Error spending redeemed coins for user ${userId}:`, error);
    throw error;
  }
}