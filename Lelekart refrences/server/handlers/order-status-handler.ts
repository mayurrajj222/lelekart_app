/**
 * Order Status Handler
 *
 * This file contains functions to update order statuses and handle related business logic.
 */

import { storage } from "../storage";
import { sendEmail } from "../services/email-service";
import { sendNotificationToUser } from "../websocket";

/**
 * Handle order status change, including related business logic like refunds
 * @param orderId The ID of the order to update
 * @param status The new status to set
 * @returns The updated order
 */
export async function handleOrderStatusChange(orderId: number, status: string) {
  try {
    console.log(
      `Handling order status change for order #${orderId} to ${status}`
    );

    // Get current order
    const order = await storage.getOrder(orderId);
    if (!order) {
      throw new Error(`Order #${orderId} not found`);
    }

    // If status is already the target status, just return the order
    if (order.status === status) {
      console.log(`Order #${orderId} is already in ${status} status`);
      return order;
    }

    // Update the order status first (fast path)
    console.log(
      `Current order status: ${order.status}, Next status: ${status}`
    );
    let updatedOrder;
    try {
      // Use fast update for common status transitions to improve performance
      const commonFastTransitions = [
        "delivered",
        "shipped",
        "processing",
        "confirmed",
      ];
      if (commonFastTransitions.includes(status)) {
        updatedOrder = await storage.fastUpdateOrderStatus(orderId, status);
      } else {
        updatedOrder = await storage.updateOrderStatus(orderId, status);
      }
    } catch (err) {
      console.error("Error updating order status:", err);
      throw new Error(
        "Order status update failed: " +
          (err && err.message ? err.message : err)
      );
    }
    console.log(`Updated order #${orderId} status to ${status}`);

    // Process wallet refunds for cancellations (async - don't block the response)
    if (
      status === "cancelled" &&
      order.walletCoinsUsed &&
      order.walletCoinsUsed > 0
    ) {
      console.log(
        `Processing wallet refund for order #${orderId}, coins used: ${order.walletCoinsUsed}`
      );

      // Process wallet refund asynchronously
      processWalletRefund(orderId, order.userId, order.walletCoinsUsed).catch(
        (walletError) => {
          console.error(
            `Error processing wallet refund for order #${orderId}:`,
            walletError
          );
        }
      );
    }

    // Send notifications asynchronously (don't block the response)
    sendNotificationsAsync(orderId, status, order.userId).catch((error) => {
      console.error(
        `Error sending notifications for order #${orderId}:`,
        error
      );
    });

    // Custom logic for return-related statuses (approve_return, reject_return, process_return, completed_return)
    if (
      [
        "approve_return",
        "reject_return",
        "process_return",
        "completed_return",
      ].includes(status)
    ) {
      // TODO: Add any custom business logic for these statuses if needed
    }

    return updatedOrder;
  } catch (error) {
    console.error(
      `Error handling order status change for order #${orderId}:`,
      error
    );
    throw error;
  }
}

/**
 * Process wallet refund asynchronously
 */
async function processWalletRefund(
  orderId: number,
  userId: number,
  coinsUsed: number
) {
  try {
    // Refund coins to wallet
    const wallet = await storage.getWalletByUserId(userId);

    if (wallet) {
      const updatedWallet = await storage.adjustWallet(
        userId,
        coinsUsed,
        "refund",
        `Refund for cancelled order #${orderId}`
      );

      console.log(
        `Refunded ${coinsUsed} coins to wallet ID #${wallet.id}, new balance: ${updatedWallet.balance}`
      );
    } else {
      console.log(
        `No wallet found for user ID #${userId}, skipping wallet refund`
      );
    }
  } catch (walletError) {
    console.error(
      `Error processing wallet refund for order #${orderId}:`,
      walletError
    );
    throw walletError;
  }
}

/**
 * Send notifications asynchronously
 */
async function sendNotificationsAsync(
  orderId: number,
  status: string,
  userId: number
) {
  try {
    // Get admin users and send notifications in parallel
    const adminUsers = await storage.getAllAdminUsers(false); // false = exclude co-admins

    // Create notification promises for all admins
    const adminNotificationPromises = adminUsers.map(async (admin) => {
      const notificationData = {
        userId: admin.id,
        type: "ORDER_STATUS",
        title: `Order #${orderId} ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Order #${orderId} status updated to ${status}.`,
        read: false,
        link: `/admin/orders/${orderId}`,
        metadata: JSON.stringify({ orderId, status }),
      };

      // Send both database notification and websocket notification in parallel
      return Promise.all([
        storage.createNotification(notificationData),
        sendNotificationToUser(admin.id, notificationData),
      ]);
    });

    // Wait for all admin notifications to complete
    await Promise.all(adminNotificationPromises);

    console.log(
      `Sent notifications to ${adminUsers.length} admin users for order #${orderId}`
    );
  } catch (error) {
    console.error(`Error sending notifications for order #${orderId}:`, error);
    throw error;
  }
}

/**
 * Update the status of a specific order item
 */
export async function updateOrderStatus(
  orderId: number,
  orderItemId: number,
  status: string
): Promise<void> {
  try {
    // Get the order item
    const orderItems = await storage.getOrderItems(orderId);
    const orderItem = orderItems.find((item) => item.id === orderItemId);

    if (!orderItem) {
      throw new Error("Order item not found");
    }

    // Update the order item status
    await storage.updateOrderItem(orderItemId, { status });

    // Get the order
    const order = await storage.getOrder(orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    // Get the seller order
    const sellerOrders = await storage.getSellerOrders(orderId);
    const sellerOrder = sellerOrders.find(
      (so) => so.id === orderItem.sellerOrderId
    );

    if (!sellerOrder) {
      throw new Error("Seller order not found");
    }

    // Check if all items in the seller order have the same status
    const sellerOrderItems = orderItems.filter(
      (item) => item.sellerOrderId === sellerOrder.id
    );
    const allItemsHaveSameStatus = sellerOrderItems.every(
      (item) => item.status === status
    );

    // If all items have the same status, update the seller order status
    if (allItemsHaveSameStatus) {
      await storage.updateSellerOrderStatus(sellerOrder.id, status);

      // Notify the seller
      const seller = await storage.getUser(sellerOrder.sellerId);

      if (seller && seller.email) {
        await sendEmail({
          to: seller.email,
          subject: `Order #${orderId} Status Update`,
          template: "order-status-updated",
          data: {
            orderId,
            sellerOrderId: sellerOrder.id,
            status,
            sellerName: seller.username,
          },
        });
      }
      // Permanent in-app notification for seller
      if (seller) {
        const notifTitle = `Order #${orderId} ${status.charAt(0).toUpperCase() + status.slice(1)}`;
        const notifMsg = `Order #${orderId} (Seller Order #${sellerOrder.id}) status updated to ${status}.`;
        await storage.createNotification({
          userId: seller.id,
          type: "seller_order",
          title: notifTitle,
          message: notifMsg,
          read: false,
          link: `/seller/orders/${sellerOrder.id}`,
          metadata: JSON.stringify({
            orderId,
            sellerOrderId: sellerOrder.id,
            status,
          }),
        });
        await sendNotificationToUser(seller.id, {
          type: "seller_order",
          title: notifTitle,
          message: notifMsg,
          read: false,
          link: `/seller/orders/${sellerOrder.id}`,
          metadata: JSON.stringify({
            orderId,
            sellerOrderId: sellerOrder.id,
            status,
          }),
        });
      }
    }

    // Check if all seller orders have the same status
    const allSellerOrdersHaveSameStatus = sellerOrders.every(
      (so) => so.status === status
    );

    // If all seller orders have the same status, update the main order status
    if (allSellerOrdersHaveSameStatus) {
      await storage.updateOrder(orderId, { status });

      // Notify the buyer
      const buyer = await storage.getUser(order.userId);

      if (buyer && buyer.email) {
        await sendEmail({
          to: buyer.email,
          subject: `Your Order #${orderId} Status Update`,
          template: "order-status-updated-buyer",
          data: {
            orderId,
            status,
            buyerName: buyer.username,
          },
        });
      }
      // Send notification to buyer
      if (buyer) {
        await sendNotificationToUser(buyer.id, {
          type: "ORDER_STATUS",
          title: `Order #${orderId} ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: `Your order #${orderId} has been ${status}.`,
          read: false,
          link: `/orders/${orderId}`,
          metadata: JSON.stringify({ orderId, status }),
        });
        // Note: Permanent notification is handled by the calling route to avoid duplicates
      }
    }
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
}
