// Add wallet fields to orders table
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const { sql } = require('drizzle-orm');
const dotenv = require('dotenv');

dotenv.config();

async function updateOrdersWalletSchema() {
  console.log('Adding wallet fields to orders table...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  try {
    // Check if the columns already exist
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND column_name = 'wallet_discount'
    `);

    if (result.rows.length > 0) {
      console.log('Wallet fields already exist in orders table');
      pool.end();
      return;
    }

    // Add wallet columns to the orders table
    await db.execute(sql`
      ALTER TABLE orders 
      ADD COLUMN wallet_discount INTEGER DEFAULT 0,
      ADD COLUMN wallet_coins_used INTEGER DEFAULT 0
    `);

    console.log('Successfully added wallet fields to orders table');
    pool.end();
  } catch (error) {
    console.error('Error updating orders schema:', error);
    pool.end();
    process.exit(1);
  }
}

updateOrdersWalletSchema();