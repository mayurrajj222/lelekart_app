import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure neon to use ws
neonConfig.webSocketConstructor = ws;

// Use the DATABASE_URL environment variable directly
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL
});

async function addSellerIdToProductShippingOverrides() {
  try {
    console.log('Adding sellerId column to product_shipping_overrides table...');
    
    // Check if the column exists already
    const checkColumnSQL = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'product_shipping_overrides' AND column_name = 'seller_id'
    `;
    
    const columnExists = await pool.query(checkColumnSQL);
    
    if (columnExists.rows.length === 0) {
      // Add the seller_id column with DEFAULT NULL initially to avoid constraint errors
      const addColumnSQL = `
        ALTER TABLE product_shipping_overrides 
        ADD COLUMN seller_id INTEGER
      `;
      
      await pool.query(addColumnSQL);
      console.log('Added seller_id column');
      
      // For existing records, we need to set a value for seller_id
      // We can get this from the products table
      const updateRecordsSQL = `
        UPDATE product_shipping_overrides po
        SET seller_id = p.seller_id
        FROM products p
        WHERE po.product_id = p.id
      `;
      
      await pool.query(updateRecordsSQL);
      console.log('Updated existing records with seller_id values');
      
      // Now add the NOT NULL constraint and foreign key
      const addConstraintsSQL = `
        ALTER TABLE product_shipping_overrides 
        ALTER COLUMN seller_id SET NOT NULL,
        ADD CONSTRAINT fk_product_shipping_overrides_seller 
        FOREIGN KEY (seller_id) REFERENCES users(id)
      `;
      
      await pool.query(addConstraintsSQL);
      console.log('Added NOT NULL constraint and foreign key');
      
      console.log('Successfully added and populated seller_id column');
    } else {
      console.log('seller_id column already exists');
    }
    
  } catch (error) {
    console.error('Error updating schema:', error);
  } finally {
    await pool.end();
  }
}

// Execute the update
addSellerIdToProductShippingOverrides();