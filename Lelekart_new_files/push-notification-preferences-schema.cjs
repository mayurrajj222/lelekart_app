const { Pool } = require('pg');

// Create a connection to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function addNotificationPreferencesColumn() {
  console.log('Starting migration: Adding notificationPreferences column to users table');
  
  try {
    // Check if the column already exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'notification_preferences'
    `;
    
    const { rows } = await pool.query(checkColumnQuery);
    
    if (rows.length === 0) {
      console.log('Column notification_preferences does not exist. Adding it to users table...');
      
      // Add the column
      const addColumnQuery = `
        ALTER TABLE users 
        ADD COLUMN notification_preferences JSONB DEFAULT '{}';
      `;
      
      await pool.query(addColumnQuery);
      console.log('Successfully added notification_preferences column to users table');
    } else {
      console.log('Column notification_preferences already exists in users table');
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    // Close connection pool
    await pool.end();
  }
}

// Run the migration
addNotificationPreferencesColumn()
  .then(() => {
    console.log('Migration script execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });