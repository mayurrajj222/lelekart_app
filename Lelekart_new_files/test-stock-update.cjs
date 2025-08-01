// Script to test stock update functionality

// Import PostgreSQL client directly to test stock update
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
const { eq } = require('drizzle-orm');

// Set WebSocket constructor for Neon
neonConfig.webSocketConstructor = ws;

// Database connection
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Test function to simulate stock update
async function testStockUpdate() {
  try {
    const productId = 4582; // Dry Neem Leaves product
    const newStock = 45; // Test reducing stock to 45 (from 50)
    
    console.log(`Testing stock update for product ${productId}`);
    
    // Get current stock
    let result = await pool.query('SELECT id, name, stock FROM products WHERE id = $1', [productId]);
    const beforeStock = result.rows[0].stock;
    console.log(`Before update - Product: ${result.rows[0].name}, Current stock: ${beforeStock}`);
    
    // Update stock
    console.log(`Updating stock to ${newStock}...`);
    await pool.query('UPDATE products SET stock = $1 WHERE id = $2', [newStock, productId]);
    
    // Verify update
    result = await pool.query('SELECT id, name, stock FROM products WHERE id = $1', [productId]);
    console.log(`After update - Product: ${result.rows[0].name}, New stock: ${result.rows[0].stock}`);
    
    // Restore original stock
    console.log(`Restoring original stock value of ${beforeStock}...`);
    await pool.query('UPDATE products SET stock = $1 WHERE id = $2', [beforeStock, productId]);
    
    // Verify restoration
    result = await pool.query('SELECT id, name, stock FROM products WHERE id = $1', [productId]);
    console.log(`After restoration - Product: ${result.rows[0].name}, Stock: ${result.rows[0].stock}`);
    
    console.log('✅ Test completed successfully!');
    return true;
  } catch (error) {
    console.error('Error in stock update test:', error);
    return false;
  } finally {
    // Close pool
    await pool.end();
  }
}

// Run the test
testStockUpdate()
  .then(() => {
    console.log('Test execution completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Test failed with error:', err);
    process.exit(1);
  });