import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import ws from 'ws';
import 'dotenv/config';

neonConfig.webSocketConstructor = ws;

async function main() {
  console.log('Starting database migration...');
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable not set');
  }
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);
  
  console.log('Connected to database.');
  
  // Create Shipping Tables
  const tables = [
    'shipping_methods', 
    'shipping_zones', 
    'shipping_rules', 
    'seller_shipping_settings', 
    'product_shipping_overrides', 
    'shipping_tracking'
  ];
  
  // Create shipping_methods table
  console.log('Creating shipping tables...');
  
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shipping_methods (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price INTEGER NOT NULL,
        estimated_days TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        icon TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Created shipping_methods table');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shipping_zones (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        countries TEXT NOT NULL,
        states TEXT,
        cities TEXT,
        zip_codes TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Created shipping_zones table');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shipping_rules (
        id SERIAL PRIMARY KEY,
        zone_id INTEGER NOT NULL REFERENCES shipping_zones(id),
        method_id INTEGER NOT NULL REFERENCES shipping_methods(id),
        price INTEGER,
        free_shipping_threshold INTEGER,
        additional_days INTEGER DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Created shipping_rules table');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS seller_shipping_settings (
        id SERIAL PRIMARY KEY,
        seller_id INTEGER NOT NULL REFERENCES users(id),
        enable_custom_shipping BOOLEAN NOT NULL DEFAULT FALSE,
        default_shipping_method_id INTEGER REFERENCES shipping_methods(id),
        free_shipping_threshold INTEGER,
        processing_time TEXT,
        shipping_policy TEXT,
        return_policy TEXT,
        international_shipping BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Created seller_shipping_settings table');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_shipping_overrides (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id),
        custom_price INTEGER,
        free_shipping BOOLEAN NOT NULL DEFAULT FALSE,
        additional_processing_days INTEGER DEFAULT 0,
        shipping_restrictions TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Created product_shipping_overrides table');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shipping_tracking (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id),
        carrier TEXT,
        tracking_number TEXT,
        tracking_url TEXT,
        shipped_date TIMESTAMP,
        estimated_delivery_date TIMESTAMP,
        delivered_date TIMESTAMP,
        status TEXT NOT NULL DEFAULT 'pending',
        status_updates TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Created shipping_tracking table');
    
    // Add some initial shipping methods
    await pool.query(`
      INSERT INTO shipping_methods (name, description, price, estimated_days, icon)
      VALUES 
        ('Standard Shipping', 'Regular delivery option', 4000, '3-5 business days', 'truck'),
        ('Express Shipping', 'Faster delivery option', 9000, '1-2 business days', 'truck-fast'),
        ('Economy Shipping', 'Cost-effective shipping', 2900, '5-8 business days', 'truck-slow')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('Added initial shipping methods');
    
    // Add some initial shipping zones for India
    await pool.query(`
      INSERT INTO shipping_zones (name, description, countries, states, cities)
      VALUES 
        ('All India', 'All regions across India', 'India', NULL, NULL),
        ('North India', 'Northern states of India', 'India', 'Delhi,Haryana,Punjab,Uttar Pradesh,Himachal Pradesh', NULL),
        ('South India', 'Southern states of India', 'India', 'Tamil Nadu,Kerala,Karnataka,Andhra Pradesh,Telangana', NULL),
        ('Metro Cities', 'Major metropolitan cities', 'India', NULL, 'Delhi,Mumbai,Chennai,Kolkata,Bangalore,Hyderabad')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('Added initial shipping zones');
    
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);