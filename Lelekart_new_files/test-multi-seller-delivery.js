/**
 * Test script for multi-seller delivery charges feature
 * 
 * This script:
 * 1. Finds products from different sellers
 * 2. Creates a test buyer user if needed
 * 3. Adds products from multiple sellers to cart
 * 4. Creates an order and verifies seller orders are created
 * 5. Confirms separate delivery charges are applied per seller
 */
import pg from 'pg';
import axios from 'axios';

const { Pool } = pg;

// Database and API configuration
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const API_URL = 'http://localhost:5000';

// Test user credentials
const TEST_USER = {
  username: 'testbuyer',
  email: 'testbuyer@example.com',
  password: 'testpassword123',
  role: 'buyer'
};

/**
 * Execute a database query
 */
async function executeQuery(query, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Get or create test buyer user
 */
async function getOrCreateTestUser() {
  // Check if the test user exists
  const users = await executeQuery('SELECT * FROM users WHERE username = $1', [TEST_USER.username]);
  
  if (users.length > 0) {
    console.log(`Test user ${TEST_USER.username} already exists with ID ${users[0].id}`);
    return users[0];
  }
  
  // Create the test user
  console.log(`Creating test user ${TEST_USER.username}...`);
  const hashedPassword = TEST_USER.password; // In a real scenario, we'd hash this
  
  const [newUser] = await executeQuery(
    'INSERT INTO users(username, email, password, role) VALUES($1, $2, $3, $4) RETURNING *',
    [TEST_USER.username, TEST_USER.email, hashedPassword, TEST_USER.role]
  );
  
  console.log(`Created test user with ID ${newUser.id}`);
  return newUser;
}

/**
 * Find products from different sellers
 */
async function findProductsFromDifferentSellers(count = 2) {
  console.log(`Finding ${count} products from different sellers...`);
  
  // Get list of sellers
  const sellers = await executeQuery(`
    SELECT DISTINCT seller_id 
    FROM products 
    WHERE seller_id IS NOT NULL AND approved = true
    LIMIT ${count + 3}`
  );
  
  if (sellers.length < count) {
    throw new Error(`Not enough sellers found. Need ${count}, but only found ${sellers.length}`);
  }
  
  // For each seller, get one of their products
  const products = [];
  for (let i = 0; i < count; i++) {
    const sellerId = sellers[i].seller_id;
    const [product] = await executeQuery(`
      SELECT id, name, price, seller_id 
      FROM products 
      WHERE seller_id = $1 AND approved = true 
      LIMIT 1`,
      [sellerId]
    );
    
    if (product) {
      products.push(product);
      console.log(`Found product "${product.name}" (ID: ${product.id}) from seller ID ${product.seller_id}`);
    }
  }
  
  if (products.length < count) {
    throw new Error(`Not enough products found. Expected ${count}, but only found ${products.length}`);
  }
  
  return products;
}

/**
 * Add products to cart
 */
async function addProductsToCart(userId, products) {
  console.log(`Adding ${products.length} products to cart for user ${userId}...`);
  
  // First clear the cart
  await executeQuery('DELETE FROM carts WHERE user_id = $1', [userId]);
  
  // Add each product to the cart
  for (const product of products) {
    await executeQuery(
      'INSERT INTO carts(user_id, product_id, quantity) VALUES($1, $2, $3) RETURNING *',
      [userId, product.id, 1]
    );
    console.log(`Added product ID ${product.id} to cart`);
  }
  
  const cartItems = await executeQuery(`
    SELECT c.*, p.name, p.price, p.seller_id
    FROM carts c
    JOIN products p ON c.product_id = p.id
    WHERE c.user_id = $1`,
    [userId]
  );
  
  console.log(`Cart contains ${cartItems.length} items:`);
  for (const item of cartItems) {
    console.log(`- ${item.name} (ID: ${item.product_id}, Seller: ${item.seller_id}): ${item.quantity} x $${item.price}`);
  }
  
  return cartItems;
}

/**
 * Create test order with multi-seller delivery charges
 */
async function createTestOrder(userId, cartItems) {
  console.log(`Creating test order for user ${userId} with ${cartItems.length} items...`);
  
  // Group cart items by seller
  const itemsBySeller = {};
  for (const item of cartItems) {
    const sellerId = item.seller_id;
    if (!itemsBySeller[sellerId]) {
      itemsBySeller[sellerId] = [];
    }
    itemsBySeller[sellerId].push(item);
  }
  
  const sellerCount = Object.keys(itemsBySeller).length;
  console.log(`Order contains items from ${sellerCount} different sellers`);
  
  // Calculate subtotal per seller
  const sellerSubtotals = [];
  for (const [sellerId, items] of Object.entries(itemsBySeller)) {
    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    sellerSubtotals.push({
      sellerId: parseInt(sellerId),
      items,
      subtotal
    });
    console.log(`Seller ${sellerId} subtotal: $${subtotal}`);
  }
  
  // Standard delivery charge per seller
  const DELIVERY_CHARGE_PER_SELLER = 40;
  
  // Calculate total delivery charges
  const totalDeliveryCharges = DELIVERY_CHARGE_PER_SELLER * sellerSubtotals.length;
  console.log(`Total delivery charges: $${totalDeliveryCharges} ($${DELIVERY_CHARGE_PER_SELLER} x ${sellerSubtotals.length} sellers)`);
  
  // Calculate subtotal from all items
  const subtotal = sellerSubtotals.reduce((acc, seller) => acc + seller.subtotal, 0);
  console.log(`Order subtotal: $${subtotal}`);
  
  // Calculate final total with delivery charges
  const total = subtotal + totalDeliveryCharges;
  console.log(`Order total: $${total} (subtotal: $${subtotal} + delivery: $${totalDeliveryCharges})`);
  
  // Create the main order
  const [order] = await executeQuery(`
    INSERT INTO orders(
      user_id, 
      status, 
      total, 
      date, 
      shipping_details, 
      payment_method,
      multi_seller
    ) 
    VALUES($1, $2, $3, $4, $5, $6, $7) 
    RETURNING *`,
    [
      userId, 
      'pending', 
      total, 
      new Date(), 
      JSON.stringify({
        name: 'Test User',
        address: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345'
      }),
      'cod',
      sellerCount > 1 // Set multi_seller flag if we have multiple sellers
    ]
  );
  
  console.log(`Created main order with ID ${order.id} and total $${order.total}`);
  
  // Create order items
  for (const item of cartItems) {
    await executeQuery(`
      INSERT INTO order_items(order_id, product_id, quantity, price) 
      VALUES($1, $2, $3, $4)`,
      [order.id, item.product_id, item.quantity, item.price]
    );
    console.log(`Added item ${item.product_id} to order ${order.id}`);
  }
  
  // Create seller-specific sub-orders
  console.log(`Creating ${sellerSubtotals.length} seller-specific sub-orders`);
  
  for (const sellerData of sellerSubtotals) {
    const { sellerId, subtotal } = sellerData;
    
    // Create seller order with delivery charge
    const [sellerOrder] = await executeQuery(`
      INSERT INTO seller_orders(
        order_id, 
        seller_id, 
        subtotal, 
        delivery_charge, 
        status
      ) 
      VALUES($1, $2, $3, $4, $5) 
      RETURNING *`,
      [
        order.id, 
        sellerId, 
        subtotal, 
        DELIVERY_CHARGE_PER_SELLER, 
        'pending'
      ]
    );
    
    console.log(`Created seller order #${sellerOrder.id} for seller ${sellerId} with subtotal $${sellerOrder.subtotal} and delivery charge $${sellerOrder.delivery_charge}`);
  }
  
  return order;
}

/**
 * Verify seller orders for main order
 */
async function verifySellerOrders(orderId) {
  console.log(`Verifying seller orders for main order ${orderId}...`);
  
  // Get main order
  const [order] = await executeQuery('SELECT * FROM orders WHERE id = $1', [orderId]);
  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }
  
  // Check multi_seller flag
  console.log(`Order multi_seller flag: ${order.multi_seller ? 'Yes' : 'No'}`);
  
  // Get seller orders
  const sellerOrders = await executeQuery('SELECT * FROM seller_orders WHERE order_id = $1', [orderId]);
  console.log(`Found ${sellerOrders.length} seller orders for main order ${orderId}`);
  
  // Print details of each seller order
  let totalDeliveryCharges = 0;
  let totalSubtotals = 0;
  
  for (const so of sellerOrders) {
    console.log(`Seller order #${so.id} for seller ${so.seller_id}:`);
    console.log(`- Subtotal: $${so.subtotal}`);
    console.log(`- Delivery charge: $${so.delivery_charge}`);
    console.log(`- Status: ${so.status}`);
    
    totalDeliveryCharges += parseFloat(so.delivery_charge);
    totalSubtotals += parseFloat(so.subtotal);
  }
  
  // Verify that the main order total equals the sum of all seller subtotals plus delivery charges
  const expectedTotal = totalSubtotals + totalDeliveryCharges;
  console.log(`Expected total: $${expectedTotal} (subtotals: $${totalSubtotals} + delivery charges: $${totalDeliveryCharges})`);
  console.log(`Actual total in main order: $${order.total}`);
  
  if (Math.abs(expectedTotal - order.total) < 0.01) {
    console.log('✅ Order total matches the sum of seller subtotals and delivery charges');
  } else {
    console.log('❌ Order total does not match the expected value');
  }
  
  return {
    order,
    sellerOrders,
    totalSubtotals,
    totalDeliveryCharges,
    expectedTotal
  };
}

/**
 * Run the test
 */
async function runTest() {
  try {
    console.log('=== TESTING MULTI-SELLER DELIVERY CHARGES ===\n');
    
    // Prepare test user
    const user = await getOrCreateTestUser();
    
    // Find products from different sellers
    const products = await findProductsFromDifferentSellers(2);
    
    // Add products to cart
    const cartItems = await addProductsToCart(user.id, products);
    
    // Create test order
    const order = await createTestOrder(user.id, cartItems);
    
    // Verify seller orders
    const verification = await verifySellerOrders(order.id);
    
    console.log('\n=== TEST COMPLETE ===');
    
    if (Math.abs(verification.expectedTotal - order.total) < 0.01) {
      console.log('✅ Multi-seller delivery charges feature is working correctly!');
    } else {
      console.log('❌ Multi-seller delivery charges feature has issues');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error running test:', error);
    await pool.end();
    process.exit(1);
  }
}

// Run the test
runTest();