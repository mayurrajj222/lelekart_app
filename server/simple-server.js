const express = require('express');
const cors = require('cors');

const app = express();
const port = 5000;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Mock product data with variants
const mockProduct = {
  id: 6956,
  name: "Pure Honey - 100% Natural",
  description: "Experience the golden goodness of nature with LeLekart's Pure Honey — straight from the hive to your home. Sourced from high-quality honeycombs and packed without any additives, this natural sweetener is as real as it gets. With its rich aroma, smooth texture, and deep amber color, our honey is a delicious addition to your daily routine — whether drizzled over toast, mixed into warm water, or used in traditional remedies.",
  price: 150,
  stock: 266,
  rating: 4.3,
  ratingCount: "1,234 ratings",
  discount: "20",
  imageUrl: "https://placehold.co/400x400?text=Honey",
  images: [
    "https://placehold.co/400x400?text=Honey+1",
    "https://placehold.co/400x400?text=Honey+2",
    "https://placehold.co/400x400?text=Honey+3"
  ],
  sellerName: "Nature's Best",
  highlights: [
    "Genuine product",
    "Easy returns",
    "Secure payment"
  ],
               variants: [
               { id: 2627, productId: 6956, sku: "PUREHONEY1-Goldenamber-250ml", color: "Golden amber", size: "250ml", price: 150, mrp: 299, stock: 99, images: ["https://chunumunu.s3.ap-northeast-1.amazonaws.com/34e2621a-7030-4c22-ba6d-b5b62446e4e5-93574807-a1c5-4932-b536-474410062bd2-Screenshot202025-07-1820132022.png"], createdAt: "2025-07-21T07:23:42.411Z", gstDetails: { gstRate: 0, basePrice: 150, gstAmount: 0, priceWithGst: 150 } },
               { id: 2628, productId: 6956, sku: "PUREHONEY1-Goldenamber-500ml", color: "Golden amber", size: "500 ml", price: 275, mrp: 399, stock: 100, images: ["https://chunumunu.s3.ap-northeast-1.amazonaws.com/c085b02f-6645-4889-be5a-056539491c1c-bd5d3450-35db-4028-beda-ed8dc16bd79f-Screenshot202025-07-1820132022.png"], createdAt: "2025-07-21T07:23:42.411Z", gstDetails: { gstRate: 0, basePrice: 275, gstAmount: 0, priceWithGst: 275 } },
               { id: 2629, productId: 6956, sku: "PUREHONEY1-Goldenamber-1000ml", color: "Golden amber", size: "1000 ml", price: 525, mrp: 699, stock: 100, images: ["https://chunumunu.s3.ap-northeast-1.amazonaws.com/ec6efb54-6f61-4326-a68d-81660413560c-Screenshot%202025-07-18%20132640.png"], createdAt: "2025-07-21T07:23:42.411Z", gstDetails: { gstRate: 0, basePrice: 525, gstAmount: 0, priceWithGst: 525 } }
             ]
};

// Product endpoint with variants
app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { variants } = req.query;
  
  console.log(`Product request for ID: ${id}, variants: ${variants}`);
  
  // For now, return the honey product for any ID to test variants
  // In a real app, you would fetch the actual product by ID
  const productToReturn = {
    ...mockProduct,
    id: parseInt(id) || mockProduct.id // Use the requested ID
  };
  
  if (variants === 'true') {
    // Return product with variants included
    res.json(productToReturn);
  } else {
    // Return product without variants
    const { variants: _, ...productWithoutVariants } = productToReturn;
    res.json(productWithoutVariants);
  }
});

// Variants endpoint
app.get('/api/products/:id/variants', (req, res) => {
  const { id } = req.params;
  console.log(`Variants request for product ID: ${id}`);
  res.json(mockProduct.variants);
});

// In-memory cart storage
let cartItems = [];

// Cart endpoints
app.get('/api/cart', (req, res) => {
  console.log('Cart fetch request, items:', cartItems);
  res.json(cartItems);
});

app.post('/api/cart', (req, res) => {
  console.log('Cart add request:', req.body);
  
  const { productId, quantity, selectedColor, selectedSize, variantPrice, variantStock } = req.body;
  
  // Create a new cart item
  const newCartItem = {
    id: Date.now(), // Simple ID generation
    productId: productId,
    quantity: quantity || 1,
    selectedColor: selectedColor,
    selectedSize: selectedSize,
    variantPrice: variantPrice,
    variantStock: variantStock,
    addedAt: new Date().toISOString()
  };
  
  // Add to cart
  cartItems.push(newCartItem);
  
  console.log('Cart items after adding:', cartItems);
  res.json({ success: true, message: 'Product added to cart', item: newCartItem });
});

app.put('/api/cart/:id', (req, res) => {
  console.log('Cart update request:', req.params.id, req.body);
  const { id } = req.params;
  const { quantity } = req.body;
  
  const itemIndex = cartItems.findIndex(item => item.id == id);
  if (itemIndex !== -1) {
    cartItems[itemIndex].quantity = quantity;
    res.json({ success: true, message: 'Cart updated', item: cartItems[itemIndex] });
  } else {
    res.status(404).json({ success: false, message: 'Cart item not found' });
  }
});

app.delete('/api/cart/:id', (req, res) => {
  console.log('Cart delete request:', req.params.id);
  const { id } = req.params;
  
  const itemIndex = cartItems.findIndex(item => item.id == id);
  if (itemIndex !== -1) {
    cartItems.splice(itemIndex, 1);
    res.json({ success: true, message: 'Item removed from cart' });
  } else {
    res.status(404).json({ success: false, message: 'Cart item not found' });
  }
});

app.delete('/api/cart', (req, res) => {
  console.log('Cart clear request');
  cartItems = [];
  res.json({ success: true, message: 'Cart cleared' });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Simple server running on http://localhost:${port}`);
  console.log('Available endpoints:');
  console.log(`  GET /health`);
  console.log(`  GET /api/products/:id?variants=true`);
  console.log(`  GET /api/products/:id/variants`);
  console.log(`  GET /api/cart`);
  console.log(`  POST /api/cart`);
  console.log(`  PUT /api/cart/:id`);
  console.log(`  DELETE /api/cart/:id`);
  console.log(`  DELETE /api/cart`);
}); 