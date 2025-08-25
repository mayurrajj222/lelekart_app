const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const XLSX = require('xlsx');

// Create a simple spreadsheet for testing
async function createTestSpreadsheet() {
  // Define the headers based on the template
  const headers = [
    'name', 'description', 'price', 'purchasePrice', 'mrp', 'gst',
    'category', 'subCategory', 'brand', 'color', 'size',
    'imageUrl1', 'imageUrl2', 'imageUrl3', 'imageUrl4',
    'stock', 'sku', 'hsn', 'weight', 'length', 'width', 'height',
    'warranty_', 'returnPolicy', 'tax', 'specifications', 'productType'
  ];
  
  // Create test data row
  const testData = [
    'Test Bulk Product', 
    'This is a test product description.', 
    '999', 
    '700',  // Purchase price value to test
    '1199',
    '18',   // GST value to test
    'Electronics',
    'Accessories',
    'TestBrand',
    'Black',
    'Medium',
    'https://via.placeholder.com/400',
    '',
    '',
    '',
    '50',
    'TEST-SKU-123',
    '12345678',
    '500',
    '10',
    '20',
    '5',
    '1 Year',
    '30 Days',
    '5',
    'Material: Plastic, Type: Test',
    'Regular'
  ];
  
  // Create the workbook
  const wb = XLSX.utils.book_new();
  
  // Combine header row and data row
  const wsData = [headers, testData];
  
  // Create the worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Products');
  
  // Write to file
  XLSX.writeFile(wb, 'test_import.xlsx');
  
  console.log('Test spreadsheet created: test_import.xlsx');
}

// Create the test file
createTestSpreadsheet();

console.log('Created test import file with purchasePrice=700 and gst=18');
