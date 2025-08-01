// Script to add gstRate column to categories table

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function addGstRateColumn() {
  try {
    console.log("Adding gstRate column to categories table...");
    
    // Check if column already exists
    const checkColumnQuery = sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'categories' AND column_name = 'gst_rate'
    `;
    
    const columnExists = await db.execute(checkColumnQuery);
    
    if (columnExists.length > 0) {
      console.log("gst_rate column already exists, skipping...");
      return;
    }
    
    // Add the column if it doesn't exist
    const addColumnQuery = sql`
      ALTER TABLE categories
      ADD COLUMN gst_rate DECIMAL(5,2) DEFAULT 0.00
    `;
    
    await db.execute(addColumnQuery);
    
    console.log("Successfully added gstRate column to categories table");
  } catch (error) {
    console.error("Error adding gstRate column:", error);
    throw error;
  }
}

async function main() {
  try {
    await addGstRateColumn();
    console.log("Migration completed successfully");
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    await client.end();
    process.exit(1);
  }
}

main();