require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function pushSchema() {
  try {
    console.log('Adding "store" column to seller_settings table...');
    
    // Check if the column already exists
    const checkColumnResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'seller_settings' AND column_name = 'store'
    `);
    
    if (checkColumnResult.rows.length === 0) {
      // Add the store column if it doesn't exist
      await pool.query(`
        ALTER TABLE seller_settings 
        ADD COLUMN IF NOT EXISTS store TEXT
      `);
      console.log('Successfully added store column to seller_settings table');
    } else {
      console.log('Store column already exists in seller_settings table');
    }
    
    console.log('Schema update completed successfully');
  } catch (error) {
    console.error('Error updating schema:', error);
  } finally {
    await pool.end();
  }
}

pushSchema();