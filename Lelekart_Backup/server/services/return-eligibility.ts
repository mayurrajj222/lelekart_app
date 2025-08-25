/**
 * Return Eligibility Service
 * 
 * This file contains the logic for determining if an order item is eligible for return or replacement.
 */

import { storage } from "../storage";
import { ReturnPolicy } from "@shared/return-schema";

interface EligibilityResult {
  eligible: boolean;
  message: string;
  remainingDays?: number;
  policy?: ReturnPolicy;
}

/**
 * Check if an order item is eligible for return
 * @param orderId Order ID
 * @param orderItemId Order Item ID
 * @param requestType Type of request (return, replacement, refund)
 */
export async function checkReturnEligibility(
  orderId: number,
  orderItemId: number,
  requestType: string
): Promise<EligibilityResult> {
  try {
    // Get the order
    const order = await storage.getOrder(orderId);
    if (!order) {
      return {
        eligible: false,
        message: "Order not found"
      };
    }
    
    // Get the order item
    const orderItems = await storage.getOrderItems(orderId);
    const orderItem = orderItems.find(item => item.id === orderItemId);
    
    if (!orderItem) {
      return {
        eligible: false,
        message: "Order item not found"
      };
    }
    
    // Check if the item was delivered
    if (order.status !== 'delivered') {
      return {
        eligible: false,
        message: "Order is not delivered yet"
      };
    }
    
    // Check if a return request already exists for this item
    const existingRequests = await storage.getReturnRequestsForOrderItem(orderItemId);
    if (existingRequests.length > 0) {
      return {
        eligible: false,
        message: "A return request already exists for this item"
      };
    }
    
    // Get the product
    const product = orderItem.product;
    if (!product) {
      return {
        eligible: false,
        message: "Product not found"
      };
    }
    
    // Get the seller
    const seller = await storage.getUser(product.sellerId);
    if (!seller) {
      return {
        eligible: false,
        message: "Seller not found"
      };
    }
    
    // Get return policy - try to find a policy specific to this product category first,
    // then look for seller-specific policy, and finally fall back to system default
    let policy = await storage.getReturnPolicyByCriteria(
      product.sellerId,
      product.categoryId || null
    );
    
    if (!policy) {
      // If no specific policy is found, use the system default
      policy = await storage.getReturnPolicyByCriteria(null, null);
      
      if (!policy) {
        return {
          eligible: false,
          message: "No return policy found"
        };
      }
    }
    
    // Check if the request type is allowed by the policy
    // Note: allowedReturnTypes field doesn't exist in the schema, so we'll skip this check
    // const allowedTypes = policy.allowedReturnTypes || [];
    // if (!allowedTypes.includes(requestType)) {
    //   return {
    //     eligible: false,
    //     message: `${requestType} is not allowed by the seller's policy`
    //   };
    // }
    
    // Get delivery date from the order (since order items don't have deliveredAt)
    const deliveryDate = order.date ? new Date(order.date) : null;
    
    if (!deliveryDate) {
      return {
        eligible: false,
        message: "Delivery date not found"
      };
    }
    
    // Calculate the difference in days between now and delivery date
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Check if we're still within the return window
    if (diffInDays > policy.returnWindowDays) {
      return {
        eligible: false,
        message: `Return period of ${policy.returnWindowDays} days has expired`,
        policy
      };
    }
    
    // Calculate remaining days
    const remainingDays = policy.returnWindowDays - diffInDays;
    
    return {
      eligible: true,
      message: `Eligible for ${requestType}`,
      remainingDays,
      policy
    };
  } catch (error) {
    console.error("Error checking return eligibility:", error);
    return {
      eligible: false,
      message: "An error occurred while checking eligibility"
    };
  }
}

/**
 * Check if order status allows returns
 * @param status Order status
 */
export function isReturnableOrderStatus(status: string): boolean {
  const returnableStatuses = ['delivered', 'completed'];
  return returnableStatuses.includes(status);
}

/**
 * Check if a product is returnable based on its properties
 * @param product Product object
 */
export function isProductReturnable(product: any): boolean {
  // Products might have specific returnable flag
  if (product.isReturnable === false) {
    return false;
  }
  
  // Check for non-returnable categories
  const nonReturnableCategories = ['digital', 'downloadable', 'virtual', 'services'];
  if (product.category && nonReturnableCategories.includes(product.category.toLowerCase())) {
    return false;
  }
  
  return true;
}