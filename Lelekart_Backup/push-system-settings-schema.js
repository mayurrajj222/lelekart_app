import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as dotenv from 'dotenv';

dotenv.config();

// Configure WebSocket for Neon serverless
neonConfig.webSocketConstructor = ws;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function createSystemSettingsTable() {
  try {
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'system_settings'
      );
    `);

    const tableExists = tableCheck.rows[0].exists;

    if (!tableExists) {
      console.log('Creating system_settings table...');
      
      await pool.query(`
        CREATE TABLE system_settings (
          id SERIAL PRIMARY KEY,
          key TEXT NOT NULL UNIQUE,
          value TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      
      console.log('System settings table created successfully');
    } else {
      console.log('System settings table already exists');
    }

    // Check if the seller agreement enabled setting exists
    const settingCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM system_settings
        WHERE key = 'seller_agreement_required'
      );
    `);

    const settingExists = settingCheck.rows[0].exists;

    if (!settingExists) {
      console.log('Adding seller_agreement_required setting...');
      
      await pool.query(`
        INSERT INTO system_settings (key, value, description)
        VALUES ('seller_agreement_required', 'true', 'Determines whether sellers must accept the seller agreement to use seller features');
      `);
      
      console.log('Seller agreement setting added successfully');
    } else {
      console.log('Seller agreement setting already exists');
    }

    console.log('System settings migration completed successfully');
  } catch (error) {
    console.error('Error in system settings migration:', error);
  } finally {
    await pool.end();
  }
}

createSystemSettingsTable();