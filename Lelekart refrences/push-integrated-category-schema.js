/**
 * Script to migrate categories and subcategories tables to the new integrated schema
 * - Adds slug, description, and active fields to categories
 * - Adds slug and featured fields to subcategories
 * - Generates slugs from existing names
 * - IMPORTANT: Preserves all existing data
 */

import { config } from 'dotenv';
import pg from 'pg';

// Initialize environment variables
config();

const { Pool } = pg;

// Create a PostgreSQL client
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Helper function to generate slug from name
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
}

// Main function to push schema changes
async function pushIntegratedCategorySchema() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Starting migration of categories and subcategories to new integrated schema...');
    
    // Check if categories table exists
    const categoryTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'categories'
      );
    `);
    
    if (categoryTableExists.rows[0].exists) {
      console.log('Updating categories table...');
      
      // Check if the slug column already exists
      const slugColumnExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'slug'
        );
      `);
      
      if (!slugColumnExists.rows[0].exists) {
        // Add slug column
        await client.query(`ALTER TABLE categories ADD COLUMN slug TEXT`);
        console.log('Added slug column to categories table');
        
        // Populate slug from existing names
        const categories = await client.query('SELECT id, name FROM categories');
        console.log(`Found ${categories.rows.length} existing categories to update`);
        
        for (const category of categories.rows) {
          const slug = generateSlug(category.name);
          await client.query('UPDATE categories SET slug = $1 WHERE id = $2', [slug, category.id]);
          console.log(`Updated category ID ${category.id} with slug "${slug}"`);
        }
        
        // Make slug not null and unique
        await client.query(`ALTER TABLE categories ALTER COLUMN slug SET NOT NULL`);
        await client.query(`ALTER TABLE categories ADD CONSTRAINT categories_slug_unique UNIQUE (slug)`);
        console.log('Set slug column constraints');
      }
      
      // Add description column if it doesn't exist
      const descriptionColumnExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'description'
        );
      `);
      
      if (!descriptionColumnExists.rows[0].exists) {
        await client.query(`ALTER TABLE categories ADD COLUMN description TEXT`);
        console.log('Added description column to categories table');
      }
      
      // Add active column if it doesn't exist
      const activeColumnExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'active'
        );
      `);
      
      if (!activeColumnExists.rows[0].exists) {
        await client.query(`ALTER TABLE categories ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE`);
        console.log('Added active column to categories table');
      }
    } else {
      console.log('Categories table does not exist. Skipping categories update.');
    }
    
    // Check if subcategories table exists
    const subcategoryTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'subcategories'
      );
    `);
    
    if (subcategoryTableExists.rows[0].exists) {
      console.log('Updating subcategories table...');
      
      // Check if the slug column already exists
      const slugColumnExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'subcategories' AND column_name = 'slug'
        );
      `);
      
      if (!slugColumnExists.rows[0].exists) {
        // Add slug column
        await client.query(`ALTER TABLE subcategories ADD COLUMN slug TEXT`);
        console.log('Added slug column to subcategories table');
        
        // Populate slug from existing names
        const subcategories = await client.query('SELECT id, name FROM subcategories');
        console.log(`Found ${subcategories.rows.length} existing subcategories to update`);
        
        for (const subcategory of subcategories.rows) {
          const slug = generateSlug(subcategory.name);
          await client.query('UPDATE subcategories SET slug = $1 WHERE id = $2', [slug, subcategory.id]);
          console.log(`Updated subcategory ID ${subcategory.id} with slug "${slug}"`);
        }
        
        // Make slug not null
        await client.query(`ALTER TABLE subcategories ALTER COLUMN slug SET NOT NULL`);
        console.log('Set slug column constraint');
      }
      
      // Add featured column if it doesn't exist
      const featuredColumnExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'subcategories' AND column_name = 'featured'
        );
      `);
      
      if (!featuredColumnExists.rows[0].exists) {
        await client.query(`ALTER TABLE subcategories ADD COLUMN featured BOOLEAN NOT NULL DEFAULT FALSE`);
        console.log('Added featured column to subcategories table');
      }
      
      // Add active column if it doesn't exist
      const activeColumnExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'subcategories' AND column_name = 'active'
        );
      `);
      
      if (!activeColumnExists.rows[0].exists) {
        await client.query(`ALTER TABLE subcategories ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE`);
        console.log('Added active column to subcategories table');
      }
    } else {
      console.log('Subcategories table does not exist. Skipping subcategories update.');
    }
    
    await client.query('COMMIT');
    console.log('Migration completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error migrating schema:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Execute the function
pushIntegratedCategorySchema()
  .then(() => {
    console.log('Schema update completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Schema update failed:', error);
    process.exit(1);
  });