const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const { randomBytes } = require('crypto');

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Session setup
const SESSION_SECRET = process.env.SESSION_SECRET || randomBytes(32).toString('hex');
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }
}));

app.use(passport.initialize());
app.use(passport.session());

// Mock users
const users = [
  { id: 1, email: 'buyer@example.com', username: 'buyer1', role: 'buyer' },
  { id: 2, email: 'seller@example.com', username: 'seller1', role: 'seller' },
  { id: 3, email: 'admin@example.com', username: 'admin1', role: 'admin' }
];

const otpStorage = new Map();

// Passport config
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  const user = users.find(u => u.id === id);
  if (!user || user.role !== "buyer") {
    return done(null, false, { message: "Seller and admin not allowed to login in app." });
  }
  done(null, user);
});

// Auth middleware
function authenticateToken(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (req.user && req.user.role !== "buyer") {
    return req.logout((err) => {
      if (err) return res.status(500).json({ error: "Internal server error." });
      return res.status(403).json({ error: "Seller and admin not allowed to login in app." });
    });
  }
  next();
}

// Auth routes
app.post("/api/auth/request-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Invalid email address" });
    
    const existingUser = users.find(u => u.email === email);
    if (existingUser && (existingUser.role === "seller" || existingUser.role === "admin")) {
      return res.status(403).json({ error: "Seller and admin not allowed to login in app." });
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStorage.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });
    
    console.log(`OTP sent to ${email}: ${otp}`);
    res.status(200).json({ message: "OTP sent successfully", email, expiresIn: 10 * 60 });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: "Invalid request" });
    
    const storedOTP = otpStorage.get(email);
    if (!storedOTP || storedOTP.otp !== otp || Date.now() > storedOTP.expiresAt) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }
    
    otpStorage.delete(email);
    const existingUser = users.find(u => u.email === email);
    
    if (existingUser) {
      if (existingUser.role !== "buyer") {
        return res.status(403).json({ error: "Seller and admin not allowed to login in app." });
      }
      req.login(existingUser, (err) => {
        if (err) return res.status(500).json({ error: "Login failed" });
        return res.status(200).json({ user: existingUser, isNewUser: false, message: "Login successful" });
      });
    } else {
      return res.status(200).json({ isNewUser: true, email, message: "OTP verified. Please complete registration." });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, name } = req.body;
    if (!username || !email) return res.status(400).json({ error: "Invalid registration data" });
    
    const existingUser = users.find(u => u.email === email || u.username === username);
    if (existingUser) return res.status(400).json({ error: "User already exists" });
    
    const newUser = { id: users.length + 1, username, email, role: "buyer", name: name || "" };
    users.push(newUser);
    
    req.login(newUser, (err) => {
      if (err) return res.status(500).json({ error: "Registration failed" });
      res.status(201).json({ user: newUser, message: "Registration successful" });
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.status(200).json({ message: "Logout successful" });
  });
});

// Block admin login
app.post("/api/auth/admin-login", (req, res) => {
  return res.status(403).json({ error: "Seller and admin not allowed to login in app." });
});

// Block impersonation
app.post("/api/admin/impersonate/:userId", (req, res) => {
  return res.status(403).json({ error: "Seller and admin not allowed to login in app." });
});

app.get("/api/user", (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  res.json(req.user);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', auth: 'enabled', sellerBlocking: 'active' });
});

// Mock product with variants
const mockProduct = {
  id: 6956,
  name: "Pure Honey - 100% Natural",
  price: 150,
  stock: 266,
  imageUrl: "https://placehold.co/400x400?text=Honey",
  images: [
    "https://placehold.co/400x400?text=Honey+1",
    "https://placehold.co/400x400?text=Honey+2",
    "https://placehold.co/400x400?text=Honey+3"
  ],
  variants: [
    { id: 2627, color: "Golden amber", size: "250ml", price: 150, images: ["https://placehold.co/400x400?text=Honey+Golden+250ml"] },
    { id: 2628, color: "Golden amber", size: "500ml", price: 275, images: ["https://placehold.co/400x400?text=Honey+Golden+500ml"] },
    { id: 2629, color: "Golden amber", size: "1000ml", price: 525, images: ["https://placehold.co/400x400?text=Honey+Golden+1000ml"] }
  ]
};

// Protected product endpoints
app.get('/api/products/:id', authenticateToken, (req, res) => {
  const { variants } = req.query;
  const productToReturn = { ...mockProduct, id: parseInt(req.params.id) || mockProduct.id };
  
  if (variants === 'true') {
    res.json(productToReturn);
  } else {
    const { variants: _, ...productWithoutVariants } = productToReturn;
    res.json(productWithoutVariants);
  }
});

app.get('/api/products/:id/variants', authenticateToken, (req, res) => {
  res.json(mockProduct.variants);
});

// Protected cart endpoints
let cartItems = [];

app.get('/api/cart', authenticateToken, (req, res) => {
  res.json(cartItems);
});

app.post('/api/cart', authenticateToken, (req, res) => {
  const { productId, quantity, selectedColor, selectedSize } = req.body;
  const newCartItem = {
    id: Date.now(),
    productId,
    quantity: quantity || 1,
    selectedColor,
    selectedSize,
    addedAt: new Date().toISOString()
  };
  cartItems.push(newCartItem);
  res.json({ success: true, message: 'Product added to cart', item: newCartItem });
});

app.put('/api/cart/:id', authenticateToken, (req, res) => {
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

app.delete('/api/cart/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const itemIndex = cartItems.findIndex(item => item.id == id);
  if (itemIndex !== -1) {
    cartItems.splice(itemIndex, 1);
    res.json({ success: true, message: 'Item removed from cart' });
  } else {
    res.status(404).json({ success: false, message: 'Cart item not found' });
  }
});

app.delete('/api/cart', authenticateToken, (req, res) => {
  cartItems = [];
  res.json({ success: true, message: 'Cart cleared' });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 PRODUCTION SERVER RUNNING on port ${port}`);
  console.log('🛡️  AUTHENTICATION: ENABLED');
  console.log('🚫 SELLER/ADMIN BLOCKING: ACTIVE');
  console.log('✅ ONLY BUYERS CAN LOGIN');
});
