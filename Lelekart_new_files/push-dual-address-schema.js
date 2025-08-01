/**
 * Script to add dual address functionality (billing and shipping addresses)
 */
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

async function addDualAddressFields() {
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  try {
    console.log('Adding dual address functionality (billing/shipping addresses)...');

    // Check if columns already exist
    const columnCheckQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_addresses' 
      AND column_name IN ('is_default_billing', 'is_default_shipping', 'address_type');
    `;
    
    const existingColumns = await sql(columnCheckQuery);
    const columnNames = existingColumns.map(row => row.column_name);
    
    // Add is_default_billing column if it doesn't exist
    if (!columnNames.includes('is_default_billing')) {
      await sql`
        ALTER TABLE user_addresses 
        ADD COLUMN is_default_billing BOOLEAN NOT NULL DEFAULT false;
      `;
      console.log('Added is_default_billing column');
    }
    
    // Add is_default_shipping column if it doesn't exist
    if (!columnNames.includes('is_default_shipping')) {
      await sql`
        ALTER TABLE user_addresses 
        ADD COLUMN is_default_shipping BOOLEAN NOT NULL DEFAULT false;
      `;
      console.log('Added is_default_shipping column');
    }
    
    // Add address_type column if it doesn't exist
    if (!columnNames.includes('address_type')) {
      await sql`
        ALTER TABLE user_addresses 
        ADD COLUMN address_type TEXT NOT NULL DEFAULT 'both';
      `;
      console.log('Added address_type column');
    }

    // Update existing addresses to have default values
    await sql`
      UPDATE user_addresses
      SET is_default_billing = is_default,
          is_default_shipping = is_default,
          address_type = 'both'
      WHERE address_type = 'both';
    `;
    
    console.log('Updated existing addresses with default values for new columns');

    // Update orders table to have separate billing_address_id and shipping_address_id
    const orderColumnsCheckQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND column_name IN ('billing_address_id', 'shipping_address_id');
    `;
    
    const existingOrderColumns = await sql(orderColumnsCheckQuery);
    const orderColumnNames = existingOrderColumns.map(row => row.column_name);
    
    // Add billing_address_id column if it doesn't exist
    if (!orderColumnNames.includes('billing_address_id')) {
      await sql`
        ALTER TABLE orders 
        ADD COLUMN billing_address_id INTEGER REFERENCES user_addresses(id);
      `;
      console.log('Added billing_address_id column to orders table');
    }
    
    // Add shipping_address_id column if it doesn't exist and rename existing address_id
    if (!orderColumnNames.includes('shipping_address_id')) {
      // First, check if address_id exists
      const addressIdCheckQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'address_id';
      `;
      const addressIdExists = (await sql(addressIdCheckQuery)).length > 0;
      
      if (addressIdExists) {
        // Copy address_id to shipping_address_id and add billing_address_id
        await sql`
          ALTER TABLE orders 
          ADD COLUMN shipping_address_id INTEGER REFERENCES user_addresses(id);
        `;
        
        // Update shipping_address_id to be the same as address_id for existing orders
        await sql`
          UPDATE orders
          SET shipping_address_id = address_id
          WHERE address_id IS NOT NULL;
        `;
        
        console.log('Added shipping_address_id column and copied existing address_id values');
      } else {
        // If address_id doesn't exist, just add the new column
        await sql`
          ALTER TABLE orders 
          ADD COLUMN shipping_address_id INTEGER REFERENCES user_addresses(id);
        `;
        console.log('Added shipping_address_id column to orders table');
      }
    }

    console.log('Dual address functionality added successfully');
  } catch (error) {
    console.error('Error adding dual address functionality:', error);
    throw error;
  }
}

async function main() {
  try {
    await addDualAddressFields();
    console.log('Schema update completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Schema update failed:', error);
    process.exit(1);
  }
}

main();