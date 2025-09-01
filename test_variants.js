// Simple test to verify variants are working
const API_BASE = 'http://192.168.1.100:3001'; // Adjust this to your server IP

async function testVariants() {
  try {
    // Test both product IDs
    const productIds = ['7170', '7171'];
    
    for (const productId of productIds) {
      console.log(`\n=== Testing product ${productId} variants ===`);
      
      const response = await fetch(`${API_BASE}/api/products/${productId}?variants=true`);
      const data = await response.json();
      
      console.log('Response status:', response.status);
      console.log('Product ID:', data.id);
      console.log('Product name:', data.name);
      console.log('Variants count:', data.variants?.length || 0);
      
      if (data.variants && data.variants.length > 0) {
        console.log('First variant:', data.variants[0]);
        console.log('All variants:');
        data.variants.forEach((variant, index) => {
          console.log(`${index + 1}. Color: ${variant.color}, Size: ${variant.size}, Stock: ${variant.stock}`);
        });
      } else {
        console.log('No variants found in response');
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testVariants();
