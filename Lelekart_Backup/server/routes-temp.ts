// One-time use script to delete user 10 by handling all foreign key constraints
import { pool } from './db';

async function deleteUser10() {
  try {
    console.log("Starting deletion of user ID 10...");
    
    // 1. First, handle the products
    console.log("Deleting products for user 10...");
    const productsResult = await pool.query(
      `DELETE FROM products WHERE seller_id = 10 RETURNING id`
    );
    console.log(`Deleted ${productsResult.rowCount} products`);
    
    // 2. Delete from carts
    console.log("Checking for carts for user 10...");
    const cartsResult = await pool.query(
      `DELETE FROM carts WHERE user_id = 10 RETURNING id`
    );
    console.log(`Deleted ${cartsResult.rowCount} carts`);
    
    // 3. Delete from user_activities
    console.log("Checking for user_activities for user 10...");
    const activitiesResult = await pool.query(
      `DELETE FROM user_activities WHERE user_id = 10 RETURNING id`
    );
    console.log(`Deleted ${activitiesResult.rowCount} user activities`);
    
    // 4. Delete from ai_assistant_conversations
    console.log("Checking for ai_assistant_conversations for user 10...");
    const aiConvosResult = await pool.query(
      `DELETE FROM ai_assistant_conversations WHERE user_id = 10 RETURNING id`
    );
    console.log(`Deleted ${aiConvosResult.rowCount} AI assistant conversations`);
    
    // 5. Delete from user_size_preferences
    console.log("Checking for user_size_preferences for user 10...");
    const prefsResult = await pool.query(
      `DELETE FROM user_size_preferences WHERE user_id = 10 RETURNING id`
    );
    console.log(`Deleted ${prefsResult.rowCount} user size preferences`);
    
    // 6. Delete from user_addresses
    console.log("Checking for user_addresses for user 10...");
    const addressesResult = await pool.query(
      `DELETE FROM user_addresses WHERE user_id = 10 RETURNING id`
    );
    console.log(`Deleted ${addressesResult.rowCount} user addresses`);
    
    // 7. Delete from seller_documents, business_details, banking_information
    console.log("Checking for seller_documents, business_details, banking_information for user 10...");
    const docsResult = await pool.query(
      `DELETE FROM seller_documents WHERE seller_id = 10 RETURNING id`
    );
    console.log(`Deleted ${docsResult.rowCount} seller documents`);
    
    const bizResult = await pool.query(
      `DELETE FROM business_details WHERE seller_id = 10 RETURNING id`
    );
    console.log(`Deleted ${bizResult.rowCount} business details`);
    
    const bankResult = await pool.query(
      `DELETE FROM banking_information WHERE seller_id = 10 RETURNING id`
    );
    console.log(`Deleted ${bankResult.rowCount} banking information records`);
    
    // 8. Delete the user
    console.log("Deleting user 10...");
    const userResult = await pool.query(
      `DELETE FROM users WHERE id = 10 RETURNING id, username, email`
    );
    console.log(`Deleted user: ${JSON.stringify(userResult.rows[0])}`);
    
    console.log("User 10 deleted successfully!");
    return true;
  } catch (error) {
    console.error("Error deleting user 10:", error);
    return false;
  }
}

export { deleteUser10 };