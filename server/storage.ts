import { db } from './db';
import { eq, and, desc, asc, isNull, or, sql, ilike, gte, lte, ne } from "drizzle-orm";
import { 
  users, 
  products, 
  categories, 
  subcategories, 
  orders, 
  orderItems, 
  addresses,
  reviews,
  rewards,
  rewardTransactions,
  rewardRules
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
    return db.select().from(rewardTransactions).where(eq(rewardTransactions.userId, userId)).orderBy(desc(rewardTransactions.transactionDate)).all();
  }

  async getAllRewardRules(): Promise<any[]> {
    return db.select().from(rewardRules).orderBy(desc(rewardRules.createdAt)).all();
  }

  async getActiveRewardRulesByType(type: string): Promise<any[]> {
    return db.select().from(rewardRules).where(and(eq(rewardRules.type, type), eq(rewardRules.active, true))).all();
  }

  // ========== Order Methods ==========
  async createOrder(orderData: any): Promise<any> {
    const [order] = await db.insert(orders).values(orderData).returning();
    return order;
  },

  async createOrderItem(orderItemData: any): Promise<any> {
    const [orderItem] = await db.insert(orderItems).values(orderItemData).returning();
    return orderItem;
  },

  async getOrderItems(orderId: number): Promise<any[]> {
    return db.select().from(orderItems).where(eq(orderItems.orderId, orderId)).all();
  },

  // ========== Address Methods ==========
  async getAddresses(userId: number): Promise<any[]> {
    return db.select().from(addresses).where(eq(addresses.userId, userId)).all();
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
}; 