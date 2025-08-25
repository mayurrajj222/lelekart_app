const { Pool } = require('pg');
const fs = require('fs');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
require('dotenv').config();

async function createRewardsAndGiftCardsTables() {
  try {
    // Read Database URL from env
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      console.error('DATABASE_URL not found in environment variables');
      process.exit(1);
    }

    // Create a connection pool
    const pool = new Pool({
      connectionString: databaseUrl,
    });

    console.log('Creating Rewards and Gift Cards tables...');

    // SQL statements for creating tables
    const createRewardsTable = `
      CREATE TABLE IF NOT EXISTS rewards (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        points INTEGER NOT NULL DEFAULT 0,
        lifetime_points INTEGER NOT NULL DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createRewardTransactionsTable = `
      CREATE TABLE IF NOT EXISTS reward_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        points INTEGER NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expiry_date TIMESTAMP,
        status TEXT NOT NULL DEFAULT 'active'
      );
    `;

    const createRewardRulesTable = `
      CREATE TABLE IF NOT EXISTS reward_rules (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        points_awarded INTEGER NOT NULL,
        minimum_order_value INTEGER,
        percentage_value DECIMAL,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        valid_from TIMESTAMP,
        valid_to TIMESTAMP,
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createGiftCardsTable = `
      CREATE TABLE IF NOT EXISTS gift_cards (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        initial_value INTEGER NOT NULL,
        current_balance INTEGER NOT NULL,
        issued_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
        purchased_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        expiry_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_used TIMESTAMP,
        recipient_email TEXT,
        recipient_name TEXT,
        message TEXT,
        design_template TEXT DEFAULT 'default'
      );
    `;

    const createGiftCardTransactionsTable = `
      CREATE TABLE IF NOT EXISTS gift_card_transactions (
        id SERIAL PRIMARY KEY,
        gift_card_id INTEGER NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
        amount INTEGER NOT NULL,
        type TEXT NOT NULL,
        transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        note TEXT
      );
    `;

    const createGiftCardTemplatesTable = `
      CREATE TABLE IF NOT EXISTS gift_card_templates (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Execute all table creation queries
    await pool.query(createRewardsTable);
    console.log('✅ Rewards table created.');
    
    await pool.query(createRewardTransactionsTable);
    console.log('✅ Reward Transactions table created.');
    
    await pool.query(createRewardRulesTable);
    console.log('✅ Reward Rules table created.');
    
    await pool.query(createGiftCardsTable);
    console.log('✅ Gift Cards table created.');
    
    await pool.query(createGiftCardTransactionsTable);
    console.log('✅ Gift Card Transactions table created.');
    
    await pool.query(createGiftCardTemplatesTable);
    console.log('✅ Gift Card Templates table created.');

    // Create some default reward rules
    const defaultRewardRules = `
      INSERT INTO reward_rules (name, description, type, points_awarded, minimum_order_value)
      VALUES 
        ('Order Completion', 'Earn points for every order placed', 'purchase', 10, 100),
        ('New User Signup', 'Welcome bonus for new users', 'signup', 50, NULL),
        ('Product Review', 'Earn points for posting a product review', 'review', 15, NULL),
        ('Referral Reward', 'Earn points for referring new customers', 'referral', 100, NULL)
      ON CONFLICT DO NOTHING;
    `;
    
    await pool.query(defaultRewardRules);
    console.log('✅ Default reward rules created.');

    // Create default gift card templates
    const defaultGiftCardTemplates = `
      INSERT INTO gift_card_templates (name, description, image_url, active)
      VALUES 
        ('Birthday Template', 'Special design for birthday gifts', 'https://cdn-icons-png.flaticon.com/512/3782/3782097.png', true),
        ('Holiday Template', 'Festive design for holiday season', 'https://cdn-icons-png.flaticon.com/512/6298/6298358.png', true),
        ('Anniversary Template', 'Elegant design for anniversaries', 'https://cdn-icons-png.flaticon.com/512/2398/2398819.png', true),
        ('Thank You Template', 'Simple design for gratitude', 'https://cdn-icons-png.flaticon.com/512/7022/7022558.png', true)
      ON CONFLICT DO NOTHING;
    `;
    
    await pool.query(defaultGiftCardTemplates);
    console.log('✅ Default gift card templates created.');

    console.log('✅ All Rewards and Gift Cards tables created successfully.');
    
    // Close the pool
    await pool.end();
    
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  }
}

// Run the function
createRewardsAndGiftCardsTables();