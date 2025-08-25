// Script to add profile_image column to users table
import pkg from 'pg';
const { Pool } = pkg;

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function addProfileImageColumn() {
  try {
    console.log('Adding profile_image column to users table...');
    
    // Check if column already exists
    const checkColumnResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'profile_image'
    `);
    
    if (checkColumnResult.rows.length === 0) {
      // Column doesn't exist, add it
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN profile_image TEXT
      `);
      console.log('Added profile_image column successfully');
    } else {
      console.log('profile_image column already exists');
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await pool.end();
  }
}

addProfileImageColumn();