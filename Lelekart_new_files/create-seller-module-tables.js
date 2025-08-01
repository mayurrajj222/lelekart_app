import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure neon to use ws
neonConfig.webSocketConstructor = ws;

// Use the DATABASE_URL environment variable directly
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL
});

async function createSellerModuleTables() {
  try {
    console.log('Creating new seller module tables...');
    
    // Create returns table
    await createTableIfNotExists('returns', `
      CREATE TABLE returns (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id),
        product_id INTEGER NOT NULL REFERENCES products(id),
        seller_id INTEGER NOT NULL REFERENCES users(id),
        return_reason TEXT NOT NULL,
        return_status TEXT NOT NULL DEFAULT 'requested',
        return_date TIMESTAMP NOT NULL DEFAULT NOW(),
        comments TEXT,
        refund_amount DECIMAL(10, 2),
        refund_status TEXT DEFAULT 'pending',
        refund_date TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create seller_analytics table
    await createTableIfNotExists('seller_analytics', `
      CREATE TABLE seller_analytics (
        id SERIAL PRIMARY KEY,
        seller_id INTEGER NOT NULL REFERENCES users(id),
        date TIMESTAMP NOT NULL,
        total_orders INTEGER NOT NULL DEFAULT 0,
        total_revenue DECIMAL(10, 2) NOT NULL DEFAULT 0,
        average_order_value DECIMAL(10, 2),
        total_visitors INTEGER DEFAULT 0,
        conversion_rate DECIMAL(5, 2),
        top_products TEXT,
        category_breakdown TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create seller_payments table
    await createTableIfNotExists('seller_payments', `
      CREATE TABLE seller_payments (
        id SERIAL PRIMARY KEY,
        seller_id INTEGER NOT NULL REFERENCES users(id),
        amount DECIMAL(10, 2) NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        payment_date TIMESTAMP,
        reference_id TEXT,
        payment_method TEXT,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create seller_settings table
    await createTableIfNotExists('seller_settings', `
      CREATE TABLE seller_settings (
        id SERIAL PRIMARY KEY,
        seller_id INTEGER NOT NULL REFERENCES users(id) UNIQUE,
        notification_preferences TEXT,
        tax_information TEXT,
        return_policy TEXT,
        auto_accept_orders BOOLEAN DEFAULT FALSE,
        holiday_mode BOOLEAN DEFAULT FALSE,
        holiday_mode_end_date TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create support_tickets table
    await createTableIfNotExists('support_tickets', `
      CREATE TABLE support_tickets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        subject TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        priority TEXT NOT NULL DEFAULT 'medium',
        assigned_to INTEGER REFERENCES users(id),
        category TEXT NOT NULL,
        attachments TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        resolved_date TIMESTAMP
      )
    `);
    
    // Create support_messages table
    await createTableIfNotExists('support_messages', `
      CREATE TABLE support_messages (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER NOT NULL REFERENCES support_tickets(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        message TEXT NOT NULL,
        attachments TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    console.log('All seller module tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    await pool.end();
  }
}

async function createTableIfNotExists(tableName, createSQL) {
  try {
    // Check if the table exists
    const checkSQL = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) as exists
    `;
    
    const { rows } = await pool.query(checkSQL, [tableName]);
    
    if (!rows[0].exists) {
      console.log(`Creating table ${tableName}...`);
      await pool.query(createSQL);
      console.log(`Table ${tableName} created successfully!`);
    } else {
      console.log(`Table ${tableName} already exists, skipping creation.`);
    }
  } catch (error) {
    console.error(`Error with table ${tableName}:`, error);
    throw error;
  }
}

// Execute the function
createSellerModuleTables();