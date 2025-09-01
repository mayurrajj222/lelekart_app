// Script to insert varied test notifications for SuperAdmin user
import pkg from 'pg';
const { Pool } = pkg;

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createVariedNotifications() {
  try {
    console.log('Creating varied test notifications...');
    
    // SuperAdmin has user ID 6
    const superAdminId = 6;
    
    // Add different types of notifications
    await pool.query(`
      INSERT INTO notifications (
        user_id, title, message, type, link, metadata
      ) VALUES 
      ($1, 'Price Drop Alert', 'The price of Samsung S23 Ultra has dropped by 15%! Check it out now.', 'PRICE_DROP', '/product/123', $2),
      ($1, 'Product Approval', 'Your product "Gaming Laptop" has been approved and is now live on the marketplace.', 'PRODUCT_APPROVAL', '/seller/products/456', $2),
      ($1, 'New Message from Seller', 'You have a new message from Seller regarding your recent order.', 'NEW_MESSAGE', '/messages', $2),
      ($1, 'System Maintenance', 'The system will be under maintenance on April 25, 2025 from 2-4 AM EST.', 'SYSTEM', null, $2)
    `, [superAdminId, JSON.stringify({ important: true })]);
    
    console.log('Successfully created varied notifications for SuperAdmin');
    
    // Check the notifications created
    const notificationResult = await pool.query(`
      SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 4
    `, [superAdminId]);
    
    if (notificationResult.rows.length > 0) {
      console.log('Created notifications:');
      console.log(notificationResult.rows);
    }
    
    console.log('Varied test notifications completed successfully');
  } catch (error) {
    console.error('Error creating varied test notifications:', error);
  } finally {
    await pool.end();
  }
}

createVariedNotifications();