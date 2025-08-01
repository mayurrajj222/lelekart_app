// Script to populate Mail Us section in the footer
import pg from 'pg';
const { Pool } = pg;

async function populateMailUsContent() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Check if the mail_us section already has content
    const checkResult = await pool.query(
      "SELECT COUNT(*) FROM footer_content WHERE section = 'mail_us'"
    );
    
    const contentCount = parseInt(checkResult.rows[0].count);
    
    if (contentCount > 0) {
      console.log('Mail Us section already has content. Exiting.');
      return;
    }

    // Default address lines
    const mailUsContent = [
      { title: 'Company Name', content: 'Lelekart Internet Private Limited', order: 1 },
      { title: 'Building', content: 'Buildings Alyssa, Begonia & Clove Embassy Tech Village', order: 2 },
      { title: 'Street', content: 'Outer Ring Road', order: 3 },
      { title: 'Area', content: 'Devarabeesanahalli Village', order: 4 },
      { title: 'City', content: 'Bengaluru, 560103', order: 5 },
      { title: 'State/Country', content: 'Karnataka, India', order: 6 }
    ];

    // Insert the content
    for (const item of mailUsContent) {
      await pool.query(
        `INSERT INTO footer_content (section, title, content, "order", is_active) 
         VALUES ($1, $2, $3, $4, $5)`,
        ['mail_us', item.title, item.content, item.order, true]
      );
      console.log(`Added "${item.title}" to Mail Us section`);
    }

    console.log('Mail Us section populated successfully');
  } catch (error) {
    console.error('Error populating Mail Us content:', error);
  } finally {
    pool.end();
  }
}

populateMailUsContent().catch(console.error);