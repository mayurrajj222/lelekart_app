const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const htmlPdf = require('html-pdf');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function generateTaxInvoicePdf() {
  try {
    // 1. First, ensure the template is updated in the database
    await updateTemplateIfNeeded();
    
    // 2. Get the template from the database
    const templateQuery = await pool.query(
      'SELECT content FROM document_templates WHERE type = $1',
      ['tax_invoice']
    );
    
    if (templateQuery.rows.length === 0) {
      throw new Error('Tax invoice template not found in database');
    }
    
    const templateHtml = templateQuery.rows[0].content;
    
    // 3. Prepare sample data for testing
    const sampleData = {
      invoiceNumber: 'INV-123456',
      invoiceDate: new Date().toLocaleDateString('en-IN'),
      orderNumber: 'ORD-98765',
      
      customerName: 'John Doe',
      customerAddress: '123 Main Street, Apartment 4B, Bangalore, Karnataka, 560001',
      
      deliveryName: 'John Doe',
      deliveryAddress: '123 Main Street, Apartment 4B, Bangalore, Karnataka, 560001',
      
      businessName: 'LeLeKart Seller Store',
      businessAddress: 'Shop #42, Commerce Building, MG Road, Bangalore, Karnataka, 560008',
      
      warehouseName: 'LeLeKart Fulfillment Center',
      warehouseAddress: 'Warehouse 7, Industrial Area Phase 2, Peenya, Bangalore, Karnataka, 560058',
      
      items: [
        {
          srNo: 1,
          description: 'Samsung Galaxy S21 Ultra 5G (Phantom Black, 256GB)',
          hsn: '85171290',
          quantity: 1,
          mrp: '₹1,09,999.00',
          discount: '₹10,000.00',
          taxableValue: '₹84,745.76',
          taxComponents: [
            { taxName: 'SGST', taxRate: 9, taxAmount: '₹7,627.12' },
            { taxName: 'CGST', taxRate: 9, taxAmount: '₹7,627.12' }
          ],
          total: '₹99,999.00'
        },
        {
          srNo: 2,
          description: 'Apple AirPods Pro with MagSafe Case',
          hsn: '85183000',
          quantity: 1,
          mrp: '₹24,900.00',
          discount: '₹2,000.00',
          taxableValue: '₹19,406.78',
          taxComponents: [
            { taxName: 'IGST', taxRate: 18, taxAmount: '₹3,493.22' }
          ],
          total: '₹22,900.00'
        }
      ]
    };
    
    // 4. Compile the template with Handlebars
    const template = handlebars.compile(templateHtml);
    const html = template(sampleData);
    
    // 5. Save the HTML output for inspection
    fs.writeFileSync('tax_invoice_output.html', html);
    console.log('Generated HTML preview saved to tax_invoice_output.html');
    
    // 6. Generate PDF
    const pdfOptions = {
      format: 'A4',
      border: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      }
    };
    
    htmlPdf.create(html, pdfOptions).toFile('tax_invoice_pdf.pdf', (err, res) => {
      if (err) {
        console.error('Error generating PDF:', err);
      } else {
        console.log('Generated PDF saved to:', res.filename);
      }
      
      // Close the database connection
      pool.end();
    });
    
  } catch (error) {
    console.error('Error generating tax invoice PDF:', error);
    pool.end();
  }
}

async function updateTemplateIfNeeded() {
  try {
    // Check if the template exists in the database
    const checkResult = await pool.query(
      'SELECT * FROM document_templates WHERE type = $1',
      ['tax_invoice']
    );
    
    // If template doesn't exist, read from file and insert it
    if (checkResult.rows.length === 0) {
      console.log('Tax invoice template not found in database, creating it...');
      
      // Read template from file
      const templatePath = path.join(__dirname, 'flipkart_style_invoice_template.html');
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      
      // Insert the template
      await pool.query(
        'INSERT INTO document_templates (type, name, content, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id',
        ['tax_invoice', 'Flipkart Style Tax Invoice', templateContent]
      );
      
      console.log('Tax invoice template created in database');
    } else {
      console.log('Tax invoice template found in database');
    }
  } catch (error) {
    console.error('Error updating template:', error);
    throw error;
  }
}

// Run the function
generateTaxInvoicePdf();