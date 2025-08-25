/**
 * Add subcategories functionality to the database
 */
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function addSubcategoriesSchema() {
  try {
    // Create subcategories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subcategories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        image TEXT,
        description TEXT,
        category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        parent_id INTEGER REFERENCES subcategories(id) ON DELETE CASCADE,
        display_order INTEGER NOT NULL DEFAULT 0,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Created subcategories table');

    // Add category_id column to products table if it doesn't exist
    const checkCategoryIdColumn = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'category_id';
    `);

    if (checkCategoryIdColumn.rows.length === 0) {
      await pool.query(`
        ALTER TABLE products 
        ADD COLUMN category_id INTEGER REFERENCES categories(id);
      `);
      console.log('Added category_id column to products table');
    } else {
      console.log('category_id column already exists in products table');
    }

    // Add subcategory_id column to products table if it doesn't exist
    const checkSubcategoryIdColumn = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'subcategory_id';
    `);

    if (checkSubcategoryIdColumn.rows.length === 0) {
      await pool.query(`
        ALTER TABLE products 
        ADD COLUMN subcategory_id INTEGER REFERENCES subcategories(id);
      `);
      console.log('Added subcategory_id column to products table');
    } else {
      console.log('subcategory_id column already exists in products table');
    }

    console.log('All subcategory schema changes applied successfully');
    return true;
  } catch (error) {
    console.error('Error updating schema:', error);
    return false;
  } finally {
    await pool.end();
  }
}

// Run the migration
addSubcategoriesSchema().then(success => {
  if (success) {
    console.log('Database schema updated successfully');
    process.exit(0);
  } else {
    console.error('Database schema update failed');
    process.exit(1);
  }
});