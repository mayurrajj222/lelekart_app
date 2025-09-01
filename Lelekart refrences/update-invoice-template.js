import fs from 'fs';
import pg from 'pg';
const { Pool } = pg;

// Read the template file
const template = fs.readFileSync('flipkart_style_invoice_template.html', 'utf8');

// Connect to the database
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Update the template
async function updateTemplate() {
  try {
    console.log('Updating tax invoice template...');
    
    // First check if the template exists
    const checkResult = await pool.query(
      'SELECT * FROM document_templates WHERE type = $1',
      ['tax_invoice']
    );
    
    if (checkResult.rows.length > 0) {
      // Update existing template
      const result = await pool.query(
        'UPDATE document_templates SET content = $1, updated_at = NOW() WHERE type = $2 RETURNING id',
        [template, 'tax_invoice']
      );
      console.log('Tax invoice template updated successfully. Updated template ID:', result.rows[0].id);
    } else {
      // Insert new template
      const result = await pool.query(
        'INSERT INTO document_templates (type, name, content, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id',
        ['tax_invoice', 'Flipkart Style Tax Invoice', template]
      );
      console.log('Tax invoice template created successfully. New template ID:', result.rows[0].id);
    }
  } catch (err) {
    console.error('Error updating tax invoice template:', err);
  } finally {
    pool.end();
  }
}

updateTemplate();