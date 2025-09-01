// Script to update the tax invoice template to match the provided format
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

async function main() {
  console.log('Connecting to database...');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Update the default invoice template
    const invoiceTemplateExists = await pool.query(`
      SELECT id FROM document_templates 
      WHERE type = 'invoice' AND is_default = true
    `);
    
    if (invoiceTemplateExists.rows.length > 0) {
      const templateId = invoiceTemplateExists.rows[0].id;
      console.log(`Found existing invoice template (ID: ${templateId})`);
      
      await pool.query(`
        UPDATE document_templates
        SET content = $1, updated_at = NOW()
        WHERE id = $2
      `, [TAX_INVOICE_TEMPLATE, templateId]);
      
      console.log(`Updated default invoice template (ID: ${templateId})`);
    } else {
      await pool.query(`
        INSERT INTO document_templates (type, name, content, is_default)
        VALUES ('invoice', 'Tax Invoice Template', $1, true)
      `, [TAX_INVOICE_TEMPLATE]);
      
      console.log('Created new default tax invoice template');
    }

    console.log('Tax invoice template updated successfully!');
  } catch (error) {
    console.error('Error updating tax invoice template:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Updated Tax Invoice Template based on the provided screenshot
const TAX_INVOICE_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Tax Invoice</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .invoice-container {
      max-width: 800px;
      margin: 20px auto;
      padding: 20px;
      border: 1px solid #ccc;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .invoice-title {
      text-align: right;
    }
    .title {
      font-size: 20px;
      font-weight: bold;
    }
    .original-copy {
      font-size: 12px;
    }
    .bill-to, .ship-to {
      margin-bottom: 20px;
    }
    .bill-to-header, .ship-to-header {
      font-weight: bold;
      margin-bottom: 5px;
    }
    .customer-name {
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .order-details-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .order-detail-item {
      flex: 1;
    }
    .order-label {
      font-weight: normal;
    }
    .order-value {
      font-weight: normal;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    table th, table td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    table th {
      background-color: #f2f2f2;
      font-weight: normal;
    }
    .text-right {
      text-align: right;
    }
    .terms {
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="bill-to">
        <div class="bill-to-header">BILL TO:</div>
        <div class="customer-name">{{user.name}}</div>
        {{#if billingAddress}}
          <div>{{billingAddress.address}}</div>
          <div>{{billingAddress.city}}, {{billingAddress.state}} {{billingAddress.pincode}}</div>
          <div>{{billingAddress.country}}</div>
          <div>Place of Supply : {{billingAddress.state}}</div>
        {{else}}
          <div>{{shippingAddress.address}}</div>
          <div>{{shippingAddress.city}}, {{shippingAddress.state}} {{shippingAddress.pincode}}</div>
          <div>{{shippingAddress.country}}</div>
          <div>Place of Supply : {{shippingAddress.state}}</div>
        {{/if}}
      </div>

      <div class="invoice-title">
        <div class="title">Tax Invoice</div>
        <div class="original-copy">Original For Recipient</div>
      </div>
    </div>

    <div class="order-details-row">
      <div class="order-detail-item">
        <div class="order-label">Order Number</div>
        <div class="order-value">{{order.id}}</div>
      </div>
      <div class="order-detail-item" style="text-align: right;">
        <div class="order-label">Invoice Number</div>
        <div class="order-value">{{invoiceNumber}}</div>
      </div>
    </div>

    <div class="order-details-row">
      <div class="order-detail-item">
        <div class="order-label">Order Date</div>
        <div class="order-value">{{formatDate order.date}}</div>
      </div>
      <div class="order-detail-item" style="text-align: right;">
        <div class="order-label">Invoice Date</div>
        <div class="order-value">{{formatDate order.date}}</div>
      </div>
    </div>

    <div class="ship-to">
      <div class="ship-to-header">SHIP TO:</div>
      <div class="customer-name">{{user.name}}</div>
      {{#if shippingAddress}}
        <div>{{shippingAddress.address}}</div>
        <div>{{shippingAddress.city}}, {{shippingAddress.state}} {{shippingAddress.pincode}}</div>
        <div>{{shippingAddress.country}}</div>
      {{/if}}
    </div>

    <table>
      <thead>
        <tr>
          <th>SN.</th>
          <th>Description</th>
          <th>HSN</th>
          <th>Qty.</th>
          <th>Gross Amount</th>
          <th>Discount</th>
          <th>Taxable Value</th>
          <th>Taxes</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        {{#each items}}
        <tr>
          <td>{{add @index 1}}</td>
          <td>{{product.name}}</td>
          <td>{{product.hsn}}</td>
          <td>{{quantity}}</td>
          <td class="text-right">Rs {{price}}</td>
          <td class="text-right">{{#if discount}}Rs {{discount}}{{else}}0{{/if}}</td>
          <td class="text-right">Rs {{taxableValue}}</td>
          <td class="text-right">
            {{#if isSameState}}
              {{#if product.gstRate}}
                CGST @{{divide product.gstRate 2}}% :Rs.{{cgstAmount}}<br>
                SGST @{{divide product.gstRate 2}}% :Rs.{{sgstAmount}}
              {{else}}
                0
              {{/if}}
            {{else}}
              {{#if product.gstRate}}
                IGST @{{product.gstRate}}% :Rs.{{igstAmount}}
              {{else}}
                0
              {{/if}}
            {{/if}}
          </td>
          <td class="text-right">Rs {{multiply quantity price}}</td>
        </tr>
        {{/each}}
        {{#if deliveryCharges}}
        <tr>
          <td>{{add items.length 1}}</td>
          <td>OTHER CHARGES</td>
          <td>{{#if deliveryHsn}}{{deliveryHsn}}{{else}}610342{{/if}}</td>
          <td>NA</td>
          <td class="text-right">Rs {{deliveryCharges}}</td>
          <td class="text-right">0</td>
          <td class="text-right">Rs {{deliveryTaxableValue}}</td>
          <td class="text-right">
            {{#if isSameState}}
              {{#if deliveryGstRate}}
                CGST @{{divide deliveryGstRate 2}}% :Rs.{{deliveryCgstAmount}}<br>
                SGST @{{divide deliveryGstRate 2}}% :Rs.{{deliverySgstAmount}}
              {{else}}
                0
              {{/if}}
            {{else}}
              {{#if deliveryGstRate}}
                IGST @{{deliveryGstRate}}% :Rs.{{deliveryIgstAmount}}
              {{else}}
                0
              {{/if}}
            {{/if}}
          </td>
          <td class="text-right">Rs {{deliveryCharges}}</td>
        </tr>
        {{/if}}
        <tr>
          <td colspan="7" class="text-right">Total</td>
          <td class="text-right">
            {{#if isSameState}}
              Rs.{{totalTax}}
            {{else}}
              Rs.{{totalTax}}
            {{/if}}
          </td>
          <td class="text-right">Rs.{{order.total}}</td>
        </tr>
      </tbody>
    </table>

    <div class="terms">
      <div><strong>Terms & Conditions:</strong></div>
      <div>Sold by: {{seller.name}}</div>
      <div>{{seller.address}}</div>
      <div>Tax is not payable on reverse charge basis</div>
      <div>This is a computer generated invoice and does not require signature</div>
      <div>Other charges are charges that are applicable to your order and include charges for logistics fee (where applicable) and/or fees levied for high return rate</div>
      <div>Includes discounts for your city, limited returns and/or for online payments (as applicable)</div>
    </div>
  </div>
</body>
</html>
`;

main().catch(console.error);