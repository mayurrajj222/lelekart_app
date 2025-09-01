import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../db';
import {
  products,
  users,
  userActivities,
  categories,
  productRelationships,
  aiAssistantConversations,
  userSizePreferences,
  orderItems,
  orders,
  carts,
  OrderItem,
  Product,
  Review,
  User
} from '@shared/schema';
import { eq, and, desc, sql, like, ilike, or, gte, lte, isNull, isNotNull, not } from 'drizzle-orm';
import { UUID } from 'crypto';
import { randomUUID } from 'crypto';
import * as geminiAi from './gemini-ai';

// Initialize Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
// Use the most advanced model - Gemini 1.5 Pro
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

// Generate a session ID for tracking user activity
export function generateSessionId(): string {
  return randomUUID();
}

// Track user activity for personalization
export async function trackUserActivity(
  userId: number | null,
  sessionId: string,
  activityType: string,
  productId?: number,
  categoryId?: number,
  searchQuery?: string,
  additionalData?: Record<string, any>
) {
  try {
    await db.insert(userActivities).values({
      userId: userId,
      sessionId: sessionId,
      activityType: activityType,
      productId: productId,
      categoryId: categoryId,
      searchQuery: searchQuery,
      additionalData: additionalData ? JSON.stringify(additionalData) : null,
    });
    return true;
  } catch (error) {
    console.error('Error tracking user activity:', error);
    return false;
  }
}

// Get personalized product recommendations based on user history
export async function getPersonalizedRecommendations(
  userId: number | null,
  sessionId: string | null,
  limit: number = 10
): Promise<Product[]> {
  try {
    // For logged-in users, use their browsing history
    if (userId) {
      // First check for explicit product relationships (complementary products)
      const relatedProducts = await db
        .select({
          productId: productRelationships.relatedProductId,
          strength: productRelationships.strength
        })
        .from(productRelationships)
        .where(
          and(
            eq(productRelationships.relationshipType, 'complementary'),
            // Find products that are related to products this user has:
            // 1. Viewed recently
            // 2. Added to cart 
            // 3. Purchased
            sql`${productRelationships.sourceProductId} IN (
              SELECT DISTINCT product_id FROM user_activities 
              WHERE user_id = ${userId} 
              AND activity_type IN ('view', 'add_to_cart', 'purchase')
              ORDER BY timestamp DESC
              LIMIT 20
            )`
          )
        )
        .orderBy(desc(productRelationships.strength))
        .limit(limit);
        
      if (relatedProducts.length > 0) {
        // Get the full product details for the related products
        const productIds = relatedProducts.map(p => p.productId);
        const recommendedProducts = await db
          .select()
          .from(products)
          .where(
            and(
              sql`${products.id} IN (${productIds.join(',')})`,
              eq(products.approved, true)
            )
          )
          .limit(limit);
          
        if (recommendedProducts.length > 0) {
          return recommendedProducts;
        }
      }
      
      // If no related products found, get products from categories the user has shown interest in
      const userCategories = await db
        .select({
          categoryId: userActivities.categoryId,
          count: sql<number>`COUNT(*)`.as('count')
        })
        .from(userActivities)
        .where(
          and(
            eq(userActivities.userId, userId),
            isNotNull(userActivities.categoryId),
            sql`${userActivities.timestamp} > NOW() - INTERVAL '30 days'`
          )
        )
        .groupBy(userActivities.categoryId)
        .orderBy(desc(sql`count`))
        .limit(5);
        
      if (userCategories.length > 0) {
        const categoryIds = userCategories.map(c => c.categoryId);
        const categoryNames = await db
          .select({
            id: categories.id,
            name: categories.name
          })
          .from(categories)
          .where(sql`${categories.id} IN (${categoryIds.filter(Boolean).join(',')})`);
          
        const categoryNamesMap = new Map(categoryNames.map(c => [c.id, c.name]));
        
        let recommendedProducts: Product[] = [];
        
        for (const category of userCategories) {
          if (!category.categoryId) continue;
          
          const categoryName = categoryNamesMap.get(category.categoryId);
          if (!categoryName) continue;
          
          const categoryProducts = await db
            .select()
            .from(products)
            .where(
              and(
                eq(products.approved, true),
                ilike(products.category, categoryName)
              )
            )
            .orderBy(desc(products.id)) // Newest products first
            .limit(Math.ceil(limit / userCategories.length));
            
          recommendedProducts = [...recommendedProducts, ...categoryProducts];
        }
        
        if (recommendedProducts.length > 0) {
          // De-duplicate in case there are products in multiple categories
          const uniqueProducts = Array.from(new Map(recommendedProducts.map(p => [p.id, p])).values());
          return uniqueProducts.slice(0, limit);
        }
      }
    }
    
    // For both logged-in and anonymous users, fallback to popular products
    const popularProducts = await db
      .select()
      .from(products)
      .where(eq(products.approved, true))
      .orderBy(desc(products.id)) // Newest first as a simple proxy for popularity
      .limit(limit);
      
    return popularProducts;
  } catch (error) {
    console.error('Error getting personalized recommendations:', error);
    return [];
  }
}

// Get complementary products (frequently bought together)
export async function getComplementaryProducts(productId: number, limit: number = 5): Promise<Product[]> {
  try {
    // First, check explicitly defined complementary relationships
    const complementaryProducts = await db
      .select({
        productId: productRelationships.relatedProductId,
        strength: productRelationships.strength
      })
      .from(productRelationships)
      .where(
        and(
          eq(productRelationships.sourceProductId, productId),
          eq(productRelationships.relationshipType, 'complementary')
        )
      )
      .orderBy(desc(productRelationships.strength))
      .limit(limit);
      
    if (complementaryProducts.length > 0) {
      const productIds = complementaryProducts.map(p => p.productId);
      const products = await db
        .select()
        .from(products)
        .where(
          and(
            sql`${products.id} IN (${productIds.join(',')})`,
            eq(products.approved, true)
          )
        )
        .limit(limit);
        
      if (products.length > 0) {
        return products;
      }
    }
    
    // If no explicit relationships, find products frequently purchased together
    const frequentlyBoughtTogether = await db.execute(sql`
      SELECT p.* 
      FROM products p
      JOIN order_items oi1 ON p.id = oi1.product_id
      WHERE oi1.order_id IN (
        SELECT DISTINCT oi2.order_id
        FROM order_items oi2
        WHERE oi2.product_id = ${productId}
      )
      AND p.id != ${productId}
      AND p.approved = true
      GROUP BY p.id
      ORDER BY COUNT(*) DESC
      LIMIT ${limit}
    `);
    
    if (frequentlyBoughtTogether.length > 0) {
      return frequentlyBoughtTogether as Product[];
    }
    
    // Fallback to same category products
    const productDetails = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);
      
    if (productDetails.length > 0) {
      const category = productDetails[0].category;
      
      const similarProducts = await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.approved, true),
            ilike(products.category, category),
            not(eq(products.id, productId))
          )
        )
        .orderBy(desc(products.id)) // Most recent first
        .limit(limit);
        
      return similarProducts;
    }
    
    return [];
  } catch (error) {
    console.error('Error getting complementary products:', error);
    return [];
  }
}

// Get size recommendations based on user's purchase history
export async function getSizeRecommendations(
  userId: number,
  productId: number,
  category?: string
): Promise<{ recommendedSize: string | null, confidence: number, message: string }> {
  try {
    if (!userId) {
      return {
        recommendedSize: null,
        confidence: 0,
        message: "Sign in to get personalized size recommendations"
      };
    }
    
    const productInfo = await db
      .select({
        category: products.category,
        size: products.size
      })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);
      
    if (productInfo.length === 0 || !productInfo[0].size) {
      return {
        recommendedSize: null,
        confidence: 0,
        message: "Size information not available for this product"
      };
    }
    
    const productCategory = category || productInfo[0].category;
    const availableSizes = productInfo[0].size.split(',').map(s => s.trim());
    
    // Check for explicit user size preferences
    const sizePreferences = await db
      .select()
      .from(userSizePreferences)
      .where(
        and(
          eq(userSizePreferences.userId, userId),
          ilike(userSizePreferences.category, productCategory)
        )
      )
      .limit(1);
      
    if (sizePreferences.length > 0) {
      const preferredSize = sizePreferences[0].size;
      const closestSize = findClosestSize(preferredSize, availableSizes);
      
      return {
        recommendedSize: closestSize,
        confidence: 0.9,
        message: `Based on your saved preferences for ${productCategory}`
      };
    }
    
    // If no explicit preferences, check past purchase history
    const pastPurchases = await db.execute(sql`
      SELECT p.size, COUNT(*) as purchase_count
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = ${userId}
      AND p.category = ${productCategory}
      AND p.size IS NOT NULL
      GROUP BY p.size
      ORDER BY purchase_count DESC
      LIMIT 1
    `);
    
    if (pastPurchases.length > 0) {
      const pastSize = (pastPurchases[0] as any).size;
      const closestSize = findClosestSize(pastSize, availableSizes);
      
      return {
        recommendedSize: closestSize,
        confidence: 0.8,
        message: `Based on your previous ${productCategory} purchases`
      };
    }
    
    // If no history, suggest the most common size
    if (availableSizes.length > 0) {
      const midIndex = Math.floor(availableSizes.length / 2);
      return {
        recommendedSize: availableSizes[midIndex],
        confidence: 0.3,
        message: "Based on average customer size selection"
      };
    }
    
    return {
      recommendedSize: null,
      confidence: 0,
      message: "Not enough information to make a recommendation"
    };
  } catch (error) {
    console.error('Error getting size recommendations:', error);
    return {
      recommendedSize: null,
      confidence: 0,
      message: "Unable to generate size recommendation"
    };
  }
}

// Helper function to find the closest size from available options
function findClosestSize(targetSize: string, availableSizes: string[]): string {
  if (availableSizes.includes(targetSize)) {
    return targetSize;
  }
  
  // For numeric sizes (like 40, 42, etc.)
  if (/^\d+$/.test(targetSize) && availableSizes.some(s => /^\d+$/.test(s))) {
    const targetNum = parseInt(targetSize, 10);
    const numericSizes = availableSizes
      .filter(s => /^\d+$/.test(s))
      .map(s => parseInt(s, 10));
      
    numericSizes.sort((a, b) => Math.abs(a - targetNum) - Math.abs(b - targetNum));
    return numericSizes[0].toString();
  }
  
  // For letter sizes (S, M, L, etc.)
  const sizeOrder = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  
  if (sizeOrder.includes(targetSize) && availableSizes.some(s => sizeOrder.includes(s))) {
    const targetIndex = sizeOrder.indexOf(targetSize);
    
    const letterSizes = availableSizes.filter(s => sizeOrder.includes(s));
    letterSizes.sort((a, b) => {
      const aIndex = sizeOrder.indexOf(a);
      const bIndex = sizeOrder.indexOf(b);
      return Math.abs(aIndex - targetIndex) - Math.abs(bIndex - targetIndex);
    });
    
    return letterSizes[0];
  }
  
  // Default: return first available size
  return availableSizes[0];
}

// Create or update a conversation with the AI assistant
export async function createOrUpdateConversation(
  userId: number | null,
  sessionId: string,
  productId: number | null,
  categoryId: number | null,
  messages: { role: string, content: string }[]
): Promise<number> {
  try {
    // Check if conversation exists
    const existingConversation = await db
      .select()
      .from(aiAssistantConversations)
      .where(
        and(
          userId ? eq(aiAssistantConversations.userId, userId) : isNull(aiAssistantConversations.userId),
          eq(aiAssistantConversations.sessionId, sessionId),
          productId ? eq(aiAssistantConversations.productId, productId) : isNull(aiAssistantConversations.productId),
          categoryId ? eq(aiAssistantConversations.categoryId, categoryId) : isNull(aiAssistantConversations.categoryId)
        )
      )
      .limit(1);
      
    // Format as conversation history
    const conversationHistory = JSON.stringify(messages);
    
    if (existingConversation.length > 0) {
      // Update existing conversation
      await db
        .update(aiAssistantConversations)
        .set({
          conversationHistory: conversationHistory,
          updatedAt: new Date()
        })
        .where(eq(aiAssistantConversations.id, existingConversation[0].id));
        
      return existingConversation[0].id;
    } else {
      // Create new conversation
      const newConversation = await db
        .insert(aiAssistantConversations)
        .values({
          userId: userId,
          sessionId: sessionId,
          productId: productId,
          categoryId: categoryId,
          conversationHistory: conversationHistory
        })
        .returning();
        
      return newConversation[0].id;
    }
  } catch (error) {
    console.error('Error saving conversation:', error);
    return 0;
  }
}

// Generate AI response to user query
/**
 * Generate AI response to user query with keyword detection for immediate product recommendations
 */
export async function getAIResponse(
  messages: { role: string, content: string }[],
  contextInfo?: {
    userId?: number,
    productId?: number,
    categoryId?: number,
    sessionId: string
  }
): Promise<string> {
  try {
    // Base system prompt
    let systemPrompt = `You are LeleKart's AI Shopping Assistant, designed to provide friendly, helpful shopping advice.
    
Your goals are to:
1. Help customers find products they will love
2. Give honest, balanced advice about products
3. Suggest complementary items that make sense
4. Help with sizing and fit questions

IMPORTANT INSTRUCTIONS:
- When a user mentions ANY product category or item, IMMEDIATELY suggest specific products rather than asking follow-up questions
- Show product recommendations in your first response whenever possible
- Keep responses concise and conversational
- If you don't know something, say so rather than making up information
`;

    // Extract the latest user message
    const latestUserMessage = messages.length > 0 && messages[messages.length - 1].role === 'user'
      ? messages[messages.length - 1].content
      : '';
    
    // Product keywords dictionary
    const productKeywords = [
      'phone', 'mobile', 'smartphone', 'iphone', 'samsung', 'electronics', 
      'laptop', 'computer', 'tablet', 'headphone', 'earphone', 'earbuds',
      'tv', 'television', 'monitor', 'camera', 'watch', 'smartwatch',
      'clothes', 'clothing', 'shirt', 't-shirt', 'tshirt', 'jeans', 'pants', 'dress',
      'shoes', 'sneakers', 'footwear', 'sandals', 'boots',
      'furniture', 'sofa', 'chair', 'table', 'bed', 'mattress',
      'kitchen', 'appliance', 'refrigerator', 'fridge', 'oven', 'microwave',
      'beauty', 'makeup', 'cosmetics', 'skincare', 'perfume', 'fragrance',
      'toys', 'game', 'sports', 'fitness', 'exercise', 'yoga',
      'book', 'novel', 'textbook',
      'bag', 'backpack', 'purse', 'wallet', 'luggage',
      'jewelry', 'necklace', 'ring', 'earring', 'bracelet',
      'baby', 'kids', 'children'
    ];
    
    // Map keywords to database categories
    const categoryMapping: Record<string, string> = {
      'phone': 'Electronics', 'mobile': 'Electronics', 'smartphone': 'Electronics',
      'iphone': 'Electronics', 'samsung': 'Electronics', 'electronics': 'Electronics',
      'laptop': 'Electronics', 'computer': 'Electronics', 'tablet': 'Electronics',
      'headphone': 'Electronics', 'earphone': 'Electronics', 'earbuds': 'Electronics',
      'tv': 'Electronics', 'television': 'Electronics', 'monitor': 'Electronics',
      'camera': 'Electronics', 'watch': 'Electronics', 'smartwatch': 'Electronics',
      
      'clothes': 'Fashion', 'clothing': 'Fashion', 'shirt': 'Fashion',
      't-shirt': 'Fashion', 'tshirt': 'Fashion', 'jeans': 'Fashion',
      'pants': 'Fashion', 'dress': 'Fashion', 
      'shoes': 'Footwear', 'sneakers': 'Footwear', 'footwear': 'Footwear',
      'sandals': 'Footwear', 'boots': 'Footwear',
      
      'furniture': 'Home', 'sofa': 'Home', 'chair': 'Home',
      'table': 'Home', 'bed': 'Home', 'mattress': 'Home',
      'kitchen': 'Home',
      
      'appliance': 'Appliances', 'refrigerator': 'Appliances',
      'fridge': 'Appliances', 'oven': 'Appliances', 'microwave': 'Appliances',
      
      'beauty': 'Beauty', 'makeup': 'Beauty', 'cosmetics': 'Beauty',
      'skincare': 'Beauty', 'perfume': 'Beauty', 'fragrance': 'Beauty',
      
      'toys': 'Toys', 'game': 'Toys',
      'sports': 'Sports', 'fitness': 'Sports', 'exercise': 'Sports', 'yoga': 'Sports',
      
      'book': 'Books', 'novel': 'Books', 'textbook': 'Books',
      
      'bag': 'Fashion', 'backpack': 'Fashion', 'purse': 'Fashion',
      'wallet': 'Fashion', 'luggage': 'Fashion',
      
      'jewelry': 'Fashion', 'necklace': 'Fashion', 'ring': 'Fashion',
      'earring': 'Fashion', 'bracelet': 'Fashion',
      
      'baby': 'Baby', 'kids': 'Kids', 'children': 'Kids'
    };
    
    // Detect keywords in user message
    const detectedKeywords = productKeywords.filter(keyword => 
      latestUserMessage.toLowerCase().includes(keyword.toLowerCase())
    );
    
    // Get relevant products based on detected keywords
    if (detectedKeywords.length > 0) {
      console.log(`Detected keywords in user message: ${detectedKeywords.join(', ')}`);
      
      // Get unique categories from detected keywords
      const categoriesSet = new Set<string>();
      for (const keyword of detectedKeywords) {
        const category = categoryMapping[keyword.toLowerCase()];
        if (category) categoriesSet.add(category);
      }
      
      const uniqueCategories = Array.from(categoriesSet);
      
      if (uniqueCategories.length > 0) {
        console.log(`Mapped to categories: ${uniqueCategories.join(', ')}`);
        
        try {
          // Find relevant products
          let relevantProducts: any[] = [];
          
          // First search by categories
          for (const category of uniqueCategories) {
            const productsInCategory = await db
              .select()
              .from(products)
              .where(
                and(
                  eq(products.approved, true),
                  ilike(products.category, category)
                )
              )
              .orderBy(desc(products.id))
              .limit(Math.ceil(5 / uniqueCategories.length));
              
            relevantProducts = [...relevantProducts, ...productsInCategory];
            if (relevantProducts.length >= 5) break;
          }
          
          // If no products found, search by keywords in name/description
          if (relevantProducts.length === 0) {
            for (const keyword of detectedKeywords) {
              const keywordProducts = await db
                .select()
                .from(products)
                .where(
                  and(
                    eq(products.approved, true),
                    or(
                      ilike(products.name, `%${keyword}%`),
                      ilike(products.description, `%${keyword}%`)
                    )
                  )
                )
                .orderBy(desc(products.id))
                .limit(2);
                
              relevantProducts = [...relevantProducts, ...keywordProducts];
              if (relevantProducts.length >= 5) break;
            }
          }
          
          // De-duplicate products
          const uniqueProductsMap = new Map();
          for (const product of relevantProducts) {
            uniqueProductsMap.set(product.id, product);
          }
          const uniqueProducts = Array.from(uniqueProductsMap.values());
          
          // Add product recommendations to system prompt
          if (uniqueProducts.length > 0) {
            let keywordContext = `\n\nRELEVANT PRODUCTS:\n`;
            
            for (let i = 0; i < uniqueProducts.length; i++) {
              const product = uniqueProducts[i];
              keywordContext += `Product ${i + 1}: ${product.name}\n`;
              keywordContext += `Description: ${product.description.substring(0, 100)}...\n`;
              keywordContext += `Price: ${formatCurrency(product.price)}\n`;
              keywordContext += `Category: ${product.category}\n\n`;
            }
            
            keywordContext += `IMPORTANT: Immediately suggest these specific products in your response. Use their exact names and prices. Do not make up additional information or ask unnecessary follow-up questions.\n`;
            
            systemPrompt += keywordContext;
          }
        } catch (error) {
          console.error('Error getting products by keywords:', error);
        }
      }
    }

    // Add product context if available
    if (contextInfo?.productId) {
      const productInfo = await db.select().from(products).where(eq(products.id, contextInfo.productId)).limit(1);
      
      if (productInfo.length > 0) {
        const product = productInfo[0];
        
        systemPrompt += `\nCURRENT PRODUCT CONTEXT:\n`;
        systemPrompt += `Product Name: ${product.name}\n`;
        systemPrompt += `Description: ${product.description}\n`;
        systemPrompt += `Price: ${formatCurrency(product.price)}\n`;
        systemPrompt += `Category: ${product.category}\n`;
        
        if (product.specifications) {
          systemPrompt += `Specifications: ${product.specifications}\n`;
        }
        
        if (product.size) {
          systemPrompt += `Available Sizes: ${product.size}\n`;
        }
        
        if (product.color) {
          systemPrompt += `Available Colors: ${product.color}\n`;
        }

        // Add review information if available
        try {
          const reviewsResult = await db.execute(sql`
            SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
            FROM reviews
            WHERE product_id = ${contextInfo.productId}
          `);
          
          if (reviewsResult[0] && (reviewsResult[0] as any).review_count > 0) {
            systemPrompt += `Average Rating: ${(reviewsResult[0] as any).avg_rating.toFixed(1)}/5 from ${(reviewsResult[0] as any).review_count} reviews\n`;
          }
        } catch (error) {
          console.error('Error getting review information:', error);
        }
      }
    }

    // Add personalization context if user is logged in
    if (contextInfo?.userId) {
      try {
        // Get user's purchase history categories
        const purchaseCategoriesResult = await db.execute(sql`
          SELECT DISTINCT p.category
          FROM orders o
          JOIN order_items oi ON o.id = oi.order_id
          JOIN products p ON oi.product_id = p.id
          WHERE o.user_id = ${contextInfo.userId}
          LIMIT 5
        `);
        
        const purchaseCategories = purchaseCategoriesResult as any[];
        
        if (purchaseCategories.length > 0) {
          const categoriesStr = purchaseCategories.map(row => row.category).join(', ');
          systemPrompt += `\nUSER CONTEXT: This customer has previously purchased items in these categories: ${categoriesStr}\n`;
        }
        
        // Get user's browsing interests
        const browsingInterestsResult = await db.execute(sql`
          SELECT p.category, COUNT(*) as view_count
          FROM user_activities ua
          JOIN products p ON ua.product_id = p.id
          WHERE ua.user_id = ${contextInfo.userId}
          AND ua.activity_type = 'view'
          GROUP BY p.category
          ORDER BY view_count DESC
          LIMIT 3
        `);
        
        const browsingInterests = browsingInterestsResult as any[];
        
        if (browsingInterests.length > 0) {
          const interestsStr = browsingInterests.map(row => row.category).join(', ');
          systemPrompt += `The user has recently browsed these categories: ${interestsStr}\n`;
        }
      } catch (error) {
        console.error('Error getting user personalization data:', error);
      }
    }

    // Get AI response
    const responseText = await geminiAi.getChatResponse(messages, systemPrompt);

    // Save the conversation if we have session info
    if (contextInfo) {
      await createOrUpdateConversation(
        contextInfo.userId || null,
        contextInfo.sessionId,
        contextInfo.productId || null,
        contextInfo.categoryId || null,
        [...messages, { role: 'assistant', content: responseText }]
      );
    }

    return responseText;
  } catch (error) {
    console.error('Error getting AI response:', error);
    return "I'm sorry, but I'm having trouble processing your request right now. Please try again later.";
  }
}

// Generate product-specific Q&A response
export async function getProductQAResponse(
  productId: number,
  userQuestion: string,
  userId?: number,
  sessionId?: string
): Promise<string> {
  try {
    // Get product details
    const productInfo = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    
    if (productInfo.length === 0) {
      return "Sorry, I couldn't find information about this product.";
    }
    
    const product = productInfo[0];
    
    // Format product information for the AI
    const productContext = `
Product Name: ${product.name}
Description: ${product.description}
${product.specifications ? `Specifications: ${product.specifications}` : ''}
Price: ${formatCurrency(product.price)}
Category: ${product.category}
${product.size ? `Available Sizes: ${product.size}` : ''}
${product.color ? `Available Colors: ${product.color}` : ''}
`;

    // Add review information if available
    const reviews = await db.execute(sql`
      SELECT r.*, u.name as reviewer_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ${productId}
      ORDER BY r.created_at DESC
      LIMIT 5
    `);
    
    let reviewContext = '';
    if (reviews.length > 0) {
      reviewContext = "\nCustomer Reviews:\n";
      
      reviews.forEach((review: any, index: number) => {
        reviewContext += `Review ${index + 1}: ${review.rating}/5 stars - "${review.title || 'Review'}"\n`;
        reviewContext += `${review.review}\n`;
        reviewContext += `By: ${review.reviewer_name || 'Anonymous'}\n\n`;
      });
    }

    // Build system prompt with all context
    const systemPrompt = `You are LeleKart's AI Product Assistant. Answer questions about the following product accurately and helpfully. 
    
If you cannot answer based on the provided information, say so rather than making up details. 
    
Product Information:
${productContext}
${reviewContext}

When answering:
- Be honest and balanced
- Highlight key features relevant to the question
- If the question is about comparison with other products, mention you can only speak about this specific product
- For questions about delivery, returns, or store policy, direct the customer to the store's customer service
`;

    // Use the centralized Gemini chat function with a single message
    const messages = [{ role: 'user', content: userQuestion }];
    const responseText = await geminiAi.getChatResponse(messages, systemPrompt);

    // Track interaction for personalization
    if (sessionId) {
      await trackUserActivity(
        userId || null,
        sessionId,
        'product_qa',
        productId,
        undefined,
        undefined,
        { question: userQuestion }
      );
    }

    return responseText;
  } catch (error) {
    console.error('Error getting product Q&A response:', error);
    return "I'm sorry, but I'm having trouble processing your request right now. Please try again later.";
  }
}

// Helper function to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);
}