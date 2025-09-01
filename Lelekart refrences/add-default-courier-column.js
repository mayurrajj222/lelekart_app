// Script to add default_courier column to shiprocket_settings table
import pg from 'pg';
const { Pool } = pg;

// Get DATABASE_URL from environment
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

// Create PostgreSQL pool
const pool = new Pool({
  connectionString
});

async function main() {
  const client = await pool.connect();
  
  try {
    console.log('Checking if default_courier column exists in shiprocket_settings table...');
    
    // Check if default_courier column exists
    const defaultCourierCheckResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'shiprocket_settings' 
      AND column_name = 'default_courier'
    `);
    
    if (defaultCourierCheckResult.rows.length === 0) {
      console.log('Adding default_courier column to shiprocket_settings table...');
      
      // Add default_courier column
      await client.query(`
        ALTER TABLE shiprocket_settings 
        ADD COLUMN default_courier TEXT
      `);
      
      console.log('Successfully added default_courier column to shiprocket_settings table.');
    } else {
      console.log('default_courier column already exists in shiprocket_settings table.');
    }
    
    // Check if auto_ship_enabled column exists
    console.log('Checking if auto_ship_enabled column exists in shiprocket_settings table...');
    
    const autoShipCheckResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'shiprocket_settings' 
      AND column_name = 'auto_ship_enabled'
    `);
    
    if (autoShipCheckResult.rows.length === 0) {
      console.log('Adding auto_ship_enabled column to shiprocket_settings table...');
      
      // Add auto_ship_enabled column
      await client.query(`
        ALTER TABLE shiprocket_settings 
        ADD COLUMN auto_ship_enabled BOOLEAN DEFAULT false
      `);
      
      console.log('Successfully added auto_ship_enabled column to shiprocket_settings table.');
    } else {
      console.log('auto_ship_enabled column already exists in shiprocket_settings table.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

main();