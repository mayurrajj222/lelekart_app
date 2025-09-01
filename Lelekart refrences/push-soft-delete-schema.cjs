// Script to add a 'deleted' column to the products table
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addSoftDeleteColumn() {
  try {
    console.log('Adding soft delete column to products table...');
    
    // Check if the column already exists
    const columnCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'deleted'
      );
    `);
    
    if (columnCheck.rows[0].exists) {
      console.log('Column "deleted" already exists in products table - no action needed');
      return;
    }
    
    // Add the deleted column
    await pool.query(`
      ALTER TABLE products 
      ADD COLUMN deleted BOOLEAN DEFAULT FALSE NOT NULL;
    `);
    
    console.log('Successfully added "deleted" column to products table');
  } catch (error) {
    console.error('Error adding soft delete column:', error);
    throw error;
  }
}

async function main() {
  try {
    await addSoftDeleteColumn();
    console.log('Schema update completed successfully');
  } catch (error) {
    console.error('Schema update failed:', error);
  } finally {
    await pool.end();
  }
}

main();