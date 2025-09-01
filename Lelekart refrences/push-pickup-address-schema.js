import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from 'ws';
import 'dotenv/config';

// Required for Neon serverless
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function main() {
  console.log("Starting schema migration to add pickup_address field to seller_settings table...");
  
  try {
    // Connect to the db
    await pool.connect();
    
    // Check if the pickup_address column already exists
    const checkColumnQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'seller_settings' AND column_name = 'pickup_address';
    `;
    
    const res = await pool.query(checkColumnQuery);
    
    if (res.rows.length === 0) {
      // Column doesn't exist, add it
      console.log("Adding pickup_address column to seller_settings table...");
      
      const addColumnQuery = `
        ALTER TABLE seller_settings
        ADD COLUMN pickup_address TEXT NULL;
      `;
      
      await pool.query(addColumnQuery);
      console.log("Column added successfully!");
    } else {
      console.log("pickup_address column already exists in seller_settings table.");
    }
    
    console.log("Schema migration completed successfully.");
  } catch (error) {
    console.error("Error during migration:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error("Error in main function:", err);
  process.exit(1);
});