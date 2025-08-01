// CommonJS version of the migration script
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
const dotenv = require('dotenv');

dotenv.config();

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createWalletTables() {
  try {
    console.log('Starting wallet schema creation...');
    
    // Create wallet_settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wallet_settings (
        id SERIAL PRIMARY KEY,
        first_purchase_coins INTEGER NOT NULL DEFAULT 500,
        coin_to_currency_ratio DECIMAL(10, 2) NOT NULL DEFAULT 0.10,
        min_order_value DECIMAL(10, 2) NOT NULL DEFAULT 500.00,
        max_redeemable_coins INTEGER NOT NULL DEFAULT 200,
        coin_expiry_days INTEGER NOT NULL DEFAULT 90,
        is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('wallet_settings table created or already exists');

    // Create wallets table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE,
        balance INTEGER NOT NULL DEFAULT 0,
        lifetime_earned INTEGER NOT NULL DEFAULT 0,
        lifetime_redeemed INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('wallets table created or already exists');

    // Create wallet_transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id SERIAL PRIMARY KEY,
        wallet_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        transaction_type VARCHAR(50) NOT NULL,
        reference_type VARCHAR(50),
        reference_id INTEGER,
        description TEXT,
        expires_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
      )
    `);
    console.log('wallet_transactions table created or already exists');

    // Create a default wallet_settings record if none exists
    const settingsCountResult = await pool.query(`SELECT COUNT(*) FROM wallet_settings`);
    if (parseInt(settingsCountResult.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO wallet_settings (
          first_purchase_coins, 
          coin_to_currency_ratio, 
          min_order_value, 
          max_redeemable_coins, 
          coin_expiry_days, 
          is_enabled
        ) VALUES (
          500, 0.10, 500.00, 200, 90, TRUE
        )
      `);
      console.log('Default wallet settings created');
    }

    console.log('Wallet schema creation completed successfully');
  } catch (error) {
    console.error('Error creating wallet schema:', error);
    throw error;
  } finally {
    // Close pool
    await pool.end();
  }
}

// Execute the function
createWalletTables()
  .then(() => {
    console.log('Wallet tables created successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to create wallet tables:', error);
    process.exit(1);
  });