/**
 * Script to create an initial seller agreement in the database
 * 
 * Usage: node scripts/create-initial-agreement.js
 */

import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as dotenv from 'dotenv';

dotenv.config();

// Configure WebSocket for Neon serverless
neonConfig.webSocketConstructor = ws;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool);

// Sample agreement content in Markdown format
const AGREEMENT_CONTENT = `# Lelekart Seller Agreement

## 1. INTRODUCTION

This Seller Agreement ("Agreement") is entered into between Lelekart ("Platform", "we", "us", "our") and the entity or person ("Seller", "you", "your") who registers as a seller on our marketplace platform.

This Agreement governs your access to and use of our services for listing, selling, and managing products on our platform, as well as the rights and obligations of both parties.

## 2. ELIGIBILITY

To become a seller on our platform, you must:
- Be at least 18 years of age
- Provide valid business information including GST registration (if applicable)
- Have a valid bank account for receiving payments
- Comply with all applicable laws and regulations related to your business

## 3. SELLER ACCOUNT

You are responsible for:
- Maintaining the confidentiality of your account credentials
- Ensuring all information provided is accurate, complete, and up-to-date
- Promptly updating any changes to your business, tax, or banking information
- All activities conducted through your seller account

## 4. PRODUCT LISTINGS

You agree that all products listed on our platform will:
- Comply with our product guidelines and policies
- Be accurately described with complete information
- Not infringe on any third-party intellectual property rights
- Not be prohibited items as specified in our prohibited items policy
- Be in stock and available for immediate shipment unless otherwise noted

We reserve the right to review, moderate, and remove any listings that violate our policies.

## 5. PRICING AND PAYMENTS

- You are responsible for setting your own product prices
- Platform fees will be charged as outlined in our Fee Schedule
- Payments will be processed according to our Payment Terms
- You are responsible for all taxes related to your sales
- Our platform may offer promotional discounts that apply to your products

## 6. SHIPPING AND FULFILLMENT

You agree to:
- Ship all orders promptly as per the shipping methods you have enabled
- Provide accurate shipping and delivery information
- Update order status and tracking information promptly
- Package products securely to prevent damage during transit
- Handle returns and refunds according to our Returns Policy

## 7. CUSTOMER SERVICE

You are responsible for:
- Responding to customer inquiries within 24 hours
- Resolving customer issues in a professional and timely manner
- Maintaining a customer satisfaction rating as required by our policies
- Adhering to our customer service standards

## 8. PLATFORM POLICIES

You agree to comply with all our platform policies, including but not limited to:
- Seller Code of Conduct
- Product Guidelines
- Fee Schedule
- Returns and Refunds Policy
- Shipping Policy
- Rating and Review Policy

These policies may be updated from time to time, and continued use of our platform constitutes acceptance of any changes.

## 9. TERM AND TERMINATION

- This Agreement remains in effect until terminated
- Either party may terminate this Agreement with 30 days written notice
- We may suspend or terminate your account immediately for policy violations
- Upon termination, all outstanding orders must still be fulfilled
- Sections related to confidentiality, liability, and dispute resolution survive termination

## 10. CONFIDENTIALITY

You agree to keep confidential any non-public information obtained through your use of our platform, including customer data, platform operations, and proprietary technology.

## 11. INTELLECTUAL PROPERTY

- You retain ownership of your content and product listings
- You grant us a license to use your content for operating the platform
- We retain ownership of our platform, technology, and brand assets
- You agree not to use our intellectual property without written permission

## 12. LIABILITY LIMITATIONS

- Our liability is limited as specified in our Terms of Service
- You agree to indemnify us against claims arising from your products
- You are responsible for product quality, safety, and compliance

## 13. DISPUTE RESOLUTION

Any disputes between us will be resolved as outlined in our Terms of Service through:
- Initial good faith negotiation
- Mediation if necessary
- Binding arbitration as a last resort

## 14. MODIFICATIONS TO AGREEMENT

We may modify this Agreement at any time with notice to you. Continued use of our platform constitutes acceptance of the modified Agreement.

## 15. GOVERNING LAW

This Agreement is governed by the laws of India, without regard to conflict of law principles.

## 16. ACCEPTANCE

By clicking "Accept" or by continuing to use our platform as a seller, you acknowledge that you have read, understood, and agree to be bound by this Agreement and all incorporated policies.`;

async function createInitialAgreement() {
  try {
    // Check if any agreement already exists
    const existingAgreements = await pool.query(
      'SELECT * FROM seller_agreements ORDER BY id DESC LIMIT 1'
    );
    
    if (existingAgreements.rows.length > 0) {
      console.log('An agreement already exists in the database:');
      console.log(existingAgreements.rows[0]);
      console.log('If you want to create a new agreement, please use the admin interface.');
      return;
    }
    
    // Insert the initial agreement
    const result = await pool.query(
      'INSERT INTO seller_agreements (version, title, content, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *',
      ['1.0', 'Seller Agreement', AGREEMENT_CONTENT, true]
    );
    
    console.log('Initial seller agreement created successfully:');
    console.log(result.rows[0]);
  } catch (error) {
    console.error('Error creating initial agreement:', error);
  } finally {
    await pool.end();
  }
}

createInitialAgreement();