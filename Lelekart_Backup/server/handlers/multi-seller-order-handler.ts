import { storage } from "../storage";
import { Order, OrderItem, InsertSellerOrder, InsertNotification } from "@shared/schema";
import { User } from "@shared/schema";
import * as emailService from "../services/email-service";
import * as smsService from "../services/sms-service";
import { sendNotificationToUser } from "../websocket";

/**
 * Process a multi-seller order by creating separate seller orders
 * and linking order items to the appropriate seller
 */
/**
 * Send in-app notifications to all admin users (including co-admins) about a new order
 */
async function notifyAdminsAboutOrder(order: any, buyer: User): Promise<void> {
  try {
    console.log(`Sending in-app notifications to admin users about order #${order.id}`);
    
    // Get all admin users (including co-admins)
    const adminUsers = await storage.getAllAdminUsers(true); // true = include co-admins
    
    if (!adminUsers || adminUsers.length === 0) {
      console.log('No admin users found to notify about the new order');
      return;
    }
    
    console.log(`Found ${adminUsers.length} admin users to notify about order #${order.id}`);
    
    // Get basic order details for the notification
    const orderItems = await storage.getOrderItems(order.id);
    const totalItems = orderItems.length;
    
    // Create notifications for each admin user
    for (const admin of adminUsers) {
      // Create an in-app notification for this admin
      const notification: InsertNotification = {
        userId: admin.id,
        type: "ORDER_STATUS",
        title: "New Order Received",
        message: `Order #${order.id} received from ${buyer.name || buyer.username || 'Customer'} for \u20b9${order.total}`,
        read: false,
        link: `/admin/orders/${order.id}`,
        metadata: JSON.stringify({
          orderId: order.id,
          buyerId: buyer.id,
          buyerName: buyer.name || buyer.username,
          total: order.total,
          itemCount: totalItems,
          date: new Date().toISOString()
        })
      };
      
      await storage.createNotification(notification);
      
      // Send real-time notification via WebSocket if the admin is online
      await sendNotificationToUser(admin.id, {
        type: "ORDER_STATUS",
        title: "New Order Received",
        message: `Order #${order.id} received from ${buyer.name || buyer.username || 'Customer'} for \u20b9${order.total}`,
        read: false,
        link: `/admin/orders/${order.id}`,
        metadata: JSON.stringify({
          orderId: order.id,
          buyerName: buyer.name || buyer.username,
          total: order.total,
          date: new Date().toISOString()
        })
      });
    }
    
    console.log(`Successfully sent in-app notifications to ${adminUsers.length} admin users about order #${order.id}`);
  } catch (error) {
    console.error(`Error notifying admins about order ${order.id}:`, error);
    // We don't want to fail the order process if notification fails
  }
}

export async function processMultiSellerOrder(orderId: number): Promise<void> {
  console.log(`Processing multi-seller order ${orderId}`);
  
  try {
    // Get the main order
    const order = await storage.getOrder(orderId);
    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }
    
    // Get all order items
    const orderItems = await storage.getOrderItems(orderId);
    if (!orderItems || orderItems.length === 0) {
      throw new Error(`No order items found for order ${orderId}`);
    }
    
    // Group items by seller
    const itemsBySeller: Record<number, (OrderItem & { product: any })[]> = {};
    
    for (const item of orderItems) {
      const sellerId = item.product.sellerId;
      if (!sellerId) {
        console.error(`Product ${item.productId} has no seller ID, skipping`);
        continue;
      }
      
      if (!itemsBySeller[sellerId]) {
        itemsBySeller[sellerId] = [];
      }
      
      itemsBySeller[sellerId].push(item);
    }
    
    console.log(`Order ${orderId} has items from ${Object.keys(itemsBySeller).length} sellers`);
    
    // Get the buyer information for notification purposes
    const buyer = await storage.getUser(order.userId);
    if (!buyer) {
      throw new Error(`Buyer with ID ${order.userId} not found`);
    }
    
    // Send in-app notifications to all admin users (including co-admins) about this new order
    await notifyAdminsAboutOrder(order, buyer);
    console.log('Admin notifications created for order placement');
    // Send notification to buyer about order placed (permanent + real-time)
    await sendNotificationToUser(buyer.id, {
      type: "ORDER_STATUS",
      title: `Order Placed Successfully`,
      message: `Your order #${order.id} has been placed successfully!`,
      read: false,
      link: `/orders/${order.id}`,
      metadata: JSON.stringify({ orderId: order.id, status: order.status })
    });
    
    // Create a seller order for each seller
    for (const sellerId in itemsBySeller) {
      const sellerItems = itemsBySeller[sellerId];
      
      // Calculate subtotal for this seller's items
      const subtotal = sellerItems.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);
      
      // Sum delivery charges for this seller's items
      const deliveryCharge = sellerItems.reduce((total, item) => {
        const charge = item.product.deliveryCharges ?? 0;
        return total + (charge * item.quantity);
      }, 0);
      
      console.log(`Free delivery applied for seller ${sellerId} order items`);
      
      // Create seller order
      const sellerOrderData: InsertSellerOrder = {
        orderId: orderId,
        sellerId: parseInt(sellerId),
        subtotal: subtotal,
        deliveryCharge: deliveryCharge,
        status: order.status,
      };
      
      // Create the seller order record
      const sellerOrder = await storage.createSellerOrder(sellerOrderData);
      console.log(`Created seller order ${sellerOrder.id} for seller ${sellerId} on main order ${orderId}`);
      
      // Update the order items to link them to this seller order
      for (const item of sellerItems) {
        await storage.updateOrderItem(item.id, {
          sellerOrderId: sellerOrder.id
        });
      }
      
      // Notify the seller about their order
      await notifySellerAboutOrder(sellerOrder.id, parseInt(sellerId), buyer);
      console.log(`Seller notification created for sellerId ${sellerId} and orderId ${sellerOrder.id}`);
      
      // Update stock levels for this seller's items
      for (const item of sellerItems) {
        try {
          await updateProductStock(item);
        } catch (stockError) {
          console.error(`Error updating stock for item ${item.id}:`, stockError);
          // Continue processing other items even if stock update fails for one
        }
      }
    }
    
    // Update main order total to include all delivery charges and subtract ALL discounts from the sum of items and delivery charges
    const allOrderItems = await storage.getOrderItems(orderId);
    const allDeliveryCharges = allOrderItems.reduce((total, item) => {
      const charge = item.product.deliveryCharges ?? 0;
      return total + (charge * item.quantity);
    }, 0);
    const allSubtotal = allOrderItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
    // Fetch the order to get all discounts
    const mainOrder = await storage.getOrder(orderId);
    const walletDiscount = mainOrder?.walletDiscount || 0;
    const redeemDiscount = mainOrder?.redeemDiscount || 0;
    const rewardDiscount = mainOrder?.rewardDiscount || 0;
    const newTotal = allSubtotal + allDeliveryCharges - walletDiscount - redeemDiscount - rewardDiscount;
    await storage.updateOrder(orderId, { total: newTotal });
    
    console.log(`Multi-seller order ${orderId} processed successfully`);
  } catch (error) {
    console.error(`Error processing multi-seller order ${orderId}:`, error);
    throw error;
  }
}

/**
 * Update product stock levels after an order is placed
 */
async function updateProductStock(orderItem: OrderItem & { product: any }): Promise<void> {
  try {
    // Determine if we need to update variant stock or product stock
    const variantId = (orderItem as any).variant_id ?? (orderItem as any).variantId;
    if (variantId) {
      // Get the current variant
      const variant = await storage.getProductVariant(variantId);
      if (!variant) {
        throw new Error(`Variant ${variantId} not found`);
      }
      
      // If variant has its own stock tracking
      if (variant.stock !== null && variant.stock !== undefined) {
        // Calculate new stock level
        const newStock = Math.max(0, variant.stock - orderItem.quantity);
        
        // Update variant stock
        await storage.updateProductVariantStock(variantId, newStock);
        console.log(`Updated variant ${variantId} stock from ${variant.stock} to ${newStock}`);
        
        return;
      }
    }
    
    // If no variant stock, update the main product stock
    const product = await storage.getProduct(orderItem.productId);
    if (!product) {
      throw new Error(`Product ${orderItem.productId} not found`);
    }
    
    // Calculate new stock level
    const newStock = Math.max(0, product.stock - orderItem.quantity);
    
    // Update product stock
    await storage.updateProductStock(orderItem.productId, newStock);
    console.log(`Updated product ${orderItem.productId} stock from ${product.stock} to ${newStock}`);
  } catch (error) {
    console.error(`Error updating stock for order item:`, error);
    throw error;
  }
}

/**
 * Send notification to a seller about a new order
 */
async function notifySellerAboutOrder(sellerOrderId: number, sellerId: number, buyer: User): Promise<void> {
  try {
    // Get the seller order
    const sellerOrder = await storage.getSellerOrderById(sellerOrderId);
    if (!sellerOrder) {
      throw new Error(`Seller order with ID ${sellerOrderId} not found`);
    }
    
    // Get the main order
    const mainOrder = await storage.getOrder(sellerOrder.orderId);
    if (!mainOrder) {
      throw new Error(`Main order with ID ${sellerOrder.orderId} not found`);
    }
    
    // Get the seller
    const seller = await storage.getUser(sellerId);
    if (!seller) {
      throw new Error(`Seller with ID ${sellerId} not found`);
    }
    
    // Get only this seller's items from the order
    const orderItems = await storage.getOrderItemsBySellerOrderId(sellerOrderId);
    
    // Create in-app notification for seller (permanent + real-time)
    await storage.createNotification({
      userId: sellerId,
      type: "ORDER_STATUS",
      title: "New Order Received",
      message: `You have received a new order #${mainOrder.id}-${sellerOrderId}`,
      link: `/seller/orders/${sellerOrderId}`,
      read: false,
      metadata: JSON.stringify({
        mainOrderId: mainOrder.id,
        sellerOrderId: sellerOrderId,
        itemCount: orderItems.length,
        total: sellerOrder.subtotal + sellerOrder.deliveryCharge
      })
    });
    await sendNotificationToUser(sellerId, {
      type: "ORDER_STATUS",
      title: "New Order Received",
      message: `You have received a new order #${mainOrder.id}-${sellerOrderId}`,
      read: false,
      link: `/seller/orders/${sellerOrderId}`,
      metadata: JSON.stringify({
        mainOrderId: mainOrder.id,
        sellerOrderId: sellerOrderId,
        itemCount: orderItems.length,
        total: sellerOrder.subtotal + sellerOrder.deliveryCharge
      })
    });
    
    // If email service is configured, send email notification
    if (emailService.isEmailConfigured()) {
      // Send email to seller with only their products from the order
      await emailService.sendSellerOrderNotification(
        sellerOrderId,
        mainOrder.id,
        sellerId,
        buyer
      );
    }
    
    console.log(`Notification sent to seller ${sellerId} for order ${sellerOrderId}`);
  } catch (error) {
    console.error(`Error notifying seller ${sellerId} about order ${sellerOrderId}:`, error);
  }
}

/**
 * Get a single seller order with related data
 */
export async function getSellerOrderWithDetails(sellerOrderId: number): Promise<any> {
  const sellerOrder = await storage.getSellerOrderById(sellerOrderId);
  if (!sellerOrder) {
    throw new Error(`Seller order with ID ${sellerOrderId} not found`);
  }
  
  const mainOrder = await storage.getOrder(sellerOrder.orderId);
  if (!mainOrder) {
    throw new Error(`Main order with ID ${sellerOrder.orderId} not found`);
  }
  
  const orderItems = await storage.getOrderItemsBySellerOrderId(sellerOrderId);
  const buyer = await storage.getUser(mainOrder.userId);
  
  let shippingDetails = {};
  try {
    if (mainOrder.shippingDetails) {
      shippingDetails = JSON.parse(mainOrder.shippingDetails);
    }
  } catch (e) {
    console.error("Error parsing shipping details", e);
  }
  
  return {
    id: sellerOrder.id,
    mainOrderId: mainOrder.id,
    date: mainOrder.date,
    status: sellerOrder.status,
    subtotal: sellerOrder.subtotal,
    deliveryCharge: sellerOrder.deliveryCharge,
    total: sellerOrder.subtotal + sellerOrder.deliveryCharge,
    items: orderItems,
    buyer: {
      id: buyer?.id,
      name: buyer?.name || buyer?.username,
      email: buyer?.email,
      phone: (shippingDetails as any)?.phone || '',
    },
    shipping: {
      address: (shippingDetails as any)?.address || '',
      city: (shippingDetails as any)?.city || '',
      state: (shippingDetails as any)?.state || '',
      zipCode: (shippingDetails as any)?.zipCode || '',
      country: (shippingDetails as any)?.country || "India",
    }
  };
}