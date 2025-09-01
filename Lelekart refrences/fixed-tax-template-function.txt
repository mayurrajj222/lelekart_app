/**
 * Get the tax invoice template from the filesystem or fallback to default
 */
function getTaxInvoiceTemplate(): string {
  try {
    // First try to load the template from the filesystem
    const template = fs.readFileSync('flipkart_style_invoice_template.html', 'utf8');
    console.log('Using Flipkart-style tax invoice template from filesystem');
    return template;
  } catch (error) {
    // If file read fails, return the default template
    console.warn('Flipkart-style template not found in filesystem, using default template');
    
    return `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Tax Invoice</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            color: #333;
            margin: 0;
            padding: 10px;
          }
          .invoice-container {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #ccc;
          }
          .header-logo {
            padding: 10px;
            border-bottom: 1px solid #ccc;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2874f0;
          }
          .header-title {
            background-color: #f0f0f0;
            text-align: center;
            padding: 8px;
            font-weight: bold;
            font-size: 16px;
            border-bottom: 1px solid #ccc;
          }
          .info-section {
            display: flex;
            width: 100%;
            border-bottom: 1px solid #ccc;
          }
          .left-column, .right-column {
            width: 50%;
            padding: 10px;
          }
          .right-column {
            border-left: 1px solid #ccc;
          }
          .info-label {
            font-weight: bold;
            margin-bottom: 5px;
          }
          .address-block {
            margin-left: 0;
            margin-top: 5px;
            font-size: 11px;
            line-height: 1.4;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          table, th, td {
            border: 1px solid #ccc;
          }
          th {
            background-color: #f5f5f5;
            text-align: center;
            padding: 8px 5px;
            font-weight: bold;
            font-size: 11px;
          }
          td {
            padding: 8px 5px;
            text-align: center;
            font-size: 11px;
          }
          .align-left {
            text-align: left;
          }
          .align-right {
            text-align: right;
          }
          .signature-section {
            margin-top: 30px;
            padding: 10px;
            font-size: 11px;
            text-align: right;
            border-top: 1px solid #ccc;
          }
          .taxes-column {
            max-width: 300px;
          }
          .totals-section {
            display: flex;
            justify-content: flex-end;
            padding: 10px;
            font-size: 11px;
            border-top: 1px solid #ccc;
          }
          .totals-table {
            width: 300px;
            border: none;
          }
          .totals-table td {
            border: none;
            padding: 3px 5px;
          }
          .totals-table .total-label {
            text-align: right;
            font-weight: normal;
          }
          .totals-table .total-value {
            text-align: right;
            width: 100px;
          }
          .totals-table .grand-total {
            font-weight: bold;
            border-top: 1px solid #ccc;
          }
          .invoice-footer {
            padding: 10px;
            font-size: 10px;
            text-align: center;
            color: #666;
            border-top: 1px solid #ccc;
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <!-- Header with Logo -->
          <div class="header-logo">
            <div class="logo">LeLeKart</div>
            <div style="text-align: right; font-size: 11px;">
              <div><strong>Order #:</strong> {{order.orderNumber}}</div>
              <div><strong>Order Date:</strong> {{order.orderDate}}</div>
            </div>
          </div>
          
          <!-- Invoice Header -->
          <div class="header-title">TAX INVOICE</div>
          
          <!-- Invoice Info Section -->
          <div class="info-section">
            <div class="left-column">
              <div class="info-label">SOLD BY:</div>
              <div class="address-block">
                {{order.sellerBusinessName}}<br>
                {{order.sellerAddress}}<br>
                GSTIN: {{order.sellerGstin}}
              </div>
              
              <div class="info-label" style="margin-top: 15px;">BILLING ADDRESS:</div>
              <div class="address-block">
                {{order.billingName}}<br>
                {{order.billingAddress}}
              </div>
            </div>
            <div class="right-column">
              <div class="info-label">INVOICE DETAILS:</div>
              <div class="address-block">
                <div><strong>Invoice Number:</strong> {{order.invoiceNumber}}</div>
                <div><strong>Invoice Date:</strong> {{order.invoiceDate}}</div>
                <div><strong>Place of Supply:</strong> {{order.state}}</div>
              </div>
              
              <div class="info-label" style="margin-top: 15px;">SHIPPING ADDRESS:</div>
              <div class="address-block">
                {{order.shippingName}}<br>
                {{order.shippingAddress}}
              </div>
            </div>
          </div>
          
          <!-- Invoice Table -->
          <table>
            <thead>
              <tr>
                <th style="width: 5%;">S.No</th>
                <th style="width: 35%;">Description</th>
                <th style="width: 8%;">HSN</th>
                <th style="width: 5%;">Qty</th>
                <th style="width: 8%;">Gross Amount</th>
                <th style="width: 8%;">Discount</th>
                <th style="width: 8%;">Taxable Value</th>
                <th style="width: 15%;">Tax Rate & Amount</th>
                <th style="width: 8%;">Total</th>
              </tr>
            </thead>
            <tbody>
              {{#each order.items}}
              <tr>
                <td>{{this.srNo}}</td>
                <td class="align-left">{{this.description}}</td>
                <td>{{this.hsn}}</td>
                <td>{{this.quantity}}</td>
                <td class="align-right">₹{{this.mrp}}</td>
                <td class="align-right">₹{{this.discount}}</td>
                <td class="align-right">₹{{this.taxableValue}}</td>
                <td class="align-left">
                  {{#each this.taxComponents}}
                  {{this.taxName}} @ {{this.taxRate}}%: ₹{{this.taxAmount}}<br>
                  {{/each}}
                </td>
                <td class="align-right">₹{{this.total}}</td>
              </tr>
              {{/each}}
            </tbody>
          </table>
          
          <!-- Totals Section -->
          <div class="totals-section">
            <table class="totals-table">
              <tr>
                <td class="total-label">Total Gross Amount:</td>
                <td class="total-value">₹{{order.totalGrossAmount}}</td>
              </tr>
              <tr>
                <td class="total-label">Total Discount:</td>
                <td class="total-value">₹{{order.totalDiscount}}</td>
              </tr>
              <tr>
                <td class="total-label">Total Tax Value:</td>
                <td class="total-value">₹{{order.totalTaxAmount}}</td>
              </tr>
              <tr class="grand-total">
                <td class="total-label">Grand Total:</td>
                <td class="total-value">₹{{order.grandTotal}}</td>
              </tr>
            </table>
          </div>
          
          <!-- Signature Section -->
          <div class="signature-section">
            <div style="margin-bottom: 40px;">For {{order.sellerBusinessName}}</div>
            <div class="info-label">Authorized Signatory</div>
          </div>
          
          <!-- Footer -->
          <div class="invoice-footer">
            This is a computer-generated invoice and does not require a physical signature.
          </div>
        </div>
      </body>
    </html>`;
  }
}