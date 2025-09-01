// Script to test order email notifications
import 'dotenv/config';
import { db } from './server/db';
import { storage } from './server/storage';
import * as emailService from './server/services/email-service';

async function testOrderEmail() {
  try {
    // Get a real order ID from the database to test with
    const { rows } = await db.execute('SELECT id FROM orders ORDER BY id DESC LIMIT 1');
    
    if (rows.length === 0) {
      console.error('No orders found in the database. Please create an order first.');
      process.exit(1);
    }
    
    const orderId = rows[0].id;
    console.log(`Testing email notifications for order ID: ${orderId}`);
    
    // Test order placed emails
    console.log('Sending order placed emails...');
    await emailService.sendOrderPlacedEmails(orderId);
    
    // Test order cancelled emails
    console.log('Sending order cancelled emails...');
    await emailService.sendOrderCancelledEmails(orderId);
    
    // Test order shipped emails
    console.log('Sending order shipped emails...');
    await emailService.sendOrderShippedEmails(orderId);
    
    console.log('All test emails sent successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error testing order emails:', error);
    process.exit(1);
  }
}

testOrderEmail();