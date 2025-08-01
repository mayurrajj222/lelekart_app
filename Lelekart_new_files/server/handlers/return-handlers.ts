/**
 * Return Handlers
 *
 * This file contains handler functions for return management operations.
 */

import { storage } from "../storage";
import { checkReturnEligibility } from "../services/return-eligibility";
import * as emailService from "../services/email-service";
import * as paymentService from "../services/payment-service";
import * as orderStatusHandler from "./order-status-handler";
import { sendNotificationToUser } from "../websocket";

/**
 * Create a new return request
 */
export async function createReturnRequest(
  userId: number,
  orderId: number,
  orderItemId: number,
  requestType: string,
  reasonId: number,
  description?: string,
  mediaUrls?: string[]
): Promise<any> {
  try {
    // Check eligibility first
    const eligibility = await checkReturnEligibility(
      orderId,
      orderItemId,
      requestType
    );
    if (!eligibility.eligible) {
      throw new Error(eligibility.message);
    }

    // Parallelize DB fetches
    const [order, orderItems, reason] = await Promise.all([
      storage.getOrder(orderId),
      storage.getOrderItems(orderId),
      storage.getReturnReasonById(reasonId),
    ]);
    const orderItem = orderItems.find((item) => item.id === orderItemId);
    if (!orderItem) {
      throw new Error("Order item not found");
    }
    if (!reason) {
      throw new Error("Invalid return reason");
    }

    // Create the return request
    const returnRequest = await storage.createReturnRequest({
      orderId,
      orderItemId,
      userId,
      buyerId: order.userId,
      sellerId: orderItem.product.sellerId,
      requestType,
      reasonId,
      reasonText: reason.text,
      description,
      status: "pending",
      mediaUrls: mediaUrls || [],
      eligibleForRefund:
        requestType === "refund" || requestType === "replacement",
      returnPolicy: eligibility.policy
        ? JSON.stringify(eligibility.policy)
        : null,
    });

    // Create initial status history
    await storage.createReturnStatusHistory({
      returnRequestId: returnRequest.id,
      newStatus: "pending",
      changedById: userId,
      notes: "Return request created",
    });

    // Fire-and-forget notifications/emails
    sendReturnNotifications({
      returnRequest,
      order,
      orderItem,
      reason,
      userId,
    });

    // Return the created request immediately
    return returnRequest;
  } catch (error) {
    console.error("Error creating return request:", error);
    throw error;
  }
}

// Background notification/email sender
async function sendReturnNotifications({
  returnRequest,
  order,
  orderItem,
  reason,
  userId,
}: any) {
  try {
    // 1. Email to buyer
    const buyer = await storage.getUser(order.userId);
    if (buyer && buyer.email) {
      await emailService.sendReturnRequestEmail(
        { ...returnRequest, order, orderItem, product: orderItem.product },
        buyer.email
      );
    }
    // 2. In-app notification to seller
    const seller = await storage.getUser(orderItem.product.sellerId);
    if (seller) {
      await storage.createNotification({
        userId: seller.id,
        type: "return_request",
        title: "New Return Request",
        message: `Return request #${returnRequest.id} received for order #${order.orderNumber}`,
        metadata: {
          returnRequestId: returnRequest.id,
          orderId: order.id,
          orderItemId: orderItem.id,
        },
        read: false,
      });
      // WebSocket notification if seller is online
      await sendNotificationToUser(seller.id, {
        type: "return_request",
        title: "New Return Request",
        message: `New return request for order #${order.orderNumber}`,
        metadata: {
          returnRequestId: returnRequest.id,
          orderId: order.id,
          orderItemId: orderItem.id,
        },
        read: false,
      });
    }
  } catch (err) {
    console.error("Error sending return notifications:", err);
  }
}

/**
 * Get details for a specific return request
 */
export async function getReturnRequest(
  returnRequestId: number,
  userId: number
): Promise<any> {
  try {
    // Get the return request details
    const returnRequest =
      await storage.getReturnRequestWithDetails(returnRequestId);

    if (!returnRequest) {
      throw new Error("Return request not found");
    }

    // Only allow access to the buyer, seller, or admin
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const isAuthorized =
      returnRequest.buyerId === userId ||
      returnRequest.sellerId === userId ||
      user.role === "admin" ||
      user.isCoAdmin;

    if (!isAuthorized) {
      throw new Error("Access denied");
    }

    // Get status history
    const statusHistory = await storage.getReturnStatusHistory(returnRequestId);

    // Get messages
    const messages = await storage.getReturnMessagesWithUsers(returnRequestId);

    // Mark messages as read for this user
    await storage.markReturnMessagesAsRead(returnRequestId, userId);

    // Compile all data
    const returnData = {
      ...returnRequest,
      statusHistory,
      messages,
    };

    return returnData;
  } catch (error) {
    console.error("Error getting return request:", error);
    throw error;
  }
}

/**
 * Get return messages
 */
export async function getReturnMessages(
  returnRequestId: number,
  userId: number
): Promise<any> {
  try {
    // Check authorization
    const returnRequest = await storage.getReturnRequestById(returnRequestId);
    if (!returnRequest) {
      throw new Error("Return request not found");
    }

    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const isAuthorized =
      returnRequest.buyerId === userId ||
      returnRequest.sellerId === userId ||
      user.role === "admin" ||
      user.isCoAdmin;

    if (!isAuthorized) {
      throw new Error("Access denied");
    }

    // Get the messages
    const messages = await storage.getReturnMessagesWithUsers(returnRequestId);

    // Mark messages as read for this user
    await storage.markReturnMessagesAsRead(returnRequestId, userId);

    return messages;
  } catch (error) {
    console.error("Error getting return messages:", error);
    throw error;
  }
}

/**
 * Add a message to a return request
 */
export async function addReturnMessage(
  returnRequestId: number,
  userId: number,
  message: string,
  mediaUrls?: string[]
): Promise<any> {
  try {
    // Check authorization
    const returnRequest = await storage.getReturnRequestById(returnRequestId);
    if (!returnRequest) {
      throw new Error("Return request not found");
    }

    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const isAuthorized =
      returnRequest.buyerId === userId ||
      returnRequest.sellerId === userId ||
      user.role === "admin" ||
      user.isCoAdmin;

    if (!isAuthorized) {
      throw new Error("Access denied");
    }

    // Create the message
    const newMessage = await storage.createReturnMessage({
      returnRequestId,
      userId,
      message,
      mediaUrls: mediaUrls || [],
      read: false,
    });

    // Send notification to other parties
    const notifyUserIds = [];

    // Notify buyer if message is from seller or admin
    if (userId !== returnRequest.buyerId) {
      notifyUserIds.push(returnRequest.buyerId);
    }

    // Notify seller if message is from buyer or admin
    if (userId !== returnRequest.sellerId) {
      notifyUserIds.push(returnRequest.sellerId);
    }

    // Create in-app notifications
    for (const notifyUserId of notifyUserIds) {
      await storage.createNotification({
        userId: notifyUserId,
        type: "return_message",
        title: "New Return Message",
        message: `New message on return request #${returnRequestId}`,
        metadata: {
          returnRequestId,
          messageId: newMessage.id,
        },
        read: false,
      });

      // WebSocket notification if user is online
      await sendNotificationToUser(notifyUserId, {
        type: "return_message",
        title: "New Return Message",
        message: `New message on return request #${returnRequestId}`,
        metadata: {
          returnRequestId,
          messageId: newMessage.id,
        },
        read: false,
      });
    }

    return newMessage;
  } catch (error) {
    console.error("Error adding return message:", error);
    throw error;
  }
}

/**
 * Cancel a return request
 */
export async function cancelReturnRequest(
  returnRequestId: number,
  userId: number,
  reason: string
): Promise<any> {
  try {
    // Check authorization
    const returnRequest = await storage.getReturnRequestById(returnRequestId);
    if (!returnRequest) {
      throw new Error("Return request not found");
    }

    // Only the buyer or admin can cancel a return request
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const isAuthorized =
      returnRequest.buyerId === userId ||
      user.role === "admin" ||
      user.isCoAdmin;

    if (!isAuthorized) {
      throw new Error("Access denied");
    }

    // Check if the request can be cancelled
    if (
      returnRequest.status !== "pending" &&
      returnRequest.status !== "approved"
    ) {
      throw new Error(
        `Cannot cancel a return request in ${returnRequest.status} status`
      );
    }

    // Update the return status
    const updatedReturn = await storage.updateReturnRequest(returnRequestId, {
      status: "cancelled",
      cancelReason: reason,
      cancelledAt: new Date(),
    });

    // Add status history entry
    await storage.createReturnStatusHistory({
      returnRequestId,
      newStatus: "cancelled",
      changedById: userId,
      notes: `Cancelled by ${user.role === "admin" ? "admin" : "buyer"}: ${reason}`,
    });

    // Notify the seller
    await storage.createNotification({
      userId: returnRequest.sellerId,
      type: "return_cancelled",
      title: "Return Request Cancelled",
      message: `Return request #${returnRequestId} has been cancelled`,
      metadata: {
        returnRequestId,
      },
      read: false,
    });

    // WebSocket notification if seller is online
    await sendNotificationToUser(returnRequest.sellerId, {
      type: "return_cancelled",
      title: "Return Request Cancelled",
      message: `Return request #${returnRequestId} has been cancelled`,
      metadata: {
        returnRequestId,
      },
      read: false,
    });

    return updatedReturn;
  } catch (error) {
    console.error("Error cancelling return request:", error);
    throw error;
  }
}

/**
 * Update the status of a return request
 */
export async function updateReturnRequestStatus(
  returnRequestId: number,
  userId: number,
  status: string,
  notes?: string
): Promise<any> {
  try {
    // Check authorization
    const returnRequest = await storage.getReturnRequestById(returnRequestId);
    if (!returnRequest) {
      throw new Error("Return request not found");
    }

    // Only the seller or admin can update status
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const isAuthorized =
      returnRequest.sellerId === userId ||
      user.role === "admin" ||
      user.isCoAdmin;

    if (!isAuthorized) {
      throw new Error("Access denied");
    }

    // Validate status transitions
    const validTransitions: { [key: string]: string[] } = {
      pending: ["approved", "rejected"],
      approved: ["item_in_transit", "cancelled"],
      item_in_transit: ["item_received", "cancelled"],
      item_received: [
        "replacement_in_transit",
        "refund_initiated",
        "cancelled",
      ],
      replacement_in_transit: ["completed", "cancelled"],
      refund_initiated: ["refund_processed", "cancelled"],
      refund_processed: ["completed"],
      completed: [],
      cancelled: [],
      rejected: [],
    };

    const currentStatus = returnRequest.status;
    if (!validTransitions[currentStatus].includes(status)) {
      throw new Error(`Cannot transition from ${currentStatus} to ${status}`);
    }

    // Update the return status
    const updatedReturn = await storage.updateReturnRequest(returnRequestId, {
      status,
      statusUpdatedAt: new Date(),
    });

    // Add status history entry
    await storage.createReturnStatusHistory({
      returnRequestId,
      newStatus: status,
      changedById: userId,
      notes: notes || `Status updated to ${status}`,
    });

    // Process status-specific actions
    await processStatusSpecificActions(returnRequestId, status, userId, notes);

    return updatedReturn;
  } catch (error) {
    console.error("Error updating return status:", error);
    throw error;
  }
}

/**
 * Process additional actions based on status
 */
async function processStatusSpecificActions(
  returnRequestId: number,
  status: string,
  userId: number,
  notes?: string
): Promise<void> {
  try {
    // Get the return request
    const returnRequest = await storage.getReturnRequestById(returnRequestId);
    if (!returnRequest) {
      throw new Error("Return request not found");
    }

    // Get related data
    const order = await storage.getOrder(returnRequest.orderId);
    const orderItems = await storage.getOrderItems(returnRequest.orderId);
    const orderItem = orderItems.find(
      (item) => item.id === returnRequest.orderItemId
    );
    const buyer = await storage.getUser(returnRequest.buyerId);

    if (!order || !orderItem || !buyer) {
      throw new Error("Related data not found");
    }

    // Actions based on status
    switch (status) {
      case "approved":
        // Send approval email to buyer
        if (buyer.email) {
          await emailService.sendReturnApprovalEmail(
            { ...returnRequest, order, orderItem, product: orderItem.product },
            buyer.email
          );
        }

        // Notify buyer in-app
        await storage.createNotification({
          userId: buyer.id,
          type: "return_approved",
          title: "Return Request Approved",
          message: `Your return request #${returnRequestId} has been approved`,
          metadata: {
            returnRequestId,
          },
          read: false,
        });

        // WebSocket notification if buyer is online
        await sendNotificationToUser(buyer.id, {
          type: "return_approved",
          title: "Return Request Approved",
          message: `Your return request #${returnRequestId} has been approved`,
          metadata: {
            returnRequestId,
          },
          read: false,
        });
        break;

      case "rejected":
        // Send rejection email to buyer
        if (buyer.email) {
          await emailService.sendReturnRejectionEmail(
            { ...returnRequest, order, orderItem, product: orderItem.product },
            buyer.email,
            notes || "Return policy requirements not met"
          );
        }

        // Notify buyer in-app
        await storage.createNotification({
          userId: buyer.id,
          type: "return_rejected",
          title: "Return Request Rejected",
          message: `Your return request #${returnRequestId} has been rejected`,
          metadata: {
            returnRequestId,
          },
          read: false,
        });

        // WebSocket notification if buyer is online
        await sendNotificationToUser(buyer.id, {
          type: "return_rejected",
          title: "Return Request Rejected",
          message: `Your return request #${returnRequestId} has been rejected`,
          metadata: {
            returnRequestId,
          },
          read: false,
        });
        break;

      case "item_received":
        // Send item received email to buyer
        if (buyer.email) {
          await emailService.sendReturnItemReceivedEmail(
            { ...returnRequest, order, orderItem, product: orderItem.product },
            buyer.email
          );
        }

        // Notify buyer in-app
        await storage.createNotification({
          userId: buyer.id,
          type: "return_item_received",
          title: "Return Item Received",
          message: `Your returned item for request #${returnRequestId} has been received`,
          metadata: {
            returnRequestId,
          },
          read: false,
        });

        // WebSocket notification if buyer is online
        await sendNotificationToUser(buyer.id, {
          type: "return_item_received",
          title: "Return Item Received",
          message: `Your returned item for request #${returnRequestId} has been received`,
          metadata: {
            returnRequestId,
          },
          read: false,
        });
        break;

      case "refund_initiated":
        // Initiate refund based on the payment method
        const refundAmount =
          orderItem.totalPrice || orderItem.price * orderItem.quantity;
        const refundResult = await paymentService.processRefund(
          returnRequestId,
          refundAmount,
          "original_method" // Default to original payment method
        );

        // If refund started successfully, send email to buyer
        if (refundResult.success && buyer.email) {
          await emailService.sendRefundInitiatedEmail(
            {
              ...returnRequest,
              order,
              orderItem,
              product: orderItem.product,
              refundAmount,
            },
            buyer.email
          );
        }

        // Notify buyer in-app
        await storage.createNotification({
          userId: buyer.id,
          type: "refund_initiated",
          title: "Refund Initiated",
          message: `Refund of ₹${refundAmount} has been initiated for your return request #${returnRequestId}`,
          metadata: {
            returnRequestId,
            refundAmount,
          },
          read: false,
        });

        // WebSocket notification if buyer is online
        await sendNotificationToUser(buyer.id, {
          type: "refund_initiated",
          title: "Refund Initiated",
          message: `Refund of ₹${refundAmount} has been initiated for your return request #${returnRequestId}`,
          metadata: {
            returnRequestId,
            refundAmount,
          },
          read: false,
        });
        break;

      case "refund_processed":
        // Mark the refund as processed
        // Get the latest refund record
        const refunds = await storage.getReturnRefunds(returnRequestId);
        if (refunds && refunds.length > 0) {
          const latestRefund = refunds[0];
          await storage.updateReturnRefund(latestRefund.id, {
            status: "completed",
            processedAt: new Date(),
          });

          // Send refund processed email to buyer
          if (buyer.email) {
            await emailService.sendRefundProcessedEmail(
              {
                ...returnRequest,
                order,
                orderItem,
                product: orderItem.product,
                refundAmount: latestRefund.amount,
                refundMethod: latestRefund.method,
              },
              buyer.email
            );
          }

          // Notify buyer in-app
          await storage.createNotification({
            userId: buyer.id,
            type: "refund_processed",
            title: "Refund Processed",
            message: `Your refund of ₹${latestRefund.amount} for return request #${returnRequestId} has been processed`,
            metadata: {
              returnRequestId,
              refundAmount: latestRefund.amount,
            },
            read: false,
          });

          // WebSocket notification if buyer is online
          await sendNotificationToUser(buyer.id, {
            type: "refund_processed",
            title: "Refund Processed",
            message: `Your refund of ₹${latestRefund.amount} for return request #${returnRequestId} has been processed`,
            metadata: {
              returnRequestId,
              refundAmount: latestRefund.amount,
            },
            read: false,
          });
        }
        break;

      case "completed":
        // Send completion email to buyer
        if (buyer.email) {
          await emailService.sendReturnCompletedEmail(
            { ...returnRequest, order, orderItem, product: orderItem.product },
            buyer.email
          );
        }

        // Update order item status if needed
        if (
          returnRequest.requestType === "return" ||
          returnRequest.requestType === "refund"
        ) {
          await storage.updateOrderItem(orderItem.id, {
            status: "returned",
            returnedAt: new Date(),
          });
        }

        // Notify buyer in-app
        await storage.createNotification({
          userId: buyer.id,
          type: "return_completed",
          title: "Return Completed",
          message: `Your return request #${returnRequestId} has been completed`,
          metadata: {
            returnRequestId,
          },
          read: false,
        });

        // WebSocket notification if buyer is online
        await sendNotificationToUser(buyer.id, {
          type: "return_completed",
          title: "Return Completed",
          message: `Your return request #${returnRequestId} has been completed`,
          metadata: {
            returnRequestId,
          },
          read: false,
        });
        break;
    }
  } catch (error) {
    console.error("Error processing status-specific actions:", error);
    throw error;
  }
}

/**
 * Update return tracking information (for buyer to add shipping details)
 */
export async function updateReturnTracking(
  returnRequestId: number,
  userId: number,
  trackingInfo: any
): Promise<any> {
  try {
    // Check authorization
    const returnRequest = await storage.getReturnRequestById(returnRequestId);
    if (!returnRequest) {
      throw new Error("Return request not found");
    }

    // Only the buyer or admin can add return tracking
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const isAuthorized =
      returnRequest.buyerId === userId ||
      user.role === "admin" ||
      user.isCoAdmin;

    if (!isAuthorized) {
      throw new Error("Access denied");
    }

    // Validate tracking info
    if (!trackingInfo.trackingNumber || !trackingInfo.courierName) {
      throw new Error("Tracking number and courier name are required");
    }

    // Check if status is appropriate for adding tracking
    if (returnRequest.status !== "approved") {
      throw new Error(
        "Return request must be in 'approved' status to add tracking"
      );
    }

    // Update the return request
    const updatedReturn = await storage.updateReturnRequest(returnRequestId, {
      status: "item_in_transit",
      returnTrackingNumber: trackingInfo.trackingNumber,
      returnCourierName: trackingInfo.courierName,
      returnTrackingUrl: trackingInfo.trackingUrl || null,
      returnShippedAt: new Date(),
    });

    // Add status history entry
    await storage.createReturnStatusHistory({
      returnRequestId,
      newStatus: "item_in_transit",
      changedById: userId,
      notes: `Return shipment initiated with ${trackingInfo.courierName} (${trackingInfo.trackingNumber})`,
    });

    // Notify the seller
    await storage.createNotification({
      userId: returnRequest.sellerId,
      type: "return_in_transit",
      title: "Return Item Shipped",
      message: `Item for return request #${returnRequestId} has been shipped`,
      metadata: {
        returnRequestId,
        trackingNumber: trackingInfo.trackingNumber,
        courierName: trackingInfo.courierName,
      },
      read: false,
    });

    // WebSocket notification if seller is online
    await sendNotificationToUser(returnRequest.sellerId, {
      type: "return_in_transit",
      title: "Return Item Shipped",
      message: `Item for return request #${returnRequestId} has been shipped`,
      metadata: {
        returnRequestId,
        trackingNumber: trackingInfo.trackingNumber,
        courierName: trackingInfo.courierName,
      },
      read: false,
    });

    return updatedReturn;
  } catch (error) {
    console.error("Error updating return tracking:", error);
    throw error;
  }
}

/**
 * Update replacement tracking information (for seller to add shipping details)
 */
export async function updateReplacementTracking(
  returnRequestId: number,
  userId: number,
  trackingInfo: any
): Promise<any> {
  try {
    // Check authorization
    const returnRequest = await storage.getReturnRequestById(returnRequestId);
    if (!returnRequest) {
      throw new Error("Return request not found");
    }

    // Only the seller or admin can add replacement tracking
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const isAuthorized =
      returnRequest.sellerId === userId ||
      user.role === "admin" ||
      user.isCoAdmin;

    if (!isAuthorized) {
      throw new Error("Access denied");
    }

    // Validate tracking info
    if (!trackingInfo.trackingNumber || !trackingInfo.courierName) {
      throw new Error("Tracking number and courier name are required");
    }

    // Check if this is a replacement request
    if (returnRequest.requestType !== "replacement") {
      throw new Error("This is not a replacement request");
    }

    // Check if status is appropriate for adding tracking
    if (returnRequest.status !== "item_received") {
      throw new Error(
        "Return request must be in 'item_received' status to add replacement tracking"
      );
    }

    // Update the return request
    const updatedReturn = await storage.updateReturnRequest(returnRequestId, {
      status: "replacement_in_transit",
      replacementTrackingNumber: trackingInfo.trackingNumber,
      replacementCourierName: trackingInfo.courierName,
      replacementTrackingUrl: trackingInfo.trackingUrl || null,
      replacementShippedAt: new Date(),
    });

    // Add status history entry
    await storage.createReturnStatusHistory({
      returnRequestId,
      newStatus: "replacement_in_transit",
      changedById: userId,
      notes: `Replacement shipment initiated with ${trackingInfo.courierName} (${trackingInfo.trackingNumber})`,
    });

    // Send replacement shipped email to buyer
    const buyer = await storage.getUser(returnRequest.buyerId);
    if (buyer && buyer.email) {
      await emailService.sendReplacementShippedEmail(
        {
          ...returnRequest,
          replacementTrackingNumber: trackingInfo.trackingNumber,
          replacementCourierName: trackingInfo.courierName,
          replacementTrackingUrl: trackingInfo.trackingUrl || null,
        },
        buyer.email
      );
    }

    // Notify the buyer
    await storage.createNotification({
      userId: returnRequest.buyerId,
      type: "replacement_shipped",
      title: "Replacement Shipped",
      message: `Replacement for return request #${returnRequestId} has been shipped`,
      metadata: {
        returnRequestId,
        trackingNumber: trackingInfo.trackingNumber,
        courierName: trackingInfo.courierName,
      },
      read: false,
    });

    // WebSocket notification if buyer is online
    await sendNotificationToUser(returnRequest.buyerId, {
      type: "replacement_shipped",
      title: "Replacement Shipped",
      message: `Replacement for return request #${returnRequestId} has been shipped`,
      metadata: {
        returnRequestId,
        trackingNumber: trackingInfo.trackingNumber,
        courierName: trackingInfo.courierName,
      },
      read: false,
    });

    return updatedReturn;
  } catch (error) {
    console.error("Error updating replacement tracking:", error);
    throw error;
  }
}

/**
 * Mark a return as received (seller confirms receiving the returned item)
 */
export async function markReturnReceived(
  returnRequestId: number,
  userId: number,
  condition: string,
  notes?: string
): Promise<any> {
  try {
    // Check authorization
    const returnRequest = await storage.getReturnRequestById(returnRequestId);
    if (!returnRequest) {
      throw new Error("Return request not found");
    }

    // Only the seller or admin can mark as received
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const isAuthorized =
      returnRequest.sellerId === userId ||
      user.role === "admin" ||
      user.isCoAdmin;

    if (!isAuthorized) {
      throw new Error("Access denied");
    }

    // Check if status is appropriate
    if (returnRequest.status !== "item_in_transit") {
      throw new Error(
        "Return request must be in 'item_in_transit' status to mark as received"
      );
    }

    // Update the return request
    const updatedReturn = await storage.updateReturnRequest(returnRequestId, {
      status: "item_received",
      itemCondition: condition,
      itemReceivedAt: new Date(),
    });

    // Add status history entry
    await storage.createReturnStatusHistory({
      returnRequestId,
      newStatus: "item_received",
      changedById: userId,
      notes: notes || `Item received in ${condition} condition`,
    });

    // Notify the buyer
    const buyer = await storage.getUser(returnRequest.buyerId);
    if (buyer) {
      // Send email notification
      if (buyer.email) {
        await emailService.sendReturnItemReceivedEmail(
          { ...returnRequest, itemCondition: condition },
          buyer.email
        );
      }

      // In-app notification
      await storage.createNotification({
        userId: buyer.id,
        type: "return_item_received",
        title: "Return Item Received",
        message: `Your returned item for request #${returnRequestId} has been received`,
        metadata: {
          returnRequestId,
          condition,
        },
        read: false,
      });

      // WebSocket notification if buyer is online
      await sendNotificationToUser(buyer.id, {
        type: "return_item_received",
        title: "Return Item Received",
        message: `Your returned item for request #${returnRequestId} has been received`,
        metadata: {
          returnRequestId,
          condition,
        },
        read: false,
      });
    }

    return updatedReturn;
  } catch (error) {
    console.error("Error marking return as received:", error);
    throw error;
  }
}

/**
 * Complete a return request (final step)
 */
export async function completeReturnRequest(
  returnRequestId: number,
  userId: number
): Promise<any> {
  try {
    // Check authorization
    const returnRequest = await storage.getReturnRequestById(returnRequestId);
    if (!returnRequest) {
      throw new Error("Return request not found");
    }

    // Only seller or admin can complete
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const isAuthorized =
      returnRequest.sellerId === userId ||
      user.role === "admin" ||
      user.isCoAdmin;

    if (!isAuthorized) {
      throw new Error("Access denied");
    }

    // Check if status is appropriate
    const validCompletionStatuses = [
      "refund_processed",
      "replacement_in_transit",
    ];

    if (!validCompletionStatuses.includes(returnRequest.status)) {
      throw new Error(
        `Return request must be in one of these statuses to complete: ${validCompletionStatuses.join(", ")}`
      );
    }

    // Update the return request
    const updatedReturn = await storage.updateReturnRequest(returnRequestId, {
      status: "completed",
      completedAt: new Date(),
    });

    // Add status history entry
    await storage.createReturnStatusHistory({
      returnRequestId,
      newStatus: "completed",
      changedById: userId,
      notes: "Return process completed",
    });

    // Notify the buyer
    const buyer = await storage.getUser(returnRequest.buyerId);
    if (buyer) {
      // Send email notification
      if (buyer.email) {
        await emailService.sendReturnCompletedEmail(
          { ...returnRequest },
          buyer.email
        );
      }

      // In-app notification
      await storage.createNotification({
        userId: buyer.id,
        type: "return_completed",
        title: "Return Completed",
        message: `Your return request #${returnRequestId} has been completed`,
        metadata: {
          returnRequestId,
        },
        read: false,
      });

      // WebSocket notification if buyer is online
      await sendNotificationToUser(buyer.id, {
        type: "return_completed",
        title: "Return Completed",
        message: `Your return request #${returnRequestId} has been completed`,
        metadata: {
          returnRequestId,
        },
        read: false,
      });
    }

    // Update the order item status
    const orderItem = await storage.getOrderItemById(returnRequest.orderItemId);
    if (orderItem) {
      const status =
        returnRequest.requestType === "replacement" ? "replaced" : "returned";
      await storage.updateOrderItem(orderItem.id, {
        status,
        updatedAt: new Date(),
      });
    }

    return updatedReturn;
  } catch (error) {
    console.error("Error completing return request:", error);
    throw error;
  }
}
