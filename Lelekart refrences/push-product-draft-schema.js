// push-product-draft-schema.js
import pkg from 'pg';
const { Pool } = pkg;
import * as dotenv from 'dotenv';
dotenv.config();

async function addIsDraftColumn() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Adding isDraft column to products table...');
    
    // Check if the column already exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'is_draft';
    `;
    
    const checkResult = await pool.query(checkColumnQuery);
    
    if (checkResult.rows.length === 0) {
      // Column doesn't exist, so create it
      const alterTableQuery = `
        ALTER TABLE products 
        ADD COLUMN is_draft BOOLEAN NOT NULL DEFAULT FALSE;
      `;
      
      await pool.query(alterTableQuery);
      console.log('Successfully added is_draft column to products table!');
    } else {
      console.log('Column is_draft already exists in products table.');
    }
    
    console.log('Schema update complete!');
  } catch (error) {
    console.error('Error updating schema:', error);
  } finally {
    await pool.end();
  }
}

// Run the function
addIsDraftColumn();