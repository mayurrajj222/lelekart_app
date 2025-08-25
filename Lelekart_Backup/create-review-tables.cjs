// Script to manually create review-related tables
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
require('dotenv').config();

// Configure neon to use ws
neonConfig.webSocketConstructor = ws;

// Setup DB connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createReviewTables() {
  const client = await pool.connect();

  try {
    // Start transaction
    await client.query('BEGIN');

    console.log('Creating reviews table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL,
        title TEXT,
        review TEXT,
        verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
        helpful_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
      )
    `);

    console.log('Creating review_images table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS review_images (
        id SERIAL PRIMARY KEY,
        review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Creating review_helpful table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS review_helpful (
        id SERIAL PRIMARY KEY,
        review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(review_id, user_id)
      )
    `);

    // Commit transaction
    await client.query('COMMIT');
    console.log('Review tables created successfully!');
  } catch (error) {
    // Rollback transaction if any error occurs
    await client.query('ROLLBACK');
    console.error('Error creating review tables:', error);
  } finally {
    // Release client back to pool
    client.release();
    await pool.end();
  }
}

// Execute the function
createReviewTables().catch(console.error);