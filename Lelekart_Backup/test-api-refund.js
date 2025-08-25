// This script tests the wallet refund functionality by directly updating the database

import pg from 'pg';
const { Pool } = pg;

// Create a new PostgreSQL client
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    console.log('Starting API wallet refund test...');
    
    // Get current wallet balance and order status
    const orderIdToTest = 79;
    
    const beforeQuery = `
      SELECT 
        o.id as order_id, 
        o.status, 
        o.wallet_discount, 
        o.wallet_coins_used,
        u.id as user_id, 
        u.username, 
        w.id as wallet_id, 
        w.balance
      FROM orders o 
      JOIN users u ON o.user_id = u.id 
      JOIN wallets w ON u.id = w.user_id 
      WHERE o.id = $1
    `;
    
    const beforeResult = await pool.query(beforeQuery, [orderIdToTest]);
    if (beforeResult.rows.length === 0) {
      console.error('Order not found!');
      return;
    }
    
    const orderData = beforeResult.rows[0];
    console.log('Before API call:');
    console.log(`Order #${orderData.order_id} status: ${orderData.status}`);
    console.log(`Wallet balance for ${orderData.username}: ${orderData.balance}`);
    console.log(`Wallet coins used in order: ${orderData.wallet_coins_used}`);
    
    // Make sure order is in pending status
    if (orderData.status !== 'pending') {
      console.log('Resetting order to pending status...');
      await pool.query('UPDATE orders SET status = $1 WHERE id = $2', ['pending', orderData.order_id]);
    }
    
    // Get admin user credentials for auth
    const adminResult = await pool.query('SELECT username, password FROM users WHERE username = $1', ['admin']);
    if (adminResult.rows.length === 0) {
      console.error('Admin user not found!');
      return;
    }
    
    const adminUser = adminResult.rows[0];
    
    // Log in as admin
    console.log('\nLogging in as admin...');
    const loginResponse = await fetch('http://0.0.0.0:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: adminUser.username,
        password: 'admin123' // Assuming this is the password
      }),
    });
    
    if (!loginResponse.ok) {
      console.error('Login failed:', await loginResponse.text());
      return;
    }
    
    const loginData = await loginResponse.json();
    const cookies = loginResponse.headers.get('set-cookie');
    
    console.log('Login successful, received authentication cookie');
    
    // Call the API to update order status
    console.log('\nCalling API to update order status to cancelled...');
    const updateResponse = await fetch(`http://0.0.0.0:5000/api/orders/${orderIdToTest}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies,
      },
      body: JSON.stringify({
        status: 'cancelled'
      }),
    });
    
    if (!updateResponse.ok) {
      console.error('Order status update failed:', await updateResponse.text());
      return;
    }
    
    const updateData = await updateResponse.json();
    console.log('Order status update API response:', updateData);
    
    // Wait a short time for any async operations to complete
    console.log('Waiting for server to process changes...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check the updated order and wallet
    const afterQuery = `
      SELECT 
        o.id as order_id, 
        o.status, 
        o.wallet_discount, 
        o.wallet_coins_used,
        u.id as user_id, 
        u.username, 
        w.id as wallet_id, 
        w.balance
      FROM orders o 
      JOIN users u ON o.user_id = u.id 
      JOIN wallets w ON u.id = w.user_id 
      WHERE o.id = $1
    `;
    
    const afterResult = await pool.query(afterQuery, [orderIdToTest]);
    if (afterResult.rows.length === 0) {
      console.error('Could not find order after update!');
      return;
    }
    
    const updatedData = afterResult.rows[0];
    
    console.log('\nAfter API call:');
    console.log(`Order #${updatedData.order_id} status: ${updatedData.status}`);
    console.log(`Wallet balance for ${updatedData.username}: ${updatedData.balance}`);
    
    // Find the wallet transaction that was just created
    const txnListResult = await pool.query(`
      SELECT * FROM wallet_transactions 
      WHERE wallet_id = $1 AND reference_type = $2 
      ORDER BY created_at DESC LIMIT 1
    `, [orderData.wallet_id, 'ORDER_REFUND']);
    
    if (txnListResult.rows.length > 0) {
      console.log('\nWallet refund transaction:');
      console.log(txnListResult.rows[0]);
      
      // Calculate the expected balance
      const expectedBalance = orderData.balance + orderData.wallet_coins_used;
      console.log(`\nExpected new balance: ${expectedBalance}`);
      console.log(`Actual new balance: ${updatedData.balance}`);
      
      if (updatedData.balance === expectedBalance) {
        console.log('\n✅ TEST PASSED: Wallet balance was updated correctly!');
      } else {
        console.log('\n❌ TEST FAILED: Wallet balance was not updated correctly!');
      }
    } else {
      console.log('\n❌ TEST FAILED: No wallet refund transaction found!');
    }
    
    // Logout
    console.log('\nLogging out...');
    const logoutResponse = await fetch('http://0.0.0.0:5000/api/logout', {
      method: 'POST',
      headers: {
        'Cookie': cookies,
      },
    });
    
    if (logoutResponse.ok) {
      console.log('Logout successful');
    } else {
      console.error('Logout failed:', await logoutResponse.text());
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the main function
main();