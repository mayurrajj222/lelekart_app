import { db } from './db';
import { eq, and, desc, asc, isNull, or, sql, ilike, gte, lte, ne } from "drizzle-orm";
import { 
  users, 
  products, 
  productVariants,
  categories, 
  subcategories, 
  orders, 
  orderItems, 
  addresses,
  reviews,
  rewards,
  rewardTransactions,
  rewardRules,
  returnRequests
} from "../shared/schema";
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { pool } from './db';

const PgSession = connectPgSimple(session);

export const storage = {
  async getUser(id: number) {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0] || null;
  },
  async getUserByEmail(email: string) {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0] || null;
  },
  async getUserByUsername(username: string) {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0] || null;
  },
  async createUser(userData: any) {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  },
  sessionStore: new PgSession({
    pool,
    tableName: 'session',
    createTableIfMissing: true,
  }),

  // ========== Rewards Methods ==========
  async getUserRewards(userId: number): Promise<any> {
    return db.select().from(rewards).where(eq(rewards.userId, userId)).then(r => r[0] || null);
  },

  async createUserRewards(data: any): Promise<any> {
    return db.insert(rewards).values(data).returning().then(r => r[0] || null);
  },

  async updateUserRewards(userId: number, data: any): Promise<any> {
    return db.update(rewards).set(data).where(eq(rewards.userId, userId)).returning().then(r => r[0] || null);
  },

  async createRewardTransaction(data: any): Promise<any> {
    return db.insert(rewardTransactions).values(data).returning().then(r => r[0] || null);
  },

  async getRewardTransactionsByUserId(userId: number): Promise<any[]> {
    return db.select().from(rewardTransactions).where(eq(rewardTransactions.userId, userId)).orderBy(desc(rewardTransactions.transactionDate)).then(r => r);
  },

  async getAllRewardRules(): Promise<any[]> {
    return db.select().from(rewardRules).orderBy(desc(rewardRules.createdAt)).then(r => r);
  },

  async getActiveRewardRulesByType(type: string): Promise<any[]> {
    return db.select().from(rewardRules).where(and(eq(rewardRules.type, type), eq(rewardRules.active, true))).then(r => r);
  },

  // ========== Product Methods ==========
  async getProduct(id: number): Promise<any> {
    const result = await db.select().from(products).where(eq(products.id, id));
    return result[0] || null;
  },

  async getProductsByCategory(category: string, limit: number = 8): Promise<any[]> {
    const result = await db
      .select()
      .from(products)
      .where(and(
        eq(products.category, category),
        eq(products.approved, true)
      ))
      .limit(limit);
    return result;
  },

  async createProduct(productData: any): Promise<any> {
    const [product] = await db.insert(products).values(productData).returning();
    return product;
  },

  // ========== Product Variants Methods ==========
  async getProductVariants(productId: number): Promise<any[]> {
    const variants = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId));

    // Process variant images to parse JSON strings into arrays
    return variants.map((variant) => {
      const processedVariant = { ...variant } as any;
      
      if (variant.images) {
        try {
          if (
            typeof variant.images === "string" &&
            variant.images.trim().startsWith("[")
          ) {
            console.log(
              `Parsing variant ${variant.id} images from JSON string:`,
              variant.images
            );
            const parsedImages = JSON.parse(variant.images);
            processedVariant.images = Array.isArray(parsedImages)
              ? parsedImages
              : [];
            console.log(
              `Successfully parsed ${processedVariant.images.length} images for variant ${variant.id}`
            );
          } else {
            processedVariant.images = [];
          }
        } catch (error) {
          console.error(
            `Error parsing images for variant ${variant.id}:`,
            error
          );
          processedVariant.images = [];
        }
      } else {
        processedVariant.images = [];
      }

      return processedVariant;
    });
  },

  async getProductVariant(id: number): Promise<any> {
    const [variant] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, id));

    if (!variant) return undefined;

    // Process variant images to parse JSON strings into arrays
    const processedVariant = { ...variant } as any;
    
    if (variant.images) {
      try {
        if (
          typeof variant.images === "string" &&
          variant.images.trim().startsWith("[")
        ) {
          console.log(
            `Parsing single variant ${variant.id} images from JSON string:`,
            variant.images
          );
          const parsedImages = JSON.parse(variant.images);
          processedVariant.images = Array.isArray(parsedImages)
            ? parsedImages
            : [];
          console.log(
            `Successfully parsed ${processedVariant.images.length} images for single variant ${variant.id}`
          );
        } else {
          processedVariant.images = [];
        }
      } catch (error) {
        console.error(
          `Error parsing images for single variant ${variant.id}:`,
          error
        );
        processedVariant.images = [];
      }
    } else {
      processedVariant.images = [];
    }

    return processedVariant;
  },

  async createProductVariant(variantData: any): Promise<any> {
    const [variant] = await db.insert(productVariants).values(variantData).returning();
    return variant;
  },

  async updateProductVariant(id: number, variantData: any): Promise<any> {
    console.log(`Starting updateProductVariant for ID ${id}`, variantData);

    // Process the variant data to handle images properly
    const processedVariant = { ...variantData };
    
    // If images are provided, ensure they're stored as JSON
    if (processedVariant.images && Array.isArray(processedVariant.images)) {
      processedVariant.images = JSON.stringify(processedVariant.images);
    }

    console.log(`Images field for variant ${id}:`, processedVariant.images);

    // Update the variant in the database
    const [updatedVariant] = await db
      .update(productVariants)
      .set(processedVariant)
      .where(eq(productVariants.id, id))
      .returning();

    if (!updatedVariant) {
      throw new Error(`Variant with ID ${id} not found`);
    }

    // Process the images field in the response
    if (updatedVariant.images) {
      try {
        const parsedImages = JSON.parse(updatedVariant.images);
        updatedVariant.images = Array.isArray(parsedImages) ? parsedImages : [];
      } catch (error) {
        console.error(`Error parsing images for updated variant ${id}:`, error);
        updatedVariant.images = [];
      }
    } else {
      updatedVariant.images = [];
    }

    return updatedVariant;
  },

  async deleteProductVariant(id: number): Promise<void> {
    await db.delete(productVariants).where(eq(productVariants.id, id));
  },

  async updateProductVariantStock(variantId: number, newStock: number): Promise<void> {
    await db
      .update(productVariants)
      .set({ stock: newStock })
      .where(eq(productVariants.id, variantId));
  },

  // ========== Review Methods ==========
  async getProductReviews(productId: number): Promise<any[]> {
    return db.select().from(reviews).where(eq(reviews.productId, productId)).orderBy(desc(reviews.createdAt));
  },

  async createReview(reviewData: any): Promise<any> {
    const [review] = await db.insert(reviews).values(reviewData).returning();
    return review;
  },

  // ========== Cart Methods ==========
  async removeFromCart(userId: number, cartItemId: number): Promise<void> {
    // This is a placeholder - implement actual cart removal logic
    console.log(`Removing cart item ${cartItemId} for user ${userId}`);
  },

  async clearCart(userId: number): Promise<void> {
    // This is a placeholder - implement actual cart clearing logic
    console.log(`Clearing cart for user ${userId}`);
  },

  // ========== Order Methods ==========
  async getOrders(userId: number): Promise<any[]> {
    return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  },

  // ========== Address Methods ==========
  async getAddresses(userId: number): Promise<any[]> {
    return db.select().from(addresses).where(eq(addresses.userId, userId)).then(r => r);
  },

  async createAddress(addressData: any): Promise<any> {
    const [address] = await db.insert(addresses).values(addressData).returning();
    return address;
  },

  async updateAddress(id: number, addressData: any): Promise<any> {
    const [address] = await db.update(addresses).set(addressData).where(eq(addresses.id, id)).returning();
    return address;
  },

  async deleteAddress(id: number): Promise<void> {
    await db.delete(addresses).where(eq(addresses.id, id));
  },

  // ========== Seller Methods ==========
  async getSellerDashboardData(sellerId: number): Promise<any> {
    // This method is not fully implemented in the original file,
    // so it's added here as a placeholder.
    // In a real scenario, you would query the database for seller-specific data.
    return { message: `Seller dashboard data for sellerId: ${sellerId}` };
  },

  // ========== Wallet Methods ========== 
  async getUserWallet(userId: number): Promise<any> {
    const result = await db.select().from('wallets').where(eq('user_id', userId));
    return result[0] || null;
  },

  async createUserWalletIfNotExists(userId: number): Promise<any> {
    let wallet = await this.getUserWallet(userId);
    if (!wallet) {
      const [newWallet] = await db.insert('wallets').values({ user_id: userId, balance: 0 }).returning();
      wallet = newWallet;
    }
    return wallet;
  },

  async deductFromWallet(userId: number, amount: number, description: string): Promise<any> {
    const wallet = await this.createUserWalletIfNotExists(userId);
    if (wallet.balance < amount) throw new Error('Insufficient wallet balance');
    const newBalance = wallet.balance - amount;
    await db.update('wallets').set({ balance: newBalance }).where(eq('user_id', userId));
    // Optionally, add a wallet transaction record here
    return { ...wallet, balance: newBalance };
  },

  // ========== Return Management Methods ==========
  async createReturnRequest(data: any): Promise<any> {
    const [returnRequest] = await db.insert(returnRequests).values(data).returning();
    return returnRequest;
  },

  async getReturnRequestsByBuyerId(buyerId: number, limit: number = 10, offset: number = 0): Promise<any[]> {
    return db.select()
      .from(returnRequests)
      .where(eq(returnRequests.buyerId, buyerId))
      .orderBy(desc(returnRequests.createdAt))
      .limit(limit)
      .offset(offset);
  },

  async getReturnRequestsBySellerId(sellerId: number, limit: number = 10, offset: number = 0): Promise<any[]> {
    return db.select()
      .from(returnRequests)
      .where(eq(returnRequests.sellerId, sellerId))
      .orderBy(desc(returnRequests.createdAt))
      .limit(limit)
      .offset(offset);
  },

  async getReturnRequests(filters: any = {}): Promise<any[]> {
    let query = db.select().from(returnRequests);
    
    if (filters.status) {
      query = query.where(eq(returnRequests.status, filters.status));
    }
    
    if (filters.buyerId) {
      query = query.where(eq(returnRequests.buyerId, filters.buyerId));
    }
    
    if (filters.sellerId) {
      query = query.where(eq(returnRequests.sellerId, filters.sellerId));
    }
    
    return query.orderBy(desc(returnRequests.createdAt));
  },

  async updateReturnRequest(id: number, data: any): Promise<any> {
    const [returnRequest] = await db.update(returnRequests)
      .set(data)
      .where(eq(returnRequests.id, id))
      .returning();
    return returnRequest;
  },

  async getReturnRequest(id: number): Promise<any> {
    const result = await db.select().from(returnRequests).where(eq(returnRequests.id, id));
    return result[0] || null;
  },

  async getOrdersMarkedForReturn(): Promise<any[]> {
    return db.select()
      .from(orders)
      .where(eq(orders.status, 'marked_for_return'))
      .orderBy(desc(orders.date));
  },

  async markOrderForReturn(orderId: number): Promise<any> {
    const [order] = await db.update(orders)
      .set({ status: 'marked_for_return' })
      .where(eq(orders.id, orderId))
      .returning();
    return order;
  },

  // ========== End Return Management Methods ==========
}; 