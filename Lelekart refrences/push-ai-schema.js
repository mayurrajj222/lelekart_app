// Script to push schema changes automatically
import { exec } from 'child_process';
import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createNewTables() {
  try {
    // Create user_activities table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_activities (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        session_id TEXT NOT NULL,
        activity_type TEXT NOT NULL,
        product_id INTEGER REFERENCES products(id),
        category_id INTEGER REFERENCES categories(id),
        search_query TEXT,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
        additional_data TEXT
      );
    `);
    console.log('Created user_activities table');

    // Create product_relationships table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_relationships (
        id SERIAL PRIMARY KEY,
        source_product_id INTEGER NOT NULL REFERENCES products(id),
        related_product_id INTEGER NOT NULL REFERENCES products(id),
        relationship_type TEXT NOT NULL,
        strength DOUBLE PRECISION NOT NULL DEFAULT 1.0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Created product_relationships table');

    // Create ai_assistant_conversations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_assistant_conversations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        session_id TEXT NOT NULL,
        product_id INTEGER REFERENCES products(id),
        category_id INTEGER REFERENCES categories(id),
        conversation_history TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Created ai_assistant_conversations table');

    // Create user_size_preferences table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_size_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        category TEXT NOT NULL,
        size TEXT NOT NULL,
        fit TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Created user_size_preferences table');

    console.log('All tables created successfully');
    return true;
  } catch (error) {
    console.error('Error creating tables:', error);
    return false;
  } finally {
    await pool.end();
  }
}

// Run the migration
createNewTables().then(success => {
  if (success) {
    console.log('Database schema updated successfully');
    process.exit(0);
  } else {
    console.error('Database schema update failed');
    process.exit(1);
  }
});