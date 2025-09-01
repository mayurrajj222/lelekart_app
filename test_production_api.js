// Test production API for variants
const API_BASE = 'https://www.lelekart.com';

async function testProductionAPI() {
  try {
    // Test both product IDs
    const productIds = ['7170', '7171'];
    
    for (const productId of productIds) {
      console.log(`\n=== Testing Production API for product ${productId} ===`);
      
      // Test without variants
      console.log('Testing without variants...');
      const response1 = await fetch(`${API_BASE}/api/products/${productId}`);
      const data1 = await response1.json();
      
      console.log('Response status:', response1.status);
      console.log('Product ID:', data1.id);
      console.log('Product name:', data1.name);
      console.log('Has variants field:', 'variants' in data1);
      console.log('Variants count:', data1.variants?.length || 0);
      
      // Test with variants
      console.log('\nTesting with variants...');
      const response2 = await fetch(`${API_BASE}/api/products/${productId}?variants=true`);
      const data2 = await response2.json();
      
      console.log('Response status:', response2.status);
      console.log('Product ID:', data2.id);
      console.log('Product name:', data2.name);
      console.log('Has variants field:', 'variants' in data2);
      console.log('Variants count:', data2.variants?.length || 0);
      
      if (data2.variants && data2.variants.length > 0) {
        console.log('First variant:', data2.variants[0]);
        console.log('All variants:');
        data2.variants.forEach((variant, index) => {
          console.log(`${index + 1}. Color: ${variant.color}, Size: ${variant.size}, Stock: ${variant.stock}`);
        });
      } else {
        console.log('No variants found in production response');
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testProductionAPI();


