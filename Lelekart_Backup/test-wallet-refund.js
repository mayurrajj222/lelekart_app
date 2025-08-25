import { pool } from './server/db.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// We need to manually import our handler
const orderStatusHandlerPath = path.join(__dirname, 'server/handlers/order-status-handler.ts');

async function runTest() {
  try {
    // Import the order status handler module
    const { handleOrderStatusChange } = await import(orderStatusHandlerPath);
    
    // First, log the current status and wallet information
    console.log('Before updating order status:');
    
    // Get order info
    const orderResult = await pool.query('SELECT id, status, wallet_discount, wallet_coins_used FROM orders WHERE id = 76');
    console.log('Order before update:', orderResult.rows[0]);
    
    // Get user wallet info
    const walletResult = await pool.query(`
      SELECT o.user_id, u.username, w.balance 
      FROM orders o 
      JOIN users u ON o.user_id = u.id 
      JOIN wallets w ON u.id = w.user_id 
      WHERE o.id = 76
    `);
    console.log('User wallet before update:', walletResult.rows[0]);
    
    // Change order status to 'cancelled' 
    console.log('Changing order status to cancelled...');
    await handleOrderStatusChange(76, 'cancelled');
    
    // Check order status after update
    console.log('\nAfter updating order status:');
    
    // Get updated order info
    const updatedOrderResult = await pool.query('SELECT id, status, wallet_discount, wallet_coins_used FROM orders WHERE id = 76');
    console.log('Order after update:', updatedOrderResult.rows[0]);
    
    // Get updated wallet info
    const updatedWalletResult = await pool.query(`
      SELECT o.user_id, u.username, w.balance 
      FROM orders o 
      JOIN users u ON o.user_id = u.id 
      JOIN wallets w ON u.id = w.user_id 
      WHERE o.id = 76
    `);
    console.log('User wallet after update:', updatedWalletResult.rows[0]);
    
    // Get wallet transactions for the refund
    const walletTransactions = await pool.query(`
      SELECT wt.* 
      FROM wallet_transactions wt
      JOIN wallets w ON wt.wallet_id = w.id
      JOIN users u ON w.user_id = u.id
      JOIN orders o ON o.user_id = u.id
      WHERE o.id = 76 AND wt.reference_type = 'ORDER_REFUND'
      ORDER BY wt.created_at DESC
      LIMIT 1
    `);
    
    if (walletTransactions.rows.length > 0) {
      console.log('\nWallet refund transaction:', walletTransactions.rows[0]);
    } else {
      console.log('\nNo wallet refund transaction found');
    }
    
  } catch (error) {
    console.error('Error running test:', error);
  } finally {
    // Clean up - exit process
    process.exit(0);
  }
}

runTest();