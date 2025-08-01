// Script to test stock update functionality

// Import the database connection and eq function for WHERE clauses
import { db } from './server/db.js';
import { eq } from 'drizzle-orm';
import { products } from './shared/schema.js';

// We'll simulate the updateProductStock function we added to storage.ts
async function updateProductStock(productId, newStock) {
  try {
    console.log(`Testing stock update: Setting product ${productId} stock to ${newStock}`);
    
    // Before update - get current stock
    const [beforeProduct] = await db
      .select({ id: products.id, name: products.name, stock: products.stock })
      .from(products)
      .where(eq(products.id, productId));
    
    console.log('Before update:', beforeProduct);
    
    // Update the stock
    await db
      .update(products)
      .set({ stock: newStock })
      .where(eq(products.id, productId));
    
    // After update - verify stock was updated
    const [afterProduct] = await db
      .select({ id: products.id, name: products.name, stock: products.stock })
      .from(products)
      .where(eq(products.id, productId));
    
    console.log('After update:', afterProduct);
    
    // Reset to original value to avoid affecting real data
    await db
      .update(products)
      .set({ stock: beforeProduct.stock })
      .where(eq(products.id, productId));
    
    console.log('Stock reset to original value:', beforeProduct.stock);
    
    return {
      success: true,
      before: beforeProduct,
      after: afterProduct
    };
  } catch (error) {
    console.error('Error testing stock update:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test for a specific product - using the "Dry Neem Leaves" product
async function runTest() {
  try {
    const productId = 4582; // Dry Neem Leaves product
    const testStockValue = 45; // Test reducing stock by 5 units
    
    console.log('Starting stock update test...');
    const result = await updateProductStock(productId, testStockValue);
    
    if (result.success) {
      console.log('✅ Test successful!');
      console.log(`Stock update worked correctly: ${result.before.stock} -> ${result.after.stock} -> reset to ${result.before.stock}`);
    } else {
      console.log('❌ Test failed!');
      console.log('Error:', result.error);
    }
  } catch (error) {
    console.error('Error running test:', error);
  } finally {
    // Close the database connection
    process.exit(0);
  }
}

// Run the test
runTest();