// Script to test vendor order notification emails
import 'dotenv/config';
import { db } from './server/db';
import { storage } from './server/storage';
import * as emailService from './server/services/email-service';

async function testVendorOrderEmail() {
  try {
    console.log('Email service configured:', emailService.isEmailConfigured());
    
    // Get the latest order from the database
    const latestOrder = await storage.getLatestOrder();
    
    if (!latestOrder) {
      console.error('No orders found in the database. Please create an order first.');
      process.exit(1);
    }
    
    console.log(`Testing vendor notification for order ID: ${latestOrder.id}`);
    
    // Get seller orders for this main order
    const sellerOrders = await storage.getSellerOrdersByOrderId(latestOrder.id);
    console.log(`Found ${sellerOrders.length} seller orders for main order ${latestOrder.id}`);
    
    if (sellerOrders.length === 0) {
      console.error('No seller orders found for this order.');
      process.exit(1);
    }
    
    // Get buyer information
    const buyer = await storage.getUser(latestOrder.userId);
    
    if (!buyer) {
      console.error(`Buyer with ID ${latestOrder.userId} not found.`);
      process.exit(1);
    }
    
    console.log(`Buyer: ${buyer.username} (${buyer.email || 'No email'})`);
    
    // Process each seller order
    for (const sellerOrder of sellerOrders) {
      const seller = await storage.getUser(sellerOrder.sellerId);
      
      if (!seller) {
        console.error(`Seller with ID ${sellerOrder.sellerId} not found.`);
        continue;
      }
      
      console.log(`Testing notification for seller: ${seller.username} (${seller.email || 'No email'})`);
      
      // Get seller's order items
      const orderItems = await storage.getOrderItemsBySellerOrderId(sellerOrder.id);
      console.log(`Seller has ${orderItems.length} items in this order`);
      
      if (!emailService.isEmailConfigured()) {
        console.log('Email service is not configured. Would send email to seller if configured.');
        console.log('Email content would include:');
        console.log(`- Main Order ID: ${latestOrder.id}`);
        console.log(`- Seller Order ID: ${sellerOrder.id}`);
        console.log(`- Total Items: ${orderItems.length}`);
        console.log(`- Seller Order Total: ₹${sellerOrder.subtotal + (sellerOrder.deliveryCharge || 0)}`);
      } else {
        // If email is configured, actually send the test email
        console.log('Sending test email to seller...');
        try {
          const result = await emailService.sendSellerOrderNotification(
            sellerOrder.id,
            latestOrder.id,
            sellerOrder.sellerId,
            buyer
          );
          
          console.log(`Email notification sent: ${result ? 'Success' : 'Failed'}`);
        } catch (error) {
          console.error('Error sending email notification:', error);
        }
      }
    }
    
    console.log('Vendor order notification test completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error testing vendor order emails:', error);
    process.exit(1);
  }
}

testVendorOrderEmail();