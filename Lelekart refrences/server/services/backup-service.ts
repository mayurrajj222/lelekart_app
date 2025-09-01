import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../db';
import { createObjectCsvWriter } from 'csv-writer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Configure S3 client - will use env variables if S3 backup is enabled
const s3Client = process.env.AWS_S3_BUCKET ? new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
}) : null;

// Get the equivalent of __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create backup directory if it doesn't exist
const BACKUP_DIR = path.join(__dirname, '../../backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Creates backup of users (buyers and sellers)
 */
export async function backupUsers(): Promise<string> {
  try {
    // Get all users (excluding password field for security)
    const { rows: users } = await pool.query(`
      SELECT 
        id, username, email, role, name, phone, address, 
        profile_image as "profileImage", approved, rejected, 
        is_co_admin as "isCoAdmin"
      FROM users
      ORDER BY id
    `);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `users-backup-${timestamp}.csv`;
    const filePath = path.join(BACKUP_DIR, fileName);
    
    // Define CSV writer
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'id', title: 'ID' },
        { id: 'username', title: 'Username' },
        { id: 'email', title: 'Email' },
        { id: 'role', title: 'Role' },
        { id: 'name', title: 'Name' },
        { id: 'phone', title: 'Phone' },
        { id: 'address', title: 'Address' },
        { id: 'profileImage', title: 'Profile Image URL' },
        { id: 'approved', title: 'Approved' },
        { id: 'rejected', title: 'Rejected' },
        { id: 'isCoAdmin', title: 'Is Co-Admin' }
      ]
    });
    
    // Write CSV file
    await csvWriter.writeRecords(users);
    
    console.log(`Users backup created: ${filePath}`);
    
    // Upload to S3 if configured
    if (s3Client && process.env.AWS_S3_BUCKET) {
      await uploadToS3(filePath, fileName);
    }
    
    return filePath;
  } catch (error) {
    console.error('Error backing up users:', error);
    throw error;
  }
}

/**
 * Creates backup of products
 */
export async function backupProducts(): Promise<string> {
  try {
    // Get all products
    const { rows: products } = await pool.query(`
      SELECT 
        p.id, p.name, p.description, p.price, p.seller_id as "sellerId",
        p.category, p.image_url as "imageUrl", p.sku, p.stock_quantity as "stockQuantity",
        p.approved, p.rejected, p.featured, p.is_draft as "isDraft",
        p.specifications, p.features, p.height, p.width, p.length, p.weight,
        p.color, p.size, p.gst_rate as "gstRate", p.created_at as "createdAt",
        u.username as "sellerUsername", u.name as "sellerName"
      FROM products p
      LEFT JOIN users u ON p.seller_id = u.id
      WHERE p.deleted = false
      ORDER BY p.id
    `);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `products-backup-${timestamp}.csv`;
    const filePath = path.join(BACKUP_DIR, fileName);
    
    // Define CSV writer
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'id', title: 'ID' },
        { id: 'name', title: 'Name' },
        { id: 'description', title: 'Description' },
        { id: 'price', title: 'Price' },
        { id: 'sellerId', title: 'Seller ID' },
        { id: 'sellerUsername', title: 'Seller Username' },
        { id: 'sellerName', title: 'Seller Name' },
        { id: 'category', title: 'Category' },
        { id: 'imageUrl', title: 'Image URL' },
        { id: 'sku', title: 'SKU' },
        { id: 'stockQuantity', title: 'Stock Quantity' },
        { id: 'approved', title: 'Approved' },
        { id: 'rejected', title: 'Rejected' },
        { id: 'featured', title: 'Featured' },
        { id: 'isDraft', title: 'Is Draft' },
        { id: 'specifications', title: 'Specifications' },
        { id: 'features', title: 'Features' },
        { id: 'height', title: 'Height' },
        { id: 'width', title: 'Width' },
        { id: 'length', title: 'Length' },
        { id: 'weight', title: 'Weight' },
        { id: 'color', title: 'Color' },
        { id: 'size', title: 'Size' },
        { id: 'gstRate', title: 'GST Rate' },
        { id: 'createdAt', title: 'Created At' }
      ]
    });
    
    // Write CSV file
    await csvWriter.writeRecords(products);
    
    console.log(`Products backup created: ${filePath}`);
    
    // Upload to S3 if configured
    if (s3Client && process.env.AWS_S3_BUCKET) {
      await uploadToS3(filePath, fileName);
    }
    
    return filePath;
  } catch (error) {
    console.error('Error backing up products:', error);
    throw error;
  }
}

/**
 * Creates backup of orders
 */
export async function backupOrders(): Promise<string> {
  try {
    // Get all orders
    const { rows: orders } = await pool.query(`
      SELECT 
        o.id, o.user_id as "userId", o.address_id as "addressId",
        o.total, o.status, o.payment_method as "paymentMethod",
        o.payment_status as "paymentStatus", o.created_at as "createdAt",
        o.wallet_discount as "walletDiscount", o.razorpay_order_id as "razorpayOrderId",
        u.username as "userName", u.email as "userEmail"
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.id
    `);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `orders-backup-${timestamp}.csv`;
    const filePath = path.join(BACKUP_DIR, fileName);
    
    // Define CSV writer
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'id', title: 'ID' },
        { id: 'userId', title: 'User ID' },
        { id: 'userName', title: 'User Name' },
        { id: 'userEmail', title: 'User Email' },
        { id: 'addressId', title: 'Address ID' },
        { id: 'total', title: 'Total' },
        { id: 'status', title: 'Status' },
        { id: 'paymentMethod', title: 'Payment Method' },
        { id: 'paymentStatus', title: 'Payment Status' },
        { id: 'walletDiscount', title: 'Wallet Discount' },
        { id: 'razorpayOrderId', title: 'Razorpay Order ID' },
        { id: 'createdAt', title: 'Created At' }
      ]
    });
    
    // Write CSV file
    await csvWriter.writeRecords(orders);
    
    console.log(`Orders backup created: ${filePath}`);
    
    // Upload to S3 if configured
    if (s3Client && process.env.AWS_S3_BUCKET) {
      await uploadToS3(filePath, fileName);
    }
    
    return filePath;
  } catch (error) {
    console.error('Error backing up orders:', error);
    throw error;
  }
}

/**
 * Run a complete backup of all entities
 */
export async function runFullBackup(): Promise<{
  usersBackupPath: string;
  productsBackupPath: string;
  ordersBackupPath: string;
}> {
  const timestamp = new Date().toISOString();
  console.log(`Starting full database backup at ${timestamp}`);
  
  try {
    const usersBackupPath = await backupUsers();
    const productsBackupPath = await backupProducts();
    const ordersBackupPath = await backupOrders();
    
    console.log(`Full backup completed at ${new Date().toISOString()}`);
    
    return {
      usersBackupPath,
      productsBackupPath,
      ordersBackupPath
    };
  } catch (error) {
    console.error('Error running full backup:', error);
    throw error;
  }
}

/**
 * Lists all available backups
 */
export function listBackups(): {
  users: string[];
  products: string[];
  orders: string[];
} {
  const files = fs.readdirSync(BACKUP_DIR);
  
  return {
    users: files.filter(file => file.startsWith('users-backup-')),
    products: files.filter(file => file.startsWith('products-backup-')),
    orders: files.filter(file => file.startsWith('orders-backup-'))
  };
}

/**
 * Get a backup file path
 */
export function getBackupFilePath(fileName: string): string {
  return path.join(BACKUP_DIR, fileName);
}

/**
 * Upload file to S3 bucket
 */
async function uploadToS3(filePath: string, fileName: string): Promise<void> {
  if (!s3Client || !process.env.AWS_S3_BUCKET) {
    throw new Error('S3 is not configured');
  }
  
  try {
    const fileContent = fs.readFileSync(filePath);
    const currentDate = new Date().toISOString().split('T')[0];
    
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `backups/${currentDate}/${fileName}`,
      Body: fileContent,
      ContentType: 'text/csv'
    };
    
    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    
    console.log(`File uploaded to S3: ${params.Key}`);
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
}