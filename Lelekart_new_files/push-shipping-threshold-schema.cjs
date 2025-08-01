require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addFreeShippingThresholdSetting() {
  try {
    console.log('Adding free_shipping_threshold setting to system_settings table...');
    
    // Check if the setting already exists
    const settingCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM system_settings
        WHERE key = 'free_shipping_threshold'
      );
    `);
    
    const settingExists = settingCheck.rows[0].exists;
    
    if (!settingExists) {
      console.log('Adding free_shipping_threshold setting...');
      
      await pool.query(`
        INSERT INTO system_settings (key, value, description)
        VALUES ('free_shipping_threshold', '700', 'Order value threshold above which shipping is free (in INR)');
      `);
      
      console.log('Free shipping threshold setting added successfully');
    } else {
      console.log('Free shipping threshold setting already exists');
    }
    
    console.log('Free shipping threshold setting migration completed successfully');
  } catch (error) {
    console.error('Error in free shipping threshold setting migration:', error);
  } finally {
    await pool.end();
  }
}

addFreeShippingThresholdSetting();
