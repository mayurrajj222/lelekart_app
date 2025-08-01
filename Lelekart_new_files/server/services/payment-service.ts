/**
 * Payment Service
 * 
 * This file contains functions for handling payments and refunds.
 */

import { storage } from "../storage";
import { createRazorpayRefund, getRazorpayRefundStatus } from "../utils/razorpay";
import * as emailService from "./email-service";

// Refund types
const REFUND_TYPES = {
  ORIGINAL_METHOD: "original_method",
  WALLET: "wallet"
};

/**
 * Process a refund for a return request
 * @param returnRequestId Return request ID
 * @param amount Refund amount
 * @param refundMethod Refund method (original_method or wallet)
 */
export async function processRefund(
  returnRequestId: number,
  amount: number,
  refundMethod: string = REFUND_TYPES.ORIGINAL_METHOD
): Promise<any> {
  try {
    // Get the return request
    const returnRequest = await storage.getReturnRequestById(returnRequestId);
    if (!returnRequest) {
      throw new Error("Return request not found");
    }
    
    // Get the order
    const order = await storage.getOrder(returnRequest.orderId);
    if (!order) {
      throw new Error("Order not found");
    }
    
    // Get the buyer
    const buyer = await storage.getUser(returnRequest.buyerId);
    if (!buyer) {
      throw new Error("Buyer not found");
    }
    
    // Create refund record
    const refund = await storage.createReturnRefund({
      returnRequestId,
      amount,
      method: refundMethod,
      status: "processing",
      notes: `Refund for return request #${returnRequestId}`
    });
    
    // Process the refund based on the method
    let refundResult;
    
    if (refundMethod === REFUND_TYPES.WALLET) {
      // Add amount to buyer's wallet
      refundResult = await processBuyerWalletRefund(buyer.id, amount, returnRequestId);
    } else {
      // Process refund to original payment method
      refundResult = await processOriginalMethodRefund(order, amount, returnRequestId);
    }
    
    // Update the refund record with the result
    const updatedRefund = await storage.updateReturnRefund(refund.id, {
      status: refundResult.success ? "completed" : "failed",
      externalRefundId: refundResult.externalRefundId,
      notes: refundResult.notes || refund.notes
    });
    
    // Update the return request with the refund details
    await storage.updateReturnRequest(returnRequestId, {
      refundStatus: refundResult.success ? "completed" : "failed",
      refundAmount: amount,
      refundMethod,
      refundDate: new Date()
    });
    
    // Send refund email to the buyer
    if (refundResult.success) {
      const returnWithDetails = await storage.getReturnRequestWithDetails(returnRequestId);
      await emailService.sendRefundProcessedEmail(returnWithDetails, buyer.email);
    }
    
    return {
      success: refundResult.success,
      refund: updatedRefund,
      message: refundResult.message
    };
  } catch (error) {
    console.error("Error processing refund:", error);
    return {
      success: false,
      message: error.message || "Failed to process refund"
    };
  }
}

/**
 * Process a refund to buyer's wallet
 * @param buyerId Buyer ID
 * @param amount Refund amount
 * @param returnRequestId Return request ID for reference
 */
async function processBuyerWalletRefund(
  buyerId: number,
  amount: number,
  returnRequestId: number
): Promise<{
  success: boolean;
  message: string;
  externalRefundId?: string;
  notes?: string;
}> {
  try {
    // Add amount to buyer's wallet
    await storage.adjustWallet(
      buyerId,
      amount,
      "refund",
      `Refund for return request #${returnRequestId}`
    );
    
    return {
      success: true,
      message: "Refund amount successfully added to buyer's wallet",
      externalRefundId: `wallet-refund-${Date.now()}`,
      notes: `Refund of ₹${amount} added to buyer's wallet on ${new Date().toLocaleDateString()}`
    };
  } catch (error) {
    console.error("Error processing wallet refund:", error);
    return {
      success: false,
      message: error.message || "Failed to process wallet refund"
    };
  }
}

/**
 * Process a refund to the original payment method
 * @param order Original order
 * @param amount Refund amount
 * @param returnRequestId Return request ID for reference
 */
async function processOriginalMethodRefund(
  order: any,
  amount: number,
  returnRequestId: number
): Promise<{
  success: boolean;
  message: string;
  externalRefundId?: string;
  notes?: string;
}> {
  try {
    const paymentMethod = order.paymentMethod;
    
    if (paymentMethod === "razorpay") {
      // If the payment was made through Razorpay
      if (!order.razorpayPaymentId) {
        throw new Error("Original payment ID not found");
      }
      
      // Process refund through Razorpay
      const razorpayResponse = await createRazorpayRefund(
        order.razorpayPaymentId,
        amount * 100, // Razorpay works in paise
        `Refund for return request #${returnRequestId}`
      );
      
      return {
        success: true,
        message: "Refund initiated through Razorpay",
        externalRefundId: razorpayResponse.id,
        notes: `Razorpay refund initiated for ₹${amount} on ${new Date().toLocaleDateString()}`
      };
    } else if (paymentMethod === "cod") {
      // For Cash on Delivery orders, add to wallet as direct refund is not possible
      await storage.adjustWallet(
        order.userId,
        amount,
        "refund",
        `Refund for COD order #${order.orderNumber}, return request #${returnRequestId}`
      );
      
      return {
        success: true,
        message: "Refund processed to wallet (COD order)",
        externalRefundId: `wallet-cod-refund-${Date.now()}`,
        notes: `Refund of ₹${amount} for COD order added to buyer's wallet on ${new Date().toLocaleDateString()}`
      };
    } else {
      // For other payment methods, handle accordingly
      // This is a placeholder for other payment methods
      return {
        success: false,
        message: `Refund for payment method '${paymentMethod}' not supported yet`,
        notes: `Manual refund required for ₹${amount}`
      };
    }
  } catch (error) {
    console.error("Error processing original method refund:", error);
    return {
      success: false,
      message: error.message || "Failed to process refund to original payment method"
    };
  }
}

/**
 * Check refund status for a return request
 * @param returnRequestId Return request ID
 */
export async function checkRefundStatus(returnRequestId: number): Promise<{
  success: boolean;
  status: string;
  message: string;
}> {
  try {
    // Get the return request
    const returnRequest = await storage.getReturnRequestById(returnRequestId);
    if (!returnRequest) {
      throw new Error("Return request not found");
    }
    
    // Get refund record
    const refunds = await storage.getReturnRefunds(returnRequestId);
    if (!refunds || refunds.length === 0) {
      return {
        success: false,
        status: "not_found",
        message: "No refund record found for this return request"
      };
    }
    
    const latestRefund = refunds[0]; // Assuming the latest refund is the first one
    
    // If the refund is already completed or failed, return its status
    if (latestRefund.status === "completed" || latestRefund.status === "failed") {
      return {
        success: true,
        status: latestRefund.status,
        message: `Refund is ${latestRefund.status}`
      };
    }
    
    // If refund is through Razorpay, check its status
    if (latestRefund.externalRefundId && latestRefund.externalRefundId.startsWith("rfnd_")) {
      const razorpayStatus = await getRazorpayRefundStatus(latestRefund.externalRefundId);
      
      // Update the refund record with the latest status
      await storage.updateReturnRefund(latestRefund.id, {
        status: razorpayStatus.status
      });
      
      return {
        success: true,
        status: razorpayStatus.status,
        message: razorpayStatus.message
      };
    }
    
    // For other refund methods, just return the current status
    return {
      success: true,
      status: latestRefund.status,
      message: `Refund is ${latestRefund.status}`
    };
  } catch (error) {
    console.error("Error checking refund status:", error);
    return {
      success: false,
      status: "error",
      message: error.message || "Failed to check refund status"
    };
  }
}