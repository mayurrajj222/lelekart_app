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
export async function handleOrderStatusChange(
  orderId: number,
  status: string
) {
  try {
    console.log(`Handling order status change for order #${orderId} to ${status}`);
    
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
    
    // Process wallet refunds for cancellations
    if (status === 'cancelled' && order.walletCoinsUsed && order.walletCoinsUsed > 0) {
      console.log(`Processing wallet refund for order #${orderId}, coins used: ${order.walletCoinsUsed}`);
      
      try {
        // Refund coins to wallet
        const wallet = await storage.getWalletByUserId(order.userId);
        
        if (wallet) {
          const updatedWallet = await storage.adjustWallet(
            order.userId, 
            order.walletCoinsUsed, 
            'refund',
            `Refund for cancelled order #${orderId}`
          );
          
          console.log(`Refunded ${order.walletCoinsUsed} coins to wallet ID #${wallet.id}, new balance: ${updatedWallet.balance}`);
        } else {
          console.log(`No wallet found for user ID #${order.userId}, skipping wallet refund`);
        }
      } catch (walletError) {
        console.error(`Error processing wallet refund for order #${orderId}:`, walletError);
        // Continue with order cancellation even if wallet refund fails
      }
    }
    
    // Update the order status
    console.log(`Current order status: ${order.status}, Next status: ${status}`);
    let updatedOrder;
    try {
      updatedOrder = await storage.updateOrderStatus(orderId, status);
    } catch (err) {
      console.error('Error updating order status:', err);
      throw new Error('Order status update failed: ' + (err && err.message ? err.message : err));
    }
    console.log(`Updated order #${orderId} status to ${status}`);
    
    // After notifying buyer and seller, notify all admins
    const adminUsers = await storage.getAllAdminUsers(false); // false = exclude co-admins
    for (const admin of adminUsers) {
      await storage.createNotification({
        userId: admin.id,
        type: "ORDER_STATUS",
        title: `Order #${orderId} ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Order #${orderId} status updated to ${status}.`,
        read: false,
        link: `/admin/orders/${orderId}`,
        metadata: JSON.stringify({ orderId, status })
      });
      await sendNotificationToUser(admin.id, {
        type: "ORDER_STATUS",
        title: `Order #${orderId} ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Order #${orderId} status updated to ${status}.`,
        read: false,
        link: `/admin/orders/${orderId}`,
        metadata: JSON.stringify({ orderId, status })
      });
    }
    
    // Custom logic for return-related statuses (approve_return, reject_return, process_return, completed_return)
    if (["approve_return", "reject_return", "process_return", "completed_return"].includes(status)) {
      // TODO: Add any custom business logic for these statuses if needed
    }
    
    // Always create a permanent notification for the buyer
    await storage.createNotification({
      userId: order.userId,
      type: "ORDER_STATUS",
      title: `Order #${orderId} ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your order #${orderId} status updated to ${status}.`,
      read: false,
      link: `/orders/${orderId}`,
      metadata: JSON.stringify({ orderId, status })
    });
    
    return updatedOrder;
  } catch (error) {
    console.error(`Error handling order status change for order #${orderId}:`, error);
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
    const orderItem = orderItems.find(item => item.id === orderItemId);
    
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
    const sellerOrder = sellerOrders.find(so => so.id === orderItem.sellerOrderId);
    
    if (!sellerOrder) {
      throw new Error("Seller order not found");
    }
    
    // Check if all items in the seller order have the same status
    const sellerOrderItems = orderItems.filter(item => item.sellerOrderId === sellerOrder.id);
    const allItemsHaveSameStatus = sellerOrderItems.every(item => item.status === status);
    
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
            sellerName: seller.username
          }
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
          metadata: JSON.stringify({ orderId, sellerOrderId: sellerOrder.id, status })
        });
        await sendNotificationToUser(seller.id, {
          type: "seller_order",
          title: notifTitle,
          message: notifMsg,
          read: false,
          link: `/seller/orders/${sellerOrder.id}`,
          metadata: JSON.stringify({ orderId, sellerOrderId: sellerOrder.id, status })
        });
      }
    }
    
    // Check if all seller orders have the same status
    const allSellerOrdersHaveSameStatus = sellerOrders.every(so => so.status === status);
    
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
            buyerName: buyer.username
          }
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
          metadata: JSON.stringify({ orderId, status })
        });
        // Always create a permanent notification for the buyer
        await storage.createNotification({
          userId: buyer.id,
          type: "ORDER_STATUS",
          title: `Order #${orderId} ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: `Your order #${orderId} has been ${status}.`,
          read: false,
          link: `/orders/${orderId}`,
          metadata: JSON.stringify({ orderId, status })
        });
      }
    }
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
}