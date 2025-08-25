// Return Management System Database Migration Script
// This script creates all tables needed for the return/replacement/refund functionality

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

// Initialize database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function main() {
  console.log('Running return management system migration...');

  try {
    // Create return_reasons table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS return_reasons (
        id SERIAL PRIMARY KEY,
        reason_text TEXT NOT NULL,
        category VARCHAR(50) NOT NULL,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Created return_reasons table');

    // Create return_policies table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS return_policies (
        id SERIAL PRIMARY KEY,
        seller_id INTEGER REFERENCES users(id),
        category_id INTEGER REFERENCES categories(id),
        return_window_days INTEGER NOT NULL DEFAULT 7,
        replacement_window_days INTEGER NOT NULL DEFAULT 7,
        refund_window_days INTEGER NOT NULL DEFAULT 7,
        policy_text TEXT,
        non_returnable_items JSONB,
        is_active BOOLEAN DEFAULT true,
        auto_approve_threshold DECIMAL(10, 2) DEFAULT 0,
        shipping_paid_by VARCHAR(20) DEFAULT 'seller',
        conditional_rules JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Created return_policies table');

    // Create return_requests table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS return_requests (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        order_item_id INTEGER,
        seller_id INTEGER REFERENCES users(id),
        buyer_id INTEGER NOT NULL REFERENCES users(id),
        request_type VARCHAR(20) NOT NULL,
        reason_id INTEGER NOT NULL REFERENCES return_reasons(id),
        custom_reason TEXT,
        description TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        media_urls JSONB DEFAULT '[]',
        seller_response TEXT,
        seller_response_date TIMESTAMPTZ,
        admin_notes TEXT,
        admin_response_date TIMESTAMPTZ,
        refund_amount DECIMAL(10, 2),
        refund_method VARCHAR(20),
        refund_processed BOOLEAN DEFAULT false,
        refund_transaction_id VARCHAR(255),
        return_tracking JSONB DEFAULT '{}',
        replacement_tracking JSONB DEFAULT '{}',
        replacement_order_id INTEGER,
        pickup_date TIMESTAMPTZ,
        return_received_date TIMESTAMPTZ,
        return_condition VARCHAR(20),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Created return_requests table');

    // Create return_messages table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS return_messages (
        id SERIAL PRIMARY KEY,
        return_request_id INTEGER NOT NULL REFERENCES return_requests(id) ON DELETE CASCADE,
        sender_id INTEGER NOT NULL REFERENCES users(id),
        sender_role VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        media_urls JSONB DEFAULT '[]',
        read BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Created return_messages table');

    // Create return_status_history table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS return_status_history (
        id SERIAL PRIMARY KEY,
        return_request_id INTEGER NOT NULL REFERENCES return_requests(id) ON DELETE CASCADE,
        previous_status VARCHAR(20),
        new_status VARCHAR(20) NOT NULL,
        changed_by INTEGER NOT NULL REFERENCES users(id),
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Created return_status_history table');

    // Insert default global return policy
    await db.execute(`
      INSERT INTO return_policies (
        seller_id, 
        category_id, 
        return_window_days, 
        replacement_window_days,
        refund_window_days, 
        policy_text, 
        shipping_paid_by,
        is_active
      )
      VALUES (
        NULL, 
        NULL, 
        7, 
        7,
        7, 
        'All products can be returned within 7 days of delivery. Products must be in original condition with all packaging intact.', 
        'seller',
        true
      )
      ON CONFLICT DO NOTHING;
    `);
    console.log('Inserted default global return policy');

    // Insert default return reasons
    await db.execute(`
      INSERT INTO return_reasons (reason_text, category, display_order, is_active)
      VALUES
        ('Product damaged during shipping', 'return', 10, true),
        ('Product defective or not working', 'return', 20, true),
        ('Product missing parts or accessories', 'return', 30, true),
        ('Received wrong item', 'return', 40, true),
        ('Item does not match description', 'return', 50, true),
        ('Changed my mind', 'return', 60, true),
        ('Better price available elsewhere', 'refund', 10, true),
        ('Ordered by mistake', 'refund', 20, true),
        ('Product not needed anymore', 'refund', 30, true),
        ('Want a different color/size/model', 'replacement', 10, true),
        ('Received damaged item', 'replacement', 20, true),
        ('Product stopped working', 'replacement', 30, true)
      ON CONFLICT DO NOTHING;
    `);
    console.log('Inserted default return reasons');

    console.log('Return management system migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

main();