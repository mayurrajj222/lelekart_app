// Test script for authentication blocking
const axios = require('axios');

const BASE_URL = 'http://localhost:3000'; // Adjust this to your server URL

async function testAuthenticationBlocking() {
  console.log('Testing authentication blocking for sellers and admins...\n');

  const testCases = [
    {
      name: 'Admin Login Attempt',
      endpoint: '/api/auth/admin-login',
      data: { email: 'admin@example.com' },
      method: 'POST'
    },
    {
      name: 'Seller OTP Request',
      endpoint: '/api/auth/request-otp',
      data: { email: 'seller@example.com' },
      method: 'POST'
    },
    {
      name: 'Admin OTP Request',
      endpoint: '/api/auth/request-otp',
      data: { email: 'admin@example.com' },
      method: 'POST'
    },
    {
      name: 'Impersonation Attempt',
      endpoint: '/api/admin/impersonate/1',
      data: {},
      method: 'POST'
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`Testing: ${testCase.name}`);
      
      const response = await axios({
        method: testCase.method,
        url: `${BASE_URL}${testCase.endpoint}`,
        data: testCase.data,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`❌ FAILED: ${testCase.name} - Should have been blocked but got status ${response.status}`);
      console.log(`Response:`, response.data);
      
    } catch (error) {
      if (error.response && error.response.status === 403) {
        const errorMessage = error.response.data?.error;
        if (errorMessage === "Seller and admin not allowed to login in app.") {
          console.log(`✅ PASSED: ${testCase.name} - Properly blocked with correct message`);
        } else {
          console.log(`⚠️  PARTIAL: ${testCase.name} - Blocked but wrong message: "${errorMessage}"`);
        }
      } else {
        console.log(`❌ FAILED: ${testCase.name} - Unexpected error:`, error.message);
      }
    }
    
    console.log('---');
  }

  console.log('\nAuthentication blocking test completed!');
}

// Run the test
testAuthenticationBlocking();
