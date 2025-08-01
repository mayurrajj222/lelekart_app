import { db } from "./db";
import * as schema from "../shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function createAdminUser() {
  const adminEmail = "kaushlendra.k12@fms.edu";
  console.log("Checking for special admin user...");

  // Check if the admin user already exists
  const existingAdmin = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, adminEmail));

  if (existingAdmin.length > 0) {
    console.log("Special admin user already exists:", existingAdmin[0].username);
    return existingAdmin[0];
  }

  // Create the admin user with a secure password
  // This is a non-deletable admin account that can bypass OTP verification
  const adminPassword = await hashPassword("adminSecurePassword" + Date.now());
  
  const [admin] = await db
    .insert(schema.users)
    .values({
      username: "SuperAdmin",
      password: adminPassword,
      email: adminEmail,
      role: "admin",
      name: "Kaushlendra Admin",
      phone: "9876543210",
      address: "FMS, Delhi",
    })
    .returning();

  console.log("Created special admin user:", admin.username);
  return admin;
}

// Flag to identify the special admin in the authentication flow
export function isSpecialAdmin(email: string): boolean {
  return email === "kaushlendra.k12@fms.edu";
} 