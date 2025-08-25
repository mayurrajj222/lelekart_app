/**
 * Script to add variant_id column to carts table
 */
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import dotenv from 'dotenv';

// Set the WebSocket constructor for Neon
neonConfig.webSocketConstructor = ws;

dotenv.config();

async function addVariantIdToCart() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Adding variant_id column to carts table...');
    
    // Check if the column already exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'carts' AND column_name = 'variant_id'
    `;
    
    const checkResult = await pool.query(checkColumnQuery);
    
    if (checkResult.rows.length > 0) {
      console.log('Column variant_id already exists in carts table');
    } else {
      // Add the variant_id column to the carts table
      const addColumnQuery = `
        ALTER TABLE carts
        ADD COLUMN variant_id INTEGER
      `;
      
      await pool.query(addColumnQuery);
      console.log('Successfully added variant_id column to carts table');
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await pool.end();
  }
}

async function main() {
  await addVariantIdToCart();
}

main().catch(err => {
  console.error('Error in main execution:', err);
  process.exit(1);
});