const { Client } = require('pg');
require('dotenv').config();

async function updateWalletSettingsSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if columns already exist
    const checkColumnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'wallet_settings' 
      AND column_name IN ('max_usage_percentage', 'min_cart_value', 'applicable_categories');
    `;
    
    const { rows } = await client.query(checkColumnsQuery);
    const existingColumns = rows.map(row => row.column_name);
    
    // Add max_usage_percentage column if it doesn't exist
    if (!existingColumns.includes('max_usage_percentage')) {
      console.log('Adding max_usage_percentage column...');
      await client.query(`
        ALTER TABLE wallet_settings
        ADD COLUMN max_usage_percentage DECIMAL NOT NULL DEFAULT 20.00;
      `);
      console.log('max_usage_percentage column added');
    } else {
      console.log('max_usage_percentage column already exists');
    }
    
    // Add min_cart_value column if it doesn't exist
    if (!existingColumns.includes('min_cart_value')) {
      console.log('Adding min_cart_value column...');
      await client.query(`
        ALTER TABLE wallet_settings
        ADD COLUMN min_cart_value DECIMAL NOT NULL DEFAULT 0.00;
      `);
      console.log('min_cart_value column added');
    } else {
      console.log('min_cart_value column already exists');
    }
    
    // Add applicable_categories column if it doesn't exist
    if (!existingColumns.includes('applicable_categories')) {
      console.log('Adding applicable_categories column...');
      await client.query(`
        ALTER TABLE wallet_settings
        ADD COLUMN applicable_categories TEXT;
      `);
      console.log('applicable_categories column added');
    } else {
      console.log('applicable_categories column already exists');
    }
    
    console.log('Wallet settings schema update complete');
  } catch (error) {
    console.error('Error updating wallet settings schema:', error);
  } finally {
    await client.end();
    console.log('Disconnected from database');
  }
}

updateWalletSettingsSchema().catch(console.error);