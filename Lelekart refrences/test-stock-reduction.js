// Script to test stock reduction when an order is placed
// Run with: node test-stock-reduction.js

// Imports
const { processMultiSellerOrder } = require('./server/handlers/multi-seller-order-handler');

// Test function
async function testStockReduction() {
  try {
    // Test with a real order ID from your database
    // Replace this with an actual order ID from your database that you want to test
    const orderIdToTest = 5001;
    
    console.log(`Testing stock reduction for order ID: ${orderIdToTest}`);
    
    // Process the order, which should update stock
    await processMultiSellerOrder(orderIdToTest);
    
    console.log(`Order ${orderIdToTest} processed successfully with stock updates`);
  } catch (error) {
    console.error('Error testing stock reduction:', error);
  }
}

// Run the test
testStockReduction();
