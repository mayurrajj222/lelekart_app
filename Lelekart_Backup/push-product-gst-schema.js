/**
 * Add gstRate column to products table
 */
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function addProductGstRateColumn() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Connected to database");

    // Check if column already exists
    const checkColumn = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'products' AND column_name = 'gst_rate';
    `);

    if (checkColumn.rows.length === 0) {
      console.log("Adding gst_rate column to products table...");
      
      // Add gst_rate column to products table
      await client.query(`
        ALTER TABLE products
        ADD COLUMN gst_rate DECIMAL(5,2) DEFAULT 0.00;
      `);
      
      console.log("Successfully added gst_rate column to products table");
    } else {
      console.log("gst_rate column already exists in products table");
    }

    // Update schema.ts to include the gst_rate field
    console.log("Don't forget to update shared/schema.ts to include the gstRate field in the products schema");

  } catch (error) {
    console.error("Error executing migration:", error);
  } finally {
    await client.end();
    console.log("Database connection closed");
  }
}

async function main() {
  await addProductGstRateColumn();
}

main().catch(console.error);