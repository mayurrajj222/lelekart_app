// Add wallet fields to orders table if they don't exist
const { Pool } = require('pg');
require('dotenv').config();

async function updateOrdersWithWalletFields() {
  console.log('Checking orders table schema...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Check if shipping fields exist
    const shippingResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND column_name = 'shipping_status'
    `);

    if (shippingResult.rows.length === 0) {
      console.log('Adding shipping fields to orders table...');
      
      // Add shipping fields to the orders table
      await pool.query(`
        ALTER TABLE orders 
        ADD COLUMN shipping_status TEXT,
        ADD COLUMN shiprocket_order_id TEXT,
        ADD COLUMN shiprocket_shipment_id TEXT,
        ADD COLUMN tracking_details TEXT,
        ADD COLUMN courier_name TEXT,
        ADD COLUMN awb_code TEXT,
        ADD COLUMN estimated_delivery_date TIMESTAMP
      `);
      
      console.log('Successfully added shipping fields to orders table');
    } else {
      console.log('Shipping fields already exist in orders table');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error updating orders schema:', error);
    await pool.end();
    process.exit(1);
  }
}

updateOrdersWithWalletFields();