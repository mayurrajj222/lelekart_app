/**
 * Script to add missing default_courier column to shiprocket_settings table
 */
import { db, pool } from './server/db.ts';

async function addDefaultCourierColumn() {
  console.log('Checking if default_courier column exists in shiprocket_settings table...');
  
  try {
    // Check if column exists
    const columnExists = await db.execute(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'shiprocket_settings' 
      AND column_name = 'default_courier'
    `);
    
    if (columnExists.length === 0) {
      console.log('Adding default_courier column to shiprocket_settings table...');
      
      // Add default_courier column
      await db.execute(`
        ALTER TABLE shiprocket_settings 
        ADD COLUMN default_courier VARCHAR(255)
      `);
      
      console.log('Successfully added default_courier column to shiprocket_settings table.');
    } else {
      console.log('default_courier column already exists in shiprocket_settings table.');
    }
  } catch (error) {
    console.error('Error adding default_courier column:', error);
    throw error;
  }
}

async function main() {
  try {
    await addDefaultCourierColumn();
    console.log('Schema update completed successfully.');
  } catch (error) {
    console.error('Schema update failed:', error);
  } finally {
    await pool.end();
  }
}

main();