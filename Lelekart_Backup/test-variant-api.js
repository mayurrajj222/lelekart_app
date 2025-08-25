import fetch from 'node:fetch';

async function getProductVariants(productId) {
  try {
    const response = await fetch(`http://localhost:5000/api/product-variants/byProduct/${productId}`);
    const data = await response.text();
    console.log('API Response:', data);
  } catch (error) {
    console.error('Error fetching variants:', error.message);
  }
}

getProductVariants(3748);