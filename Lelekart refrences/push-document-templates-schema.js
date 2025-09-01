// Script to push the document templates schema to the database
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

// Import the schema
import { documentTemplates } from './shared/schema.js';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

async function main() {
  console.log('Connecting to database...');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  try {
    console.log('Creating document_templates table if it doesn\'t exist...');
    
    // Create the document_templates table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS document_templates (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        content TEXT NOT NULL,
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP
      );
    `);

    console.log('Document templates table created successfully!');

    // Add default templates
    console.log('Adding default templates...');
    
    // Default invoice template
    const invoiceTemplateExists = await db.execute(`
      SELECT COUNT(*) FROM document_templates 
      WHERE type = 'invoice' AND is_default = true
    `);
    
    if (invoiceTemplateExists.rows[0].count === '0') {
      await db.execute(`
        INSERT INTO document_templates (type, name, content, is_default)
        VALUES ('invoice', 'Default Invoice Template', $1, true)
      `, [DEFAULT_INVOICE_TEMPLATE]);
      console.log('Default invoice template added');
    } else {
      console.log('Default invoice template already exists');
    }

    // Default shipping slip template
    const shippingSlipTemplateExists = await db.execute(`
      SELECT COUNT(*) FROM document_templates 
      WHERE type = 'shipping_slip' AND is_default = true
    `);
    
    if (shippingSlipTemplateExists.rows[0].count === '0') {
      await db.execute(`
        INSERT INTO document_templates (type, name, content, is_default)
        VALUES ('shipping_slip', 'Default Shipping Slip Template', $1, true)
      `, [DEFAULT_SHIPPING_SLIP_TEMPLATE]);
      console.log('Default shipping slip template added');
    } else {
      console.log('Default shipping slip template already exists');
    }

    console.log('Schema push completed successfully!');
  } catch (error) {
    console.error('Error pushing schema:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Default invoice template
const DEFAULT_INVOICE_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice #{{order.id}}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #333;
    }
    .invoice-box {
      max-width: 800px;
      margin: auto;
      padding: 30px;
      border: 1px solid #eee;
      box-shadow: 0 0 10px rgba(0, 0, 0, .15);
    }
    .invoice-box table {
      width: 100%;
      line-height: inherit;
      text-align: left;
      border-collapse: collapse;
    }
    .invoice-box table td {
      padding: 5px;
      vertical-align: top;
    }
    .invoice-box table tr.top table td {
      padding-bottom: 20px;
    }
    .invoice-box table tr.top table td.title {
      font-size: 45px;
      line-height: 45px;
      color: #333;
    }
    .invoice-box table tr.information table td {
      padding-bottom: 40px;
    }
    .invoice-box table tr.heading td {
      background: #eee;
      border-bottom: 1px solid #ddd;
      font-weight: bold;
    }
    .invoice-box table tr.details td {
      padding-bottom: 20px;
    }
    .invoice-box table tr.item td{
      border-bottom: 1px solid #eee;
    }
    .invoice-box table tr.item.last td {
      border-bottom: none;
    }
    .invoice-box table tr.total td:nth-child(4) {
      border-top: 2px solid #eee;
      font-weight: bold;
    }
    @media only screen and (max-width: 600px) {
      .invoice-box table tr.top table td {
        width: 100%;
        display: block;
        text-align: center;
      }
      .invoice-box table tr.information table td {
        width: 100%;
        display: block;
        text-align: center;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-box">
    <table cellpadding="0" cellspacing="0">
      <tr class="top">
        <td colspan="4">
          <table>
            <tr>
              <td class="title">
                <h2>LELEKART</h2>
              </td>
              <td style="text-align: right;">
                Invoice #: {{order.id}}<br>
                Created: {{order.date}}<br>
                Status: {{order.status}}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      
      <tr class="information">
        <td colspan="4">
          <table>
            <tr>
              <td>
                Lelekart, Inc.<br>
                123 Market Street<br>
                Mumbai, Maharashtra 400001
              </td>
              <td style="text-align: right;">
                {{user.name}}<br>
                {{user.email}}<br>
                {{#if shippingAddress}}
                  {{shippingAddress.address}}<br>
                  {{shippingAddress.city}}, {{shippingAddress.state}} {{shippingAddress.zipCode}}<br>
                  {{shippingAddress.country}}
                {{/if}}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      
      <tr class="heading">
        <td>Payment Method</td>
        <td colspan="3">{{order.paymentMethod}}</td>
      </tr>
      
      <tr class="details">
        <td>Payment ID</td>
        <td colspan="3">{{order.paymentId}}</td>
      </tr>
      
      <tr class="heading">
        <td>Item</td>
        <td>Quantity</td>
        <td>Unit Price</td>
        <td>Amount</td>
      </tr>
      
      {{#each items}}
      <tr class="item">
        <td>{{product.name}}</td>
        <td>{{quantity}}</td>
        <td>₹{{price}}</td>
        <td>₹{{multiply quantity price}}</td>
      </tr>
      {{/each}}
      
      {{#if order.walletDiscount}}
      <tr class="item">
        <td colspan="3">Wallet Discount</td>
        <td>-₹{{order.walletDiscount}}</td>
      </tr>
      {{/if}}
      
      <tr class="item">
        <td colspan="3">Delivery Charges</td>
        <td>₹{{deliveryCharges}}</td>
      </tr>
      
      <tr class="total">
        <td colspan="3"></td>
        <td>Total: ₹{{order.total}}</td>
      </tr>
    </table>
    
    <div style="margin-top: 50px; text-align: center; color: #888;">
      <p>Thank you for your business with Lelekart!</p>
      <p>For any questions or concerns, please contact support@lelekart.com</p>
    </div>
  </div>
</body>
</html>
`;

// Default shipping slip template
const DEFAULT_SHIPPING_SLIP_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Shipping Slip #{{order.id}}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #333;
    }
    .shipping-box {
      max-width: 800px;
      margin: auto;
      padding: 30px;
      border: 1px solid #eee;
      box-shadow: 0 0 10px rgba(0, 0, 0, .15);
    }
    .shipping-box h1 {
      text-align: center;
      margin-bottom: 20px;
    }
    .shipping-box .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      border-bottom: 1px solid #eee;
      padding-bottom: 20px;
    }
    .shipping-box .addresses {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .shipping-box .address {
      width: 45%;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .shipping-box h2 {
      margin-top: 0;
      font-size: 16px;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }
    .shipping-box table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .shipping-box table th {
      background-color: #f8f8f8;
      text-align: left;
      padding: 10px;
      border-bottom: 2px solid #ddd;
    }
    .shipping-box table td {
      padding: 10px;
      border-bottom: 1px solid #eee;
    }
    .barcode {
      text-align: center;
      margin-top: 30px;
      font-family: 'Courier New', monospace;
      font-size: 16px;
      letter-spacing: 5px;
    }
    .footer {
      margin-top: 50px;
      text-align: center;
      color: #888;
      font-size: 12px;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .shipping-box {
        box-shadow: none;
        border: none;
      }
    }
  </style>
</head>
<body>
  <div class="shipping-box">
    <h1>SHIPPING SLIP</h1>
    
    <div class="header">
      <div>
        <p><strong>Order #:</strong> {{order.id}}</p>
        <p><strong>Date:</strong> {{order.date}}</p>
      </div>
      <div>
        <p><strong>Tracking #:</strong> {{tracking.trackingNumber}}</p>
        <p><strong>Carrier:</strong> {{tracking.carrier}}</p>
      </div>
    </div>
    
    <div class="addresses">
      <div class="address">
        <h2>SHIP FROM</h2>
        <p><strong>{{seller.name}}</strong></p>
        <p>{{seller.address}}</p>
        <p>{{seller.city}}, {{seller.state}} {{seller.zipCode}}</p>
        <p>{{seller.country}}</p>
      </div>
      
      <div class="address">
        <h2>SHIP TO</h2>
        <p><strong>{{user.name}}</strong></p>
        <p>{{shippingAddress.address}}</p>
        <p>{{shippingAddress.city}}, {{shippingAddress.state}} {{shippingAddress.zipCode}}</p>
        <p>{{shippingAddress.country}}</p>
      </div>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>SKU</th>
          <th>Quantity</th>
        </tr>
      </thead>
      <tbody>
        {{#each items}}
        <tr>
          <td>{{product.name}}</td>
          <td>{{product.sku}}</td>
          <td>{{quantity}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>
    
    <div class="barcode">
      *{{order.id}}*
    </div>
    
    <div class="footer">
      <p>This shipping slip was generated automatically by Lelekart.</p>
      <p>For any shipping inquiries, please contact support@lelekart.com.</p>
    </div>
  </div>
</body>
</html>
`;

main().catch(console.error);