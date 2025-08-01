import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  foreignKey,
  doublePrecision,
  jsonb,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema with role
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("buyer"),
  name: text("name"),
  phone: text("phone"),
  address: text("address"),
  profileImage: text("profile_image"), // Profile image URL
  approved: boolean("approved").notNull().default(false), // Sellers need admin approval
  rejected: boolean("rejected").notNull().default(false), // For rejected sellers
  isCoAdmin: boolean("is_co_admin").default(false), // Designates a user as a co-admin
  permissions: jsonb("permissions").default("{}"), // JSON object containing permission settings
  notificationPreferences: jsonb("notification_preferences").default("{}"), // User notification preferences
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
  name: true,
  phone: true,
  address: true,
  profileImage: true,
  approved: true,
  rejected: true,
  isCoAdmin: true,
  permissions: true,
  notificationPreferences: true,
});

// User OTP table for passwordless authentication
export const userOtps = pgTable("user_otps", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  otp: text("otp").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserOtpSchema = createInsertSchema(userOtps).pick({
  email: true,
  otp: true,
  expiresAt: true,
  verified: true,
});

export type User = typeof users.$inferSelect;
// export type InsertUser = z.infer<typeof insertUserSchema>;
// export type InsertUserOtp = z.infer<typeof insertUserOtpSchema>; 

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  productId: integer("product_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  points: integer("points").default(0).notNull(),
  lifetimePoints: integer("lifetime_points").default(0).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rewardTransactions = pgTable("reward_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  orderId: integer("order_id"),
  productId: integer("product_id"),
  points: integer("points").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  transactionDate: timestamp("transaction_date").defaultNow(),
  expiryDate: timestamp("expiry_date"),
  status: text("status").default("active").notNull(),
});

export const rewardRules = pgTable("reward_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  pointsAwarded: integer("points_awarded").notNull(),
  minimumOrderValue: integer("minimum_order_value"),
  percentageValue: decimal("percentage_value"),
  categoryId: integer("category_id"),
  validFrom: timestamp("valid_from"),
  validTo: timestamp("valid_to"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product schema
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: doublePrecision("price").notNull(),
  mrp: doublePrecision("mrp"),
  purchasePrice: doublePrecision("purchase_price"),
  gstRate: doublePrecision("gst_rate"),
  warranty: integer("warranty"),
  returnPolicy: text("return_policy"),
  specifications: text("specifications"),
  sku: text("sku"),
  stock: integer("stock").notNull().default(0),
  weight: doublePrecision("weight"),
  length: doublePrecision("length"),
  width: doublePrecision("width"),
  height: doublePrecision("height"),
  color: text("color"),
  size: text("size"),
  images: jsonb("images"),
  category: text("category"),
  subcategory: text("subcategory"),
  brand: text("brand"),
  sellerId: integer("seller_id"),
  approved: boolean("approved").notNull().default(false),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Category schema
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subcategory schema
export const subcategories = pgTable("subcategories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  categoryId: integer("category_id").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Order schema
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  addressId: integer("address_id").notNull(),
  shippingDetails: text("shipping_details"),
  paymentMethod: text("payment_method").notNull().default("cod"),
  status: text("status").notNull().default("placed"),
  total: doublePrecision("total").notNull(),
  rewardDiscount: doublePrecision("reward_discount").default(0),
  rewardPointsUsed: integer("reward_points_used").default(0),
  walletDiscount: doublePrecision("wallet_discount").default(0),
  date: timestamp("date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Address schema
export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  addressName: text("address_name").notNull(),
  fullName: text("full_name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  pincode: text("pincode").notNull(),
  phone: text("phone").notNull(),
  addressType: text("address_type").notNull().default("both"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order Items schema
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  price: doublePrecision("price").notNull(),
  variant: text("variant"), // JSON string for variant details
  createdAt: timestamp("created_at").defaultNow(),
}); 