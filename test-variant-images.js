// Test script for variant image functionality
const axios = require('axios');

const BASE_URL = 'http://localhost:3000'; // Adjust this to your server URL

async function testVariantImageUpdate() {
  try {
    console.log('Testing variant image update functionality...\n');

    // Test data
    const testProductId = 1;
    const testVariantId = 1;
    const newImages = [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
      'https://example.com/image3.jpg'
    ];

    console.log(`Updating variant ${testVariantId} for product ${testProductId} with new images...`);
    
    // Make a PUT request to update the variant
    const response = await axios.put(`${BASE_URL}/api/products/${testProductId}/variants/${testVariantId}`, {
      price: 2999,
      images: newImages
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Variant update successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Verify that images were updated
    if (response.data.images && Array.isArray(response.data.images)) {
      console.log(`✅ Images updated successfully. Found ${response.data.images.length} images:`);
      response.data.images.forEach((img, index) => {
        console.log(`  ${index + 1}. ${img}`);
      });
    } else {
      console.log('❌ Images were not properly updated');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.log('💡 Note: This might be because the test product/variant IDs don\'t exist.');
      console.log('   You may need to create test data first.');
    }
  }
}

// Run the test
testVariantImageUpdate();
