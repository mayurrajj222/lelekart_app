const API_BASE = 'http://localhost:5000';

async function testRazorpayIntegration() {
  console.log('🧪 Testing Razorpay Integration...\n');

  try {
    // Test 1: Get Razorpay Key
    console.log('1. Testing GET /api/razorpay/key...');
    const keyResponse = await fetch(`${API_BASE}/api/razorpay/key`);
    const keyData = await keyResponse.json();
    
    if (keyResponse.ok) {
      console.log('✅ Razorpay key fetched successfully');
      console.log(`   Key ID: ${keyData.keyId.substring(0, 10)}...`);
    } else {
      console.log('❌ Failed to fetch Razorpay key');
      console.log(`   Error: ${keyData.error}`);
    }

    // Test 2: Get Configuration Status
    console.log('\n2. Testing GET /api/razorpay/config...');
    const configResponse = await fetch(`${API_BASE}/api/razorpay/config`);
    const configData = await configResponse.json();
    
    if (configResponse.ok) {
      console.log('✅ Razorpay configuration fetched successfully');
      console.log(`   Configured: ${configData.isConfigured}`);
      console.log(`   Key ID Valid: ${configData.keyIdValid}`);
      console.log(`   Key Secret Valid: ${configData.keySecretValid}`);
    } else {
      console.log('❌ Failed to fetch Razorpay configuration');
      console.log(`   Error: ${configData.error}`);
    }

    // Test 3: Health Check
    console.log('\n3. Testing server health...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    
    if (healthResponse.ok) {
      console.log('✅ Server is running and healthy');
    } else {
      console.log('❌ Server health check failed');
    }

    console.log('\n🎉 Razorpay integration test completed!');
    console.log('\n📝 Next Steps:');
    console.log('1. Start the React Native app');
    console.log('2. Navigate to Order Summary screen');
    console.log('3. Select "Razorpay" as payment method');
    console.log('4. Test the payment flow');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure the server is running: npm run server');
    console.log('2. Check if port 5000 is available');
    console.log('3. Verify .env file has correct Razorpay keys');
    console.log('4. Check server logs for detailed errors');
  }
}

// Run the test
testRazorpayIntegration(); 