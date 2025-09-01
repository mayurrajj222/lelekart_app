import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { db } from "./db";
import * as schema from "@shared/schema";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seedDatabase() {
  console.log("Seeding database...");

  // Check if users already exist
  const existingUsers = await db.select().from(schema.users);
  if (existingUsers.length > 0) {
    console.log("Database already seeded. Skipping...");
    return;
  }

  // Create admin, seller and buyer users
  const adminPassword = await hashPassword("admin123");
  const sellerPassword = await hashPassword("seller123");
  const buyerPassword = await hashPassword("buyer123");

  const [admin] = await db.insert(schema.users).values({
    username: "admin",
    password: adminPassword,
    email: "admin@example.com",
    role: "admin",
    name: "Admin User",
    phone: "9876543210",
    address: "Admin Office, Tech Park, Bangalore",
  }).returning();
  console.log("Created admin user:", admin.username);

  const [seller] = await db.insert(schema.users).values({
    username: "seller",
    password: sellerPassword,
    email: "seller@example.com",
    role: "seller",
    name: "Sample Seller",
    phone: "8765432109",
    address: "Seller Shop, Market Street, Mumbai",
  }).returning();
  console.log("Created seller user:", seller.username);

  const [buyer] = await db.insert(schema.users).values({
    username: "buyer",
    password: buyerPassword,
    email: "buyer@example.com",
    role: "buyer",
    name: "Sample Buyer",
    phone: "7654321098",
    address: "Buyer Home, Residential Area, Delhi",
  }).returning();
  console.log("Created buyer user:", buyer.username);

  // Create sample products
  const products = [
    {
      name: "Smartphone X",
      price: 15999,
      description: "Latest smartphone with 6.5-inch display, 8GB RAM, 128GB storage, and quad camera setup.",
      imageUrl: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8c21hcnRwaG9uZXxlbnwwfHwwfHx8MA%3D%3D",
      category: "Electronics",
      stock: 50,
      sellerId: seller.id,
      approved: true,
    },
    {
      name: "Laptop Pro",
      price: 54999,
      description: "Premium laptop with Intel Core i7, 16GB RAM, 512GB SSD, and dedicated graphics card.",
      imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bGFwdG9wfGVufDB8fDB8fHww",
      category: "Electronics",
      stock: 20,
      sellerId: seller.id,
      approved: true,
    },
    {
      name: "Wireless Earbuds",
      price: 2499,
      description: "True wireless earbuds with noise cancellation, 24-hour battery life, and waterproof design.",
      imageUrl: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f37?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGVhcmJ1ZHN8ZW58MHx8MHx8fDA%3D",
      category: "Electronics",
      stock: 100,
      sellerId: seller.id,
      approved: true,
    },
    {
      name: "Men's Casual Shirt",
      price: 1299,
      description: "Comfortable cotton casual shirt for men in various colors and sizes.",
      imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8c2hpcnR8ZW58MHx8MHx8fDA%3D",
      category: "Fashion",
      stock: 200,
      sellerId: seller.id,
      approved: true,
    },
    {
      name: "Women's Designer Handbag",
      price: 2999,
      description: "Stylish designer handbag with multiple compartments and premium quality material.",
      imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aGFuZGJhZ3xlbnwwfHwwfHx8MA%3D%3D",
      category: "Fashion",
      stock: 50,
      sellerId: seller.id,
      approved: true,
    },
    {
      name: "Sports Shoes",
      price: 3499,
      description: "Comfortable and durable sports shoes with excellent grip and cushioning.",
      imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c2hvZXN8ZW58MHx8MHx8fDA%3D",
      category: "Fashion",
      stock: 75,
      sellerId: seller.id,
      approved: true,
    },
    {
      name: "Stainless Steel Cookware Set",
      price: 4999,
      description: "High-quality stainless steel cookware set with 6 pieces including pans and pots.",
      imageUrl: "https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8Y29va3dhcmV8ZW58MHx8MHx8fDA%3D",
      category: "Home",
      stock: 30,
      sellerId: seller.id,
      approved: true,
    },
    {
      name: "Smart LED TV 43-inch",
      price: 29999,
      description: "Smart LED TV with 43-inch 4K display, built-in streaming apps, and voice control.",
      imageUrl: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dHZ8ZW58MHx8MHx8fDA%3D",
      category: "Home",
      stock: 15,
      sellerId: seller.id,
      approved: true,
    },
    {
      name: "Bedsheet with Pillow Covers",
      price: 1499,
      description: "Cotton bedsheet with 2 pillow covers in various designs and colors.",
      imageUrl: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8YmVkc2hlZXR8ZW58MHx8MHx8fDA%3D",
      category: "Home",
      stock: 100,
      sellerId: seller.id,
      approved: true,
    },
  ];

  for (const product of products) {
    await db.insert(schema.products).values(product);
  }
  console.log(`Created ${products.length} products`);

  console.log("Database seeding complete!");
}

// Run the seeding
seedDatabase().catch(console.error);

export default seedDatabase;