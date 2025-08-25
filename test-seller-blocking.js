// Test script to verify seller/admin blocking
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testSellerBlocking() {
  console.log('Testing complete seller/admin blocking...\n');

  // Test cases for different authentication methods
  const testCases = [
    {
      name: 'Seller OTP Request',
      endpoint: '/api/auth/request-otp',
      data: { email: 'seller@example.com' }
    },
    {
      name: 'Admin OTP Request', 
      endpoint: '/api/auth/request-otp',
      data: { email: 'admin@example.com' }
    },
    {
      name: 'Special Admin OTP Request',
      endpoint: '/api/auth/request-otp', 
      data: { email: 'kaushlendra.k12@fms.edu' }
    },
    {
      name: 'Admin Login Attempt',
      endpoint: '/api/auth/admin-login',
      data: { email: 'admin@example.com' }
    },
    {
      name: 'Special Admin Login Attempt',
      endpoint: '/api/auth/admin-login',
      data: { email: 'kaushlendra.k12@fms.edu' }
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`Testing: ${testCase.name}`);
      
      const response = await axios.post(`${BASE_URL}${testCase.endpoint}`, testCase.data, {
        headers: { 'Content-Type': 'application/json' }
      });

      console.log(`❌ FAILED: ${testCase.name} - Should have been blocked but got status ${response.status}`);
      
    } catch (error) {
      if (error.response && error.response.status === 403) {
        const errorMessage = error.response.data?.error;
        if (errorMessage === "Seller and admin not allowed to login in app.") {
          console.log(`✅ PASSED: ${testCase.name} - Properly blocked`);
        } else {
          console.log(`⚠️  PARTIAL: ${testCase.name} - Blocked but wrong message: "${errorMessage}"`);
        }
      } else {
        console.log(`❌ FAILED: ${testCase.name} - Unexpected error:`, error.message);
      }
    }
    
    console.log('---');
  }

  console.log('\nSeller/Admin blocking test completed!');
}

testSellerBlocking();
