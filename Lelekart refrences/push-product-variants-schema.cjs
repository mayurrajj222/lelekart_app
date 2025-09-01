// Script to create the product_variants table
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createProductVariantsTable() {
  try {
    console.log('Creating product_variants table...');
    
    // Check if the table already exists
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'product_variants'
      );
    `);
    
    if (checkResult.rows[0].exists) {
      console.log('Table product_variants already exists - no action needed');
      return;
    }
    
    // Create the product_variants table
    await pool.query(`
      CREATE TABLE product_variants (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        sku TEXT,
        color TEXT,
        size TEXT,
        price INTEGER NOT NULL,
        mrp INTEGER,
        stock INTEGER NOT NULL DEFAULT 0,
        images TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log('Successfully created product_variants table');
  } catch (error) {
    console.error('Error creating product_variants table:', error);
    throw error;
  }
}

async function main() {
  try {
    await createProductVariantsTable();
    console.log('Schema update completed successfully');
  } catch (error) {
    console.error('Schema update failed:', error);
  } finally {
    await pool.end();
  }
}

main();