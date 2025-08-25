import { db } from "../db";
import { products } from "@shared/schema";
import { sql, desc, eq, and, or, inArray } from "drizzle-orm";

/**
 * Simple recommendation engine that provides product suggestions based on:
 * 1. User's purchase history
 * 2. User's browsing history (via view tracking)
 * 3. User's cart items
 * 4. Similar products in the same category
 * 5. Popular products for new users
 */
export class RecommendationEngine {
  /**
   * Get personalized product recommendations for a user
   * @param userId The user ID to get recommendations for, or null for anonymous users
   * @param limit The maximum number of recommendations to return
   * @returns Array of recommended products
   */
  static async getPersonalizedRecommendations(
    userId: number | null,
    limit: number = 10
  ): Promise<any[]> {
    // If user is logged in, get personalized recommendations
    if (userId) {
      return await this.getRecommendationsForUser(userId, limit);
    }
    
    // For anonymous users, return popular products
    return await this.getPopularProducts(limit);
  }

  /**
   * Get recommendations for a specific product (similar products)
   * @param productId Product ID to get similar items for
   * @param limit Maximum number of similar products to return
   * @returns Array of similar products
   */
  static async getSimilarProducts(
    productId: number,
    limit: number = 6
  ): Promise<any[]> {
    // Get the product to find similar ones
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId));

    if (!product) {
      return [];
    }

    // Find products in the same category, excluding the current product
    const similarProducts = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.category, product.category),
          eq(products.approved, true),
          product.id !== undefined ? sql`${products.id} != ${product.id}` : undefined
        )
      )
      .limit(limit);

    return similarProducts;
  }

  /**
   * Get personalized recommendations for a logged-in user
   * @param userId User ID to get recommendations for
   * @param limit Maximum number of recommendations
   * @returns Array of recommended products
   */
  private static async getRecommendationsForUser(
    userId: number,
    limit: number
  ): Promise<any[]> {
    // Step 1: Get products from user's past purchases
    const purchasedProductIds = await this.getPurchasedProductIds(userId);
    
    // Step 2: Get products from user's cart
    const cartProductIds = await this.getCartProductIds(userId);
    
    // Step 3: Get products from the same categories as user's purchases and cart items
    const userCategories = await this.getUserPreferredCategories(userId);
    
    // Get recommendations based on categories user is interested in
    let recommendations: any[] = [];
    
    if (userCategories.length > 0) {
      recommendations = await db
        .select()
        .from(products)
        .where(
          and(
            inArray(products.category, userCategories),
            eq(products.approved, true),
            // Exclude products the user already purchased or has in cart
            purchasedProductIds.length > 0 ? 
              sql`${products.id} NOT IN (${sql.join(purchasedProductIds, sql`, `)})` : 
              undefined,
            cartProductIds.length > 0 ? 
              sql`${products.id} NOT IN (${sql.join(cartProductIds, sql`, `)})` : 
              undefined
          )
        )
        .orderBy(desc(products.id)) /* Sort by newest (highest ID) instead of rating */
        .limit(limit);
    }
    
    // If we don't have enough recommendations, fill with popular products
    if (recommendations.length < limit) {
      const additionalCount = limit - recommendations.length;
      const existingIds = recommendations.map(p => p.id);
      
      const popularProducts = await this.getPopularProducts(
        additionalCount,
        [...purchasedProductIds, ...cartProductIds, ...existingIds]
      );
      
      recommendations = [...recommendations, ...popularProducts];
    }
    
    return recommendations;
  }

  /**
   * Get products that the user has purchased
   * @param userId User ID
   * @returns Array of product IDs
   */
  private static async getPurchasedProductIds(userId: number): Promise<number[]> {
    const orderItemsResult = await db.execute(sql`
      SELECT DISTINCT oi.product_id
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.user_id = ${userId}
    `);
    
    return orderItemsResult.rows.map((row: any) => row.product_id);
  }

  /**
   * Get products in the user's cart
   * @param userId User ID
   * @returns Array of product IDs
   */
  private static async getCartProductIds(userId: number): Promise<number[]> {
    const cartItems = await db.execute(sql`
      SELECT product_id FROM carts
      WHERE user_id = ${userId}
    `);
    
    return cartItems.rows.map((row: any) => row.product_id);
  }

  /**
   * Get categories the user has shown interest in
   * @param userId User ID
   * @returns Array of category names
   */
  private static async getUserPreferredCategories(userId: number): Promise<string[]> {
    const categories = await db.execute(sql`
      SELECT DISTINCT p.category
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
      LEFT JOIN carts c ON p.id = c.product_id
      WHERE (o.user_id = ${userId} OR c.user_id = ${userId})
        AND p.category IS NOT NULL
    `);
    
    return categories.rows
      .map((row: any) => row.category)
      .filter((category: string) => category);
  }

  /**
   * Get popular products based on order frequency
   * @param limit Maximum number of products to return
   * @param excludeIds Product IDs to exclude
   * @returns Array of popular products
   */
  private static async getPopularProducts(
    limit: number = 10,
    excludeIds: number[] = []
  ): Promise<any[]> {
    // If we have products to exclude
    const excludeCondition = excludeIds.length > 0
      ? sql`AND p.id NOT IN (${sql.join(excludeIds, sql`, `)})`
      : sql``;
      
    // Get products ordered by popularity (order count)
    // Only show approved products that aren't drafts and aren't deleted
    const popularQuery = sql`
      SELECT p.*, COUNT(oi.id) as order_count
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      WHERE p.approved = true
      AND (p.is_draft IS NULL OR p.is_draft = false)
      AND p.deleted = false
      ${excludeCondition}
      GROUP BY p.id
      ORDER BY order_count DESC, p.id DESC /* Sort by newest (highest ID) as secondary criteria */
      LIMIT ${limit}
    `;
    
    const popularProducts = await db.execute(popularQuery);
    
    // If we don't have enough popular products, get latest products
    if (popularProducts.rows.length < limit) {
      const additionalLimit = limit - popularProducts.rows.length;
      const existingIds = popularProducts.rows.map((row: any) => row.id);
      const allExcludeIds = [...excludeIds, ...existingIds];
      
      const excludeLatestCondition = allExcludeIds.length > 0
        ? sql`AND id NOT IN (${sql.join(allExcludeIds, sql`, `)})`
        : sql``;
        
      const latestQuery = sql`
        SELECT * FROM products
        WHERE approved = true
        AND (is_draft IS NULL OR is_draft = false)
        AND deleted = false
        ${excludeLatestCondition}
        ORDER BY id DESC
        LIMIT ${additionalLimit}
      `;
      
      const latestProducts = await db.execute(latestQuery);
      return [...popularProducts.rows, ...latestProducts.rows];
    }
    
    return popularProducts.rows;
  }
}