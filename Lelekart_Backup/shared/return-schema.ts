/**
 * Return Management Schema
 * 
 * This file contains database schemas and types for the return management system.
 */

import { pgTable, serial, integer, varchar, text, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";

/**
 * Return Request Types (refund, return, replacement)
 */
export enum ReturnRequestType {
  REFUND = "refund",
  RETURN = "return",
  REPLACEMENT = "replacement"
}

/**
 * Return Request Status
 */
export enum ReturnStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  PROCESSING = "processing",
  RETURN_SHIPPED = "return_shipped",
  RETURN_RECEIVED = "return_received",
  REPLACEMENT_SHIPPED = "replacement_shipped",
  COMPLETED = "completed",
  CANCELLED = "cancelled"
}

/**
 * Sender Role for Return Messages
 */
export enum SenderRole {
  BUYER = "buyer",
  SELLER = "seller",
  ADMIN = "admin"
}

/**
 * Return Reason Categories
 */
export enum ReturnReasonCategory {
  RETURN = "return",
  REFUND = "refund",
  REPLACEMENT = "replacement"
}

/**
 * Return Reasons Table
 */
export const returnReasons = pgTable("return_reasons", {
  id: serial("id").primaryKey(),
  reasonText: text("reason_text").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

/**
 * Return Policies Table
 */
export const returnPolicies = pgTable("return_policies", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").references(() => users.id),
  categoryId: integer("category_id"),
  returnWindowDays: integer("return_window_days").notNull().default(7),
  replacementWindowDays: integer("replacement_window_days").notNull().default(7),
  refundWindowDays: integer("refund_window_days").notNull().default(7),
  policyText: text("policy_text"),
  nonReturnableItems: jsonb("non_returnable_items"),
  isActive: boolean("is_active").default(true),
  autoApproveThreshold: decimal("auto_approve_threshold").default("0"),
  shippingPaidBy: varchar("shipping_paid_by", { length: 20 }).default("seller"),
  conditionalRules: jsonb("conditional_rules").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

/**
 * Return Requests Table
 */
export const returnRequests = pgTable("return_requests", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  orderItemId: integer("order_item_id"),
  sellerId: integer("seller_id").references(() => users.id),
  buyerId: integer("buyer_id").notNull().references(() => users.id),
  requestType: varchar("request_type", { length: 20 }).notNull(),
  reasonId: integer("reason_id").notNull().references(() => returnReasons.id),
  customReason: text("custom_reason"),
  description: text("description"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  mediaUrls: jsonb("media_urls").default([]),
  sellerResponse: text("seller_response"),
  sellerResponseDate: timestamp("seller_response_date"),
  adminNotes: text("admin_notes"),
  adminResponseDate: timestamp("admin_response_date"),
  refundAmount: decimal("refund_amount"),
  refundMethod: varchar("refund_method", { length: 20 }),
  refundProcessed: boolean("refund_processed").default(false),
  refundTransactionId: varchar("refund_transaction_id", { length: 255 }),
  returnTracking: jsonb("return_tracking").default({}),
  replacementTracking: jsonb("replacement_tracking").default({}),
  replacementOrderId: integer("replacement_order_id"),
  pickupDate: timestamp("pickup_date"),
  returnReceivedDate: timestamp("return_received_date"),
  returnCondition: varchar("return_condition", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

/**
 * Return Messages Table
 */
export const returnMessages = pgTable("return_messages", {
  id: serial("id").primaryKey(),
  returnRequestId: integer("return_request_id")
    .notNull()
    .references(() => returnRequests.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").notNull().references(() => users.id),
  senderRole: varchar("sender_role", { length: 20 }).notNull(),
  message: text("message").notNull(),
  mediaUrls: jsonb("media_urls").default([]),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

/**
 * Return Status History Table
 */
export const returnStatusHistory = pgTable("return_status_history", {
  id: serial("id").primaryKey(),
  returnRequestId: integer("return_request_id")
    .notNull()
    .references(() => returnRequests.id, { onDelete: "cascade" }),
  previousStatus: varchar("previous_status", { length: 20 }),
  newStatus: varchar("new_status", { length: 20 }).notNull(),
  changedById: integer("changed_by").notNull().references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow()
});

// Zod validation schemas for insertions
export const insertReturnReasonSchema = createInsertSchema(returnReasons).omit({ id: true });
export const insertReturnPolicySchema = createInsertSchema(returnPolicies).omit({ id: true });
export const insertReturnRequestSchema = createInsertSchema(returnRequests).omit({ id: true });
export const insertReturnMessageSchema = createInsertSchema(returnMessages).omit({ id: true });
export const insertReturnStatusHistorySchema = createInsertSchema(returnStatusHistory).omit({ id: true });

// Types for database interactions
export type ReturnReason = typeof returnReasons.$inferSelect;
export type InsertReturnReason = z.infer<typeof insertReturnReasonSchema>;

export type ReturnPolicy = typeof returnPolicies.$inferSelect;
export type InsertReturnPolicy = z.infer<typeof insertReturnPolicySchema>;

export type ReturnRequest = typeof returnRequests.$inferSelect;
export type InsertReturnRequest = z.infer<typeof insertReturnRequestSchema>;

export type ReturnMessage = typeof returnMessages.$inferSelect;
export type InsertReturnMessage = z.infer<typeof insertReturnMessageSchema>;

export type ReturnStatusHistory = typeof returnStatusHistory.$inferSelect;
export type InsertReturnStatusHistory = z.infer<typeof insertReturnStatusHistorySchema>;

// Extended types for API responses
export interface ReturnRequestWithDetails extends ReturnRequest {
  reason?: ReturnReason;
  buyer?: any;  // User object
  seller?: any;  // User object
  order?: any;  // Order object
  orderItem?: any;  // OrderItem object
  messages?: ReturnMessage[];
  statusHistory?: ReturnStatusHistory[];
}

export interface ReturnMessageWithUser extends ReturnMessage {
  sender?: any;  // User object
}

// Additional query filter types
export interface ReturnRequestFilters {
  id?: number;
  orderId?: number;
  orderItemId?: number;
  sellerId?: number;
  buyerId?: number;
  status?: string | string[];
  requestType?: string | string[];
  refundProcessed?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

// Relations configuration
export const returnRelations = {
  returnRequests: {
    buyer: {
      table: users,
      field: "buyerId",
      references: "id"
    },
    seller: {
      table: users,
      field: "sellerId",
      references: "id"
    }
  },
  returnMessages: {
    sender: {
      table: users,
      field: "senderId",
      references: "id"
    }
  },
  returnStatusHistory: {
    changedBy: {
      table: users,
      field: "changedById",
      references: "id"
    }
  }
};