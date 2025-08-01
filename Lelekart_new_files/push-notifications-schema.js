// Script to recreate notifications table with correct schema
import pkg from 'pg';
const { Pool } = pkg;

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function recreateNotificationsTable() {
  try {
    console.log('Checking if notifications table exists...');
    
    // Check if the table already exists
    const checkTableResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'notifications'
    `);
    
    if (checkTableResult.rows.length > 0) {
      // Table exists, drop it first
      console.log('Dropping existing notifications table...');
      await pool.query(`DROP TABLE IF EXISTS notifications CASCADE`);
      console.log('Existing notifications table dropped');
    }
    
    // Create the table with the correct schema
    console.log('Creating notifications table with correct schema...');
    await pool.query(`
      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        read BOOLEAN NOT NULL DEFAULT false,
        link TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Created notifications table successfully');
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await pool.end();
  }
}

recreateNotificationsTable();