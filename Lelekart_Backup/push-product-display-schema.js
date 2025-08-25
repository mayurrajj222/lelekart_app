import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createProductDisplaySettingsTable() {
  const client = await pool.connect();
  try {
    console.log('Creating product_display_settings table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_display_settings (
        id SERIAL PRIMARY KEY,
        display_type VARCHAR(50) NOT NULL,
        config JSONB NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Check if any settings already exist, if not create default settings
    const { rows } = await client.query('SELECT COUNT(*) FROM product_display_settings');
    
    if (parseInt(rows[0].count) === 0) {
      console.log('Adding default display settings...');
      await client.query(`
        INSERT INTO product_display_settings (display_type, config)
        VALUES ('recent', '{"description": "Show most recent products first"}')
      `);
    }
    
    console.log('product_display_settings table created successfully');
  } catch (error) {
    console.error('Error creating product_display_settings table:', error);
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await createProductDisplaySettingsTable();
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    await pool.end();
    console.log('Database connection closed');
  }
}

main();