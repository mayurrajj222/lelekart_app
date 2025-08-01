/**
 * Script to create the media library table in the database
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { mediaLibrary } from './shared/schema.ts';
import dotenv from 'dotenv';

dotenv.config();

async function createMediaLibraryTable() {
  console.log('Creating media library table...');
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const connectionString = process.env.DATABASE_URL;
  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    // Check if the table already exists
    const result = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'media_library'
      )
    `;

    const tableExists = result[0].exists;
    
    if (tableExists) {
      console.log('Media library table already exists');
    } else {
      // Execute the query to create the tables
      await client`
        CREATE TABLE IF NOT EXISTS media_library (
          id SERIAL PRIMARY KEY,
          filename TEXT NOT NULL,
          original_name TEXT NOT NULL,
          url TEXT NOT NULL,
          mime_type TEXT NOT NULL,
          size INTEGER NOT NULL,
          alt TEXT,
          tags TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          uploaded_by INTEGER REFERENCES users(id)
        )
      `;
      console.log('Media library table created successfully');
    }
  } catch (error) {
    console.error('Error creating media library table:', error);
    throw error;
  } finally {
    await client.end();
  }
}

async function main() {
  try {
    await createMediaLibraryTable();
    console.log('✅ Media library schema pushed successfully');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();