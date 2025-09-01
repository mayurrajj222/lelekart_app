# Lelekart - E-commerce Mobile App

A modern React Native e-commerce application with a beautiful UI and comprehensive features for online shopping.

## 🚀 Features

### Core Features
- **User Authentication** - Secure login/registration with OTP verification
- **Product Catalog** - Browse products with categories and search functionality
- **Shopping Cart** - Add, remove, and manage cart items with quantity controls
- **Wishlist** - Save favorite products for later
- **Order Management** - Track orders and view order history
- **Payment Integration** - Razorpay payment gateway integration
- **Address Management** - Multiple shipping addresses with validation
- **Seller Dashboard** - Complete seller management system

### Advanced Features
- **Voice Search** - Search products using voice commands
- **Product Variants** - Support for different colors, sizes, and variants
- **Real-time Updates** - Live cart and inventory updates
- **Push Notifications** - Order status and promotional notifications
- **Offline Support** - Basic offline functionality with cached data
- **Multi-language Support** - Internationalization ready
- **Dark/Light Theme** - Theme switching capability

### UI/UX Features
- **Beautiful Design** - Modern, intuitive interface with smooth animations
- **Responsive Layout** - Optimized for different screen sizes
- **Loading States** - Elegant loading indicators and skeleton screens
- **Error Handling** - User-friendly error messages and recovery options
- **Accessibility** - Screen reader support and accessibility features

## 📱 Screenshots

*[Add screenshots here]*

## 🛠 Tech Stack

- **Frontend**: React Native 0.80.1
- **Navigation**: React Navigation v7
- **State Management**: React Context API
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Drizzle ORM
- **Payment**: Razorpay Integration
- **Authentication**: Session-based with Passport.js
- **UI Components**: React Native Paper, Vector Icons
- **Animations**: React Native Reanimated
- **Image Handling**: React Native Image Picker
- **HTTP Client**: Axios

## 📋 Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (>= 18.0.0)
- **npm** or **yarn**
- **React Native CLI**
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)
- **PostgreSQL** database
- **Razorpay** account for payments

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/mayurrajj222/lelekart_app.git
cd lelekart_app
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# For iOS (macOS only)
cd ios && bundle install && bundle exec pod install && cd ..
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/lelekart

# Server Configuration
PORT=3000
NODE_ENV=development

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Email Configuration (for OTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# API Base URL
API_BASE_URL=http://localhost:3000
```

### 4. Database Setup

```bash
# Create database
createdb lelekart

# Run migrations (if using Drizzle)
npm run db:migrate
```

### 5. Start the Development Server

```bash
# Start Metro bundler
npm start

# In a new terminal, run the app
npm run android  # For Android
npm run ios      # For iOS (macOS only)

# Or run both server and app together
npm run dev
```

## 📁 Project Structure

```
lelekart_app/
├── src/
│   ├── components/          # Reusable UI components
│   ├── context/            # React Context providers
│   ├── lib/                # Utility functions and API
│   └── screens/            # Screen components
│       ├── assets/         # Screen-specific assets
│       └── profile/        # Profile-related screens
├── server/                 # Backend server code
│   ├── handlers/           # Request handlers
│   ├── helpers/            # Helper functions
│   ├── routes/             # API routes
│   └── utils/              # Server utilities
├── shared/                 # Shared schemas and types
├── android/                # Android-specific files
├── ios/                    # iOS-specific files
└── builds/                 # Build outputs
```

## 🔧 Available Scripts

- `npm start` - Start Metro bundler
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run server` - Start the backend server
- `npm run dev` - Start both frontend and backend
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run build:android` - Build Android APK
- `npm run build:ios` - Build iOS app

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## 📦 Building for Production

### Android

```bash
# Generate signed APK
cd android
./gradlew assembleRelease

# Generate signed AAB
./gradlew bundleRelease
```

### iOS

```bash
# Open in Xcode and build
open ios/Lelekart.xcworkspace
```

## 🔒 Security Features

- **Input Validation** - All user inputs are validated
- **SQL Injection Protection** - Parameterized queries
- **XSS Protection** - Content sanitization
- **CSRF Protection** - Cross-site request forgery protection
- **Secure Headers** - Security headers implementation
- **Rate Limiting** - API rate limiting
- **Session Management** - Secure session handling

## 🌐 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-otp` - OTP verification
- `POST /api/auth/logout` - User logout

### Product Endpoints
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product details
- `GET /api/categories` - Get product categories
- `POST /api/products/search` - Search products

### Cart Endpoints
- `GET /api/cart` - Get user cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update` - Update cart item
- `DELETE /api/cart/remove/:id` - Remove item from cart

### Order Endpoints
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/mayurrajj222/lelekart_app/issues) page
2. Create a new issue with detailed information
3. Contact the development team

## 🙏 Acknowledgments

- React Native community
- React Navigation team
- Razorpay for payment integration
- All contributors and testers

---

**Version**: 1.9.0  
**Last Updated**: January 2025  
**Maintainer**: Mayur Raj
