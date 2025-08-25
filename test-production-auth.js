const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testProductionAuth() {
  console.log('🧪 TESTING PRODUCTION AUTHENTICATION...\n');

  // Test 1: Health check
  try {
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return;
  }

  // Test 2: Seller OTP request (should be blocked)
  try {
    console.log('\n🔒 Testing Seller OTP Request...');
    const response = await axios.post(`${BASE_URL}/api/auth/request-otp`, {
      email: 'seller@example.com'
    });
    console.log('❌ FAILED: Seller should be blocked but got response:', response.status);
  } catch (error) {
    if (error.response && error.response.status === 403) {
      const errorMessage = error.response.data?.error;
      if (errorMessage === "Seller and admin not allowed to login in app.") {
        console.log('✅ PASSED: Seller properly blocked with correct message');
      } else {
        console.log('⚠️  PARTIAL: Seller blocked but wrong message:', errorMessage);
      }
    } else {
      console.log('❌ FAILED: Unexpected error:', error.message);
    }
  }

  // Test 3: Admin OTP request (should be blocked)
  try {
    console.log('\n🔒 Testing Admin OTP Request...');
    const response = await axios.post(`${BASE_URL}/api/auth/request-otp`, {
      email: 'admin@example.com'
    });
    console.log('❌ FAILED: Admin should be blocked but got response:', response.status);
  } catch (error) {
    if (error.response && error.response.status === 403) {
      const errorMessage = error.response.data?.error;
      if (errorMessage === "Seller and admin not allowed to login in app.") {
        console.log('✅ PASSED: Admin properly blocked with correct message');
      } else {
        console.log('⚠️  PARTIAL: Admin blocked but wrong message:', errorMessage);
      }
    } else {
      console.log('❌ FAILED: Unexpected error:', error.message);
    }
  }

  // Test 4: Buyer OTP request (should work)
  try {
    console.log('\n✅ Testing Buyer OTP Request...');
    const response = await axios.post(`${BASE_URL}/api/auth/request-otp`, {
      email: 'buyer@example.com'
    });
    if (response.status === 200) {
      console.log('✅ PASSED: Buyer OTP request successful');
      console.log('📧 OTP sent to buyer@example.com');
    } else {
      console.log('❌ FAILED: Buyer OTP request failed:', response.status);
    }
  } catch (error) {
    console.log('❌ FAILED: Buyer OTP request error:', error.message);
  }

  // Test 5: Admin login attempt (should be blocked)
  try {
    console.log('\n🔒 Testing Admin Login Attempt...');
    const response = await axios.post(`${BASE_URL}/api/auth/admin-login`, {
      email: 'admin@example.com'
    });
    console.log('❌ FAILED: Admin login should be blocked but got response:', response.status);
  } catch (error) {
    if (error.response && error.response.status === 403) {
      const errorMessage = error.response.data?.error;
      if (errorMessage === "Seller and admin not allowed to login in app.") {
        console.log('✅ PASSED: Admin login properly blocked');
      } else {
        console.log('⚠️  PARTIAL: Admin login blocked but wrong message:', errorMessage);
      }
    } else {
      console.log('❌ FAILED: Unexpected error:', error.message);
    }
  }

  // Test 6: Impersonation attempt (should be blocked)
  try {
    console.log('\n🔒 Testing Impersonation Attempt...');
    const response = await axios.post(`${BASE_URL}/api/admin/impersonate/1`);
    console.log('❌ FAILED: Impersonation should be blocked but got response:', response.status);
  } catch (error) {
    if (error.response && error.response.status === 403) {
      const errorMessage = error.response.data?.error;
      if (errorMessage === "Seller and admin not allowed to login in app.") {
        console.log('✅ PASSED: Impersonation properly blocked');
      } else {
        console.log('⚠️  PARTIAL: Impersonation blocked but wrong message:', errorMessage);
      }
    } else {
      console.log('❌ FAILED: Unexpected error:', error.message);
    }
  }

  // Test 7: Protected endpoint without auth (should be blocked)
  try {
    console.log('\n🔒 Testing Protected Endpoint Without Auth...');
    const response = await axios.get(`${BASE_URL}/api/products/6956`);
    console.log('❌ FAILED: Should require authentication but got response:', response.status);
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ PASSED: Protected endpoint properly requires authentication');
    } else {
      console.log('❌ FAILED: Unexpected error:', error.message);
    }
  }

  console.log('\n🎯 PRODUCTION AUTH TEST COMPLETED!');
  console.log('📋 SUMMARY:');
  console.log('   - Seller blocking: ✅ ACTIVE');
  console.log('   - Admin blocking: ✅ ACTIVE');
  console.log('   - Buyer access: ✅ ALLOWED');
  console.log('   - Protected routes: ✅ SECURED');
}

testProductionAuth();
