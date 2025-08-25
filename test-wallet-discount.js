// Test script to verify wallet discount functionality
const API_BASE = 'http://localhost:5000';

// Mock test data
const testData = {
  cartItems: [
    {
      product: {
        id: 1,
        name: "Test Product",
        price: 1000, // ₹1000
        quantity: 1
      }
    }
  ],
  walletDiscount: 100, // ₹100 discount
  walletCoinsUsed: 100
};

// Test create order with wallet discount
async function testCreateOrderWithWalletDiscount() {
  try {
    console.log('Testing create order with wallet discount...');
    
    const response = await fetch(`${API_BASE}/api/razorpay/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cartItems: testData.cartItems,
        walletDiscount: testData.walletDiscount,
        walletCoinsUsed: testData.walletCoinsUsed,
        shippingDetails: {
          name: 'Test User',
          email: 'test@example.com',
          phone: '1234567890',
          address: 'Test Address',
          city: 'Test City',
          state: 'Test State',
          zipCode: '123456'
        }
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Create order with wallet discount successful');
      console.log('Order ID:', result.orderId);
      console.log('Amount (paise):', result.amount);
      console.log('Amount (₹):', (result.amount / 100).toFixed(2));
      console.log('Expected amount (₹):', (1000 - 100).toFixed(2));
      
      // Verify the amount is correct (should be 90000 paise = ₹900)
      if (result.amount === 90000) {
        console.log('✅ Amount calculation is correct');
      } else {
        console.log('❌ Amount calculation is incorrect');
      }
    } else {
      console.log('❌ Create order failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Test verify payment with wallet discount
async function testVerifyPaymentWithWalletDiscount() {
  try {
    console.log('\nTesting verify payment with wallet discount...');
    
    const response = await fetch(`${API_BASE}/api/razorpay/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        razorpayOrderId: 'test_order_id',
        razorpayPaymentId: 'test_payment_id',
        razorpaySignature: 'test_signature',
        walletDiscount: testData.walletDiscount,
        walletCoinsUsed: testData.walletCoinsUsed,
        shippingDetails: {
          name: 'Test User',
          email: 'test@example.com',
          phone: '1234567890',
          address: 'Test Address',
          city: 'Test City',
          state: 'Test State',
          zipCode: '123456'
        }
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Verify payment with wallet discount successful');
      console.log('Order created:', result.order);
    } else {
      console.log('❌ Verify payment failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run tests
async function runTests() {
  console.log('🧪 Testing Wallet Discount Functionality\n');
  
  await testCreateOrderWithWalletDiscount();
  await testVerifyPaymentWithWalletDiscount();
  
  console.log('\n🏁 Tests completed');
}

// Run the tests
runTests(); 