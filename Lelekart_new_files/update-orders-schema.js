// Add Shiprocket fields to orders table
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

async function updateOrdersSchema() {
  console.log('Adding Shiprocket fields to orders table...');
  
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
      AND column_name = 'shiprocket_order_id'
    `);

    if (result.rows.length > 0) {
      console.log('Shiprocket fields already exist in orders table');
      pool.end();
      return;
    }

    // Add Shiprocket columns to the orders table
    await db.execute(sql`
      ALTER TABLE orders 
      ADD COLUMN shipping_status TEXT,
      ADD COLUMN shiprocket_order_id TEXT,
      ADD COLUMN shiprocket_shipment_id TEXT,
      ADD COLUMN tracking_details TEXT,
      ADD COLUMN courier_name TEXT,
      ADD COLUMN awb_code TEXT,
      ADD COLUMN estimated_delivery_date TIMESTAMP
    `);

    console.log('Successfully added Shiprocket fields to orders table');
    pool.end();
  } catch (error) {
    console.error('Error updating orders schema:', error);
    pool.end();
    process.exit(1);
  }
}

updateOrdersSchema();