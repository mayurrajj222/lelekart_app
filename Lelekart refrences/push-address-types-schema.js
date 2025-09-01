/**
 * Script to add address type fields to user_addresses table
 */
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import dotenv from 'dotenv';

// Set the WebSocket constructor for Neon
neonConfig.webSocketConstructor = ws;

dotenv.config();

async function addAddressTypeFields() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Adding address type fields to user_addresses table...');
    
    // Check if the address_type column already exists
    const checkAddressTypeColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_addresses' AND column_name = 'address_type'
    `;
    
    const checkAddressTypeResult = await pool.query(checkAddressTypeColumnQuery);
    
    if (checkAddressTypeResult.rows.length === 0) {
      // Add the address_type column
      const addAddressTypeColumnQuery = `
        ALTER TABLE user_addresses
        ADD COLUMN address_type VARCHAR(20) DEFAULT 'both'
      `;
      
      await pool.query(addAddressTypeColumnQuery);
      console.log('Successfully added address_type column to user_addresses table');
    } else {
      console.log('Column address_type already exists in user_addresses table');
    }

    // Check if the is_default_billing column already exists
    const checkDefaultBillingColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_addresses' AND column_name = 'is_default_billing'
    `;
    
    const checkDefaultBillingResult = await pool.query(checkDefaultBillingColumnQuery);
    
    if (checkDefaultBillingResult.rows.length === 0) {
      // Add the is_default_billing column
      const addDefaultBillingColumnQuery = `
        ALTER TABLE user_addresses
        ADD COLUMN is_default_billing BOOLEAN DEFAULT false
      `;
      
      await pool.query(addDefaultBillingColumnQuery);
      console.log('Successfully added is_default_billing column to user_addresses table');
    } else {
      console.log('Column is_default_billing already exists in user_addresses table');
    }

    // Check if the is_default_shipping column already exists
    const checkDefaultShippingColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_addresses' AND column_name = 'is_default_shipping'
    `;
    
    const checkDefaultShippingResult = await pool.query(checkDefaultShippingColumnQuery);
    
    if (checkDefaultShippingResult.rows.length === 0) {
      // Add the is_default_shipping column
      const addDefaultShippingColumnQuery = `
        ALTER TABLE user_addresses
        ADD COLUMN is_default_shipping BOOLEAN DEFAULT false
      `;
      
      await pool.query(addDefaultShippingColumnQuery);
      console.log('Successfully added is_default_shipping column to user_addresses table');
    } else {
      console.log('Column is_default_shipping already exists in user_addresses table');
    }

    // Update existing records - set both default columns to match is_default
    const updateExistingRecordsQuery = `
      UPDATE user_addresses 
      SET is_default_billing = is_default, 
          is_default_shipping = is_default
    `;
    
    await pool.query(updateExistingRecordsQuery);
    console.log('Successfully updated existing address records');
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await pool.end();
  }
}

async function main() {
  await addAddressTypeFields();
}

main().catch(err => {
  console.error('Error in main execution:', err);
  process.exit(1);
});