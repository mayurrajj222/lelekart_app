// This is a simple script to test the wallet refund functionality

// Import the PostgreSQL client
import pg from 'pg';
const { Pool } = pg;

// Create a new PostgreSQL client
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    console.log('Starting wallet refund test...');
    
    // Get current wallet balance and order status
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
      WHERE o.id = 80
    `;
    
    const beforeResult = await pool.query(beforeQuery);
    if (beforeResult.rows.length === 0) {
      console.error('Order not found!');
      return;
    }
    
    const orderData = beforeResult.rows[0];
    console.log('Before refund:');
    console.log(`Order #${orderData.order_id} status: ${orderData.status}`);
    console.log(`Wallet balance for ${orderData.username}: ${orderData.balance}`);
    console.log(`Wallet coins used in order: ${orderData.wallet_coins_used}`);
    
    // Make sure order is in pending status
    if (orderData.status !== 'pending') {
      console.log('Resetting order to pending status...');
      await pool.query('UPDATE orders SET status = $1 WHERE id = $2', ['pending', orderData.order_id]);
    }
    
    // Manually insert a refund transaction
    console.log('\nProcessing refund...');
    const walletCoinsUsed = orderData.wallet_coins_used || 0;
    
    if (walletCoinsUsed <= 0) {
      console.log('No wallet coins were used in this order, nothing to refund.');
      return;
    }
    
    // 1. Add transaction record
    const txnResult = await pool.query(`
      INSERT INTO wallet_transactions 
        (wallet_id, amount, transaction_type, reference_type, reference_id, description, created_at) 
      VALUES 
        ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `, [
      orderData.wallet_id,
      walletCoinsUsed,
      'REFUND',
      'ORDER_REFUND',
      orderData.order_id,
      `Refund for cancelled order #${orderData.order_id}`
    ]);
    
    console.log(`Created transaction: ${JSON.stringify(txnResult.rows[0])}`);
    
    // 2. Update wallet balance
    const newBalance = orderData.balance + walletCoinsUsed;
    const walletResult = await pool.query(`
      UPDATE wallets 
      SET balance = $1, updated_at = NOW() 
      WHERE id = $2
      RETURNING *
    `, [newBalance, orderData.wallet_id]);
    
    console.log(`Updated wallet: ${JSON.stringify(walletResult.rows[0])}`);
    
    // 3. Set order status to cancelled
    await pool.query(`
      UPDATE orders 
      SET status = $1
      WHERE id = $2
    `, ['cancelled', orderData.order_id]);
    
    // 4. Verify results
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
      WHERE o.id = 80
    `;
    
    const afterResult = await pool.query(afterQuery);
    const updatedData = afterResult.rows[0];
    
    console.log('\nAfter refund:');
    console.log(`Order #${updatedData.order_id} status: ${updatedData.status}`);
    console.log(`Wallet balance for ${updatedData.username}: ${updatedData.balance}`);
    console.log(`Wallet coins refunded: ${walletCoinsUsed}`);
    
    // Find the wallet transaction that was just created
    const txnListResult = await pool.query(`
      SELECT * FROM wallet_transactions 
      WHERE wallet_id = $1 AND reference_type = $2 
      ORDER BY created_at DESC LIMIT 1
    `, [orderData.wallet_id, 'ORDER_REFUND']);
    
    if (txnListResult.rows.length > 0) {
      console.log('\nWallet refund transaction:');
      console.log(txnListResult.rows[0]);
    } else {
      console.log('\nNo wallet refund transaction found!');
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