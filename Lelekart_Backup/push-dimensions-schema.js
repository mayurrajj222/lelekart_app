/**
 * Script to add dimensions (weight, length, width, height) columns to the products table
 */
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a new database connection pool
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function addDimensionColumns() {
  const client = await pool.connect();
  try {
    console.log('Starting to add dimensions columns to products table...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Check if columns already exist 
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
        AND column_name IN ('weight', 'length', 'width', 'height')
    `);
    
    const existingColumns = checkResult.rows.map(row => row.column_name);
    console.log('Existing dimension columns:', existingColumns);
    
    // Add columns if they don't exist
    if (!existingColumns.includes('weight')) {
      console.log('Adding weight column...');
      await client.query(`ALTER TABLE products ADD COLUMN weight DECIMAL(10, 3)`);
    }
    
    if (!existingColumns.includes('length')) {
      console.log('Adding length column...');
      await client.query(`ALTER TABLE products ADD COLUMN length DECIMAL(10, 2)`);
    }
    
    if (!existingColumns.includes('width')) {
      console.log('Adding width column...');
      await client.query(`ALTER TABLE products ADD COLUMN width DECIMAL(10, 2)`);
    }
    
    if (!existingColumns.includes('height')) {
      console.log('Adding height column...');
      await client.query(`ALTER TABLE products ADD COLUMN height DECIMAL(10, 2)`);
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('Successfully added dimension columns to products table');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding dimension columns to products table:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await addDimensionColumns();
    console.log('Dimensions schema update completed successfully');
  } catch (error) {
    console.error('Failed to update dimensions schema:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the script
main();