import { db } from './db';
import { productVariants } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Debug variant-related SQL queries
export async function debugProductVariants(productId: number) {
  try {
    console.log(`DEBUG: Looking for variants for product ID ${productId}`);
    
    // Use raw SQL for debugging
    const variants = await db.query.productVariants.findMany({
      where: eq(productVariants.productId, productId),
    });
    
    console.log(`DEBUG: Found ${variants.length} variants for product ${productId}:`, 
      JSON.stringify(variants, null, 2)
    );
    
    return variants;
  } catch (error) {
    console.error("DEBUG ERROR in product variants:", error);
    return [];
  }
}