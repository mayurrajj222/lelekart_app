# LeLeKart E-commerce Platform Architecture

## Overview

LeLeKart is a full-stack e-commerce platform that supports multiple sellers, product management, order processing, and various payment integrations. The architecture follows a modern web application approach with a clear separation between frontend and backend components.

The system is designed as a monolithic application that combines frontend and backend into a single deployable unit, while maintaining a clear separation of concerns through dedicated directories and service layers.

## System Architecture

### High-Level Architecture

LeLeKart follows a client-server architecture with the following components:

1. **Frontend**: A React-based single-page application (SPA) using modern React patterns and UI components from Radix UI and Shadcn
2. **Backend**: A Node.js Express server handling API requests, authentication, and business logic
3. **Database**: PostgreSQL database managed through Drizzle ORM
4. **Storage**: AWS S3 integration for storing product images and other media files
5. **External Services**: Integrations with Stripe and Razorpay for payments, SMTP for emails, and other third-party services

### Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Radix UI components
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM for schema management and queries
- **API**: RESTful API design pattern
- **Authentication**: Session-based authentication with cookie storage
- **Storage**: AWS S3 for file storage
- **Deployment**: Configured for deployment on Replit with seamless CI/CD

## Key Components

### Frontend Components

The frontend is organized into modular components with a clear separation of concerns:

1. **UI Components**: Leveraging Radix UI primitives and Shadcn UI library for a consistent design system
2. **State Management**: Uses React Query for server state management and React's built-in hooks for local state
3. **Routing**: Uses a router library (possibly wouter based on code references) for client-side routing
4. **Form Handling**: Integrates with React Hook Form and validation libraries for form management

### Backend Components

The backend follows a structured approach with distinct responsibilities:

1. **API Routes**: Organized by feature/domain (products, users, orders, etc.)
2. **Authentication**: Session-based auth with secure cookie handling
3. **Database Access**: Abstracted through Drizzle ORM with defined schemas
4. **Services**: Business logic organized into service modules (email-service, etc.)
5. **Media Handling**: S3 integration for file uploads and storage
6. **Payment Processing**: Integrations with Stripe and Razorpay

### Database Schema

The database is structured around several core entities:

1. **Users**: User accounts with role-based access (buyer, seller, admin)
2. **Products**: Product listings with variants, inventory management, and media
3. **Categories**: Hierarchical product categories with subcategories
4. **Orders**: Order processing workflow with status tracking
5. **Carts**: Shopping cart functionality
6. **Payments**: Payment processing and transaction records
7. **Reviews**: Product review system with ratings
8. **Shipping**: Shipping methods, zones, and rules
9. **Media Library**: Centralized media management
10. **Wallets**: Digital wallet system with transactions
11. **Notifications**: User notification system

### API Structure

The API follows RESTful principles with endpoint organization by resource type:

1. **/api/auth**: Authentication endpoints (login, register, logout)
2. **/api/users**: User management
3. **/api/products**: Product CRUD operations
4. **/api/categories**: Category management
5. **/api/orders**: Order processing
6. **/api/carts**: Shopping cart operations
7. **/api/payments**: Payment processing
8. **/api/shipping**: Shipping management
9. **/api/media**: Media upload and management
10. **/api/reviews**: Product reviews
11. **/api/notifications**: User notifications

## Data Flow

### User Authentication Flow

1. User registers or logs in through frontend forms
2. Server validates credentials and creates a session
3. Session ID is stored in a secure HTTP-only cookie
4. Subsequent requests include the cookie for authentication
5. Protected routes verify the session before processing requests

### Order Processing Flow

1. User adds products to cart
2. Cart is persisted in the database linked to the user
3. User proceeds to checkout and selects shipping and payment methods
4. Order is created with initial "pending" status
5. Payment is processed through Stripe or Razorpay
6. Order status is updated based on payment result
7. Notifications are sent to the user and seller
8. Seller fulfills the order, updates shipping status
9. Order is marked as complete when delivered

### Product Management Flow

1. Sellers create product listings with details, pricing, and images
2. Images are uploaded to S3 via presigned URLs
3. Products can be published immediately or saved as drafts
4. Admin can review and approve products if required
5. Products appear in search results and category browsing
6. Inventory is updated automatically when orders are placed

## External Dependencies

### Payment Gateways

1. **Stripe**: Primary payment processor for international transactions
2. **Razorpay**: Alternative payment gateway for local Indian payments

### Storage

1. **AWS S3**: Cloud storage for product images and other media files

### Email Services

1. **SMTP Integration**: For sending transactional emails like order confirmations

### Shipping Integration

1. **Shiprocket**: Integration for shipping and delivery management

### AI Services

1. **Google Generative AI**: Integration for enhanced product recommendations
2. **Anthropic Claude**: Integration for AI-powered customer assistance

## Deployment Strategy

The application is configured for deployment on Replit with the following strategy:

1. **Development**: Local development with hot reloading via Vite
2. **Build**: Production builds create optimized bundles with server-side and client-side code
3. **Database**: Uses Neon Postgres for serverless database access
4. **Environment Variables**: Critical configuration stored in environment variables
5. **Static Assets**: Served from the built application
6. **Scaling**: Configured for autoscaling on the Replit platform

### CI/CD Process

The deployment process is streamlined through Replit's deployment configuration:

1. Code changes are committed to the repository
2. Build process compiles and bundles the application
3. Environment variables are forwarded to the production environment
4. Application is automatically deployed to Replit's infrastructure

## Security Considerations

1. **Authentication**: Secure session-based authentication with HTTP-only cookies
2. **Authorization**: Role-based access control for different user types
3. **Data Protection**: Sensitive data stored securely with proper encryption
4. **API Security**: Proper validation and sanitization of inputs
5. **Payment Security**: PCI compliance through third-party payment processors
6. **CORS**: Configured to allow cross-origin requests from mobile apps

## Mobile Support

The platform includes API support for mobile applications with:

1. **Consistent API Endpoints**: Same API used for web and mobile clients
2. **CORS Configuration**: Headers set to allow cross-origin requests
3. **API Documentation**: Detailed documentation for mobile integration

## Extensibility

The architecture is designed for extensibility in several areas:

1. **New Payment Gateways**: Modular payment processing system
2. **Additional Shipping Methods**: Flexible shipping rules and integration
3. **Feature Toggles**: System settings for enabling/disabling features
4. **Document Templates**: Customizable templates for invoices and shipping labels
5. **Rewards System**: Points-based rewards and gift card functionality