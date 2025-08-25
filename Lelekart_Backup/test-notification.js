// Script to insert a test notification for a user
import pkg from 'pg';
const { Pool } = pkg;

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createTestNotification() {
  try {
    console.log('Creating test notification...');
    
    // Get all users from the database
    const userResult = await pool.query(`
      SELECT id FROM users
    `);
    
    if (userResult.rows.length === 0) {
      console.log('No users found in the database');
      return;
    }
    
    console.log(`Found ${userResult.rows.length} users. Creating notifications for all of them...`);
    
    // Process each user
    for (const user of userResult.rows) {
      const userId = user.id;
      
      // Insert test notifications for this user
      await pool.query(`
        INSERT INTO notifications (
          user_id, 
          title, 
          message, 
          type, 
          link, 
          metadata
        ) VALUES 
        (
          $1, 
          'Order #12345 Status Updated', 
          'Your order has been shipped and is on its way! Expected delivery: April 22, 2025.',
          'ORDER_STATUS',
          '/order/12345',
          $2
        ),
        (
          $1, 
          '₹100 Wallet Bonus Added', 
          'Congratulations! We have added ₹100 to your wallet as a special thank you for being a loyal customer.',
          'WALLET',
          '/buyer/wallet',
          $2
        )
      `, [userId, JSON.stringify({ test: true, priority: 'high' })]);
      
      console.log(`Created test notifications for user ID: ${userId}`);
      
      // Check the last notification created
      const notificationResult = await pool.query(`
        SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1
      `, [userId]);
      
      if (notificationResult.rows.length > 0) {
        console.log('Last notification details:');
        console.log(notificationResult.rows[0]);
      }
    }
    
    console.log('Test notifications completed successfully');
  } catch (error) {
    console.error('Error creating test notification:', error);
  } finally {
    await pool.end();
  }
}

createTestNotification();