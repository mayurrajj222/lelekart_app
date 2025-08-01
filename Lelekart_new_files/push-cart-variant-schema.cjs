// Use commonjs syntax since that's what the project appears to be using
const { pool } = require('./server/db');
const { sql } = require('drizzle-orm');

async function addVariantIdToCart() {
  console.log('Adding variantId column to carts table...');

  try {
    // Check if the column already exists
    const checkResult = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'carts' AND column_name = 'variant_id'
    `);

    if (checkResult.rows.length === 0) {
      // If the column doesn't exist, add it
      await pool.query(`
        ALTER TABLE carts 
        ADD COLUMN variant_id INTEGER,
        ADD CONSTRAINT fk_variant
          FOREIGN KEY (variant_id) 
          REFERENCES product_variants(id)
          ON DELETE SET NULL
      `);
      console.log('Successfully added variantId column to carts table');
    } else {
      console.log('variantId column already exists in carts table');
    }
  } catch (error) {
    console.error('Error adding variantId column to carts table:', error);
    throw error;
  }
}

async function main() {
  try {
    await addVariantIdToCart();
    console.log('✅ Cart schema update complete');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Cart schema update failed:', error);
    await pool.end();
    process.exit(1);
  }
}

main();