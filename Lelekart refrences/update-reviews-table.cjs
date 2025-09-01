// Script to update the reviews table to match the schema
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
require('dotenv').config();

// Configure neon to use ws
neonConfig.webSocketConstructor = ws;

// Setup DB connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function updateReviewsTable() {
  const client = await pool.connect();

  try {
    // Start transaction
    await client.query('BEGIN');

    console.log('Updating reviews table...');
    
    // Add order_id column
    await client.query(`
      ALTER TABLE reviews 
      ADD COLUMN IF NOT EXISTS order_id INTEGER REFERENCES orders(id),
      ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published',
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    `);

    // Commit transaction
    await client.query('COMMIT');
    console.log('Reviews table updated successfully!');
  } catch (error) {
    // Rollback transaction if any error occurs
    await client.query('ROLLBACK');
    console.error('Error updating reviews table:', error);
  } finally {
    // Release client back to pool
    client.release();
    await pool.end();
  }
}

// Execute the function
updateReviewsTable().catch(console.error);