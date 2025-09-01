// Script to test the stock update function in multi-seller-order-handler

// Import required modules
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
const { storage } = require('./server/storage');

// Set WebSocket constructor for Neon
neonConfig.webSocketConstructor = ws;

// Mock OrderItem object structure matching what our handler expects
async function testOrderStockReduction() {
  try {
    const productId = 4582; // Dry Neem Leaves product
    const variantId = null; // No variant, just the main product
    const quantity = 5; // Reduce by 5 units
    
    console.log(`Testing stock reduction for product ID ${productId}`);
    
    // Get current stock
    const product = await storage.getProduct(productId);
    if (!product) {
      console.error(`Product ${productId} not found`);
      return false;
    }
    
    console.log(`Before reduction - Product: ${product.name}, Current stock: ${product.stock}`);
    
    // Create mock order item
    const mockOrderItem = {
      productId: productId,
      variantId: variantId,
      quantity: quantity,
      product: product
    };
    
    // Import the function directly
    const { updateProductStock } = require('./server/handlers/multi-seller-order-handler');
    
    // Reduce stock
    console.log(`Reducing stock by ${quantity} units...`);
    await updateProductStock(mockOrderItem);
    
    // Get updated stock
    const updatedProduct = await storage.getProduct(productId);
    console.log(`After reduction - Product: ${updatedProduct.name}, New stock: ${updatedProduct.stock}`);
    
    // Restore original stock
    console.log(`Restoring original stock value of ${product.stock}...`);
    await storage.updateProductStock(productId, product.stock);
    
    // Verify restoration
    const restoredProduct = await storage.getProduct(productId);
    console.log(`After restoration - Product: ${restoredProduct.name}, Stock: ${restoredProduct.stock}`);
    
    console.log('✅ Test completed successfully!');
    return true;
  } catch (error) {
    console.error('Error in stock reduction test:', error);
    return false;
  }
}

// Run the test
testOrderStockReduction()
  .then(result => {
    console.log(`Test ${result ? 'passed' : 'failed'}`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Test execution failed with error:', err);
    process.exit(1);
  });