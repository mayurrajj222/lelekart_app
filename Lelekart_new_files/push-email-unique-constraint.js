/**
 * Script to add unique constraint to the email field in the users table
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

// Use environment variable for database connection string
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function addUniqueConstraintToEmail() {
  console.log('Adding unique constraint to email field in users table...');

  try {
    // Check if the constraint already exists
    const constraintCheckResult = await client`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'users'
        AND constraint_type = 'UNIQUE'
        AND constraint_name = 'users_email_unique';
    `;

    if (constraintCheckResult.length > 0) {
      console.log('Unique constraint already exists on email field');
    } else {
      // Add unique constraint to email column
      await client`
        ALTER TABLE users
        ADD CONSTRAINT users_email_unique UNIQUE (email);
      `;
      console.log('Unique constraint added to email field successfully');
    }
  } catch (error) {
    console.error('Error adding unique constraint to email field:', error);
    throw error;
  }
}

async function main() {
  try {
    await addUniqueConstraintToEmail();
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

main();