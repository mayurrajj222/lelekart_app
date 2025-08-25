/**
 * Script to update the orders.total column from integer to numeric to support decimal values
 */
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import dotenv from 'dotenv';

// Set the WebSocket constructor for Neon
neonConfig.webSocketConstructor = ws;

dotenv.config();

async function updateOrderTotalType() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Checking current data type of orders.total column...');
    
    // Check the current data type of total column
    const checkColumnTypeQuery = `
      SELECT data_type
      FROM information_schema.columns
      WHERE table_name = 'orders'
      AND column_name = 'total'
    `;
    
    const checkResult = await pool.query(checkColumnTypeQuery);
    
    if (checkResult.rows.length > 0) {
      const currentType = checkResult.rows[0].data_type;
      console.log(`Current data type of orders.total: ${currentType}`);
      
      if (currentType.toLowerCase() === 'integer') {
        // Alter the column type to numeric
        console.log('Updating orders.total column type from integer to numeric...');
        
        const alterColumnQuery = `
          ALTER TABLE orders
          ALTER COLUMN total TYPE NUMERIC(10, 2)
        `;
        
        await pool.query(alterColumnQuery);
        console.log('Successfully updated orders.total column type to numeric(10, 2)');
      } else {
        console.log('orders.total column already has the correct data type');
      }
    } else {
      console.error('Could not find orders.total column in the schema');
    }
    
    // Also check and update wallet_discount column if needed
    const checkWalletDiscountQuery = `
      SELECT data_type
      FROM information_schema.columns
      WHERE table_name = 'orders'
      AND column_name = 'wallet_discount'
    `;
    
    const walletCheckResult = await pool.query(checkWalletDiscountQuery);
    
    if (walletCheckResult.rows.length > 0) {
      const walletDiscountType = walletCheckResult.rows[0].data_type;
      console.log(`Current data type of orders.wallet_discount: ${walletDiscountType}`);
      
      if (walletDiscountType.toLowerCase() === 'integer') {
        console.log('Updating orders.wallet_discount column type from integer to numeric...');
        
        const alterWalletDiscountQuery = `
          ALTER TABLE orders
          ALTER COLUMN wallet_discount TYPE NUMERIC(10, 2)
        `;
        
        await pool.query(alterWalletDiscountQuery);
        console.log('Successfully updated orders.wallet_discount column type to numeric(10, 2)');
      } else {
        console.log('orders.wallet_discount column already has the correct data type');
      }
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await pool.end();
  }
}

async function main() {
  await updateOrderTotalType();
}

main().catch(err => {
  console.error('Error in main execution:', err);
  process.exit(1);
});