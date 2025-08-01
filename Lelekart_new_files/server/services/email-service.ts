/**
 * Email Service
 *
 * This file contains functions for sending emails using templates.
 */

import nodemailer from "nodemailer";
import * as templateService from "./template-service";
import { JSDOM } from "jsdom";
import { generatePdf } from "./pdf-generator";
import { generatePdfBuffer } from "./pdf-generator";
import dotenv from "dotenv";

// Email configuration
// Environment variables for email configuration
const EMAIL_HOST = process.env.EMAIL_HOST || "";
const EMAIL_PORT = process.env.EMAIL_PORT
  ? parseInt(process.env.EMAIL_PORT)
  : 587;
const EMAIL_USER = process.env.EMAIL_USER || "";
const EMAIL_PASS = process.env.EMAIL_PASS || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "verification@lelekart.com";

// Log email configuration (without exposing password)
console.log(
  `Email configuration: HOST=${EMAIL_HOST}, PORT=${EMAIL_PORT}, USER=${EMAIL_USER}, FROM=${EMAIL_FROM}`
);

// Create a transporter
export const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465, // true for 465, false for other ports
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

/**
 * Check if email service is properly configured
 */
export function isEmailConfigured(): boolean {
  return !!(
    process.env.EMAIL_HOST &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS &&
    process.env.EMAIL_FROM
  );
}

// Email Templates
export const EMAIL_TEMPLATES = {
  ORDER_CONFIRMATION: "order-confirmation",
  ORDER_SHIPPED: "order-shipped",
  ORDER_DELIVERED: "order-delivered",
  ORDER_CANCELLED: "order-cancelled",
  ORDER_REFUNDED: "order-refunded",
  RETURN_REQUESTED: "return-requested",
  RETURN_APPROVED: "return-approved",
  RETURN_REJECTED: "return-rejected",
  RETURN_ITEM_RECEIVED: "return-item-received",
  RETURN_COMPLETED: "return-completed",
  REPLACEMENT_SHIPPED: "replacement-shipped",
  REFUND_INITIATED: "refund-initiated",
  REFUND_PROCESSED: "refund-processed",
  SELLER_ORDER_NOTIFICATION: "seller-order-notification",
  PASSWORD_RESET: "password-reset",
  ACCOUNT_VERIFICATION: "account-verification",
  SELLER_APPROVAL: "seller-approval",
  SELLER_REJECTION: "seller-rejection",
  ADMIN_NOTIFICATION: "admin-notification",
  SUPPORT_TICKET: "support-ticket",
  CAREER_APPLICATION: "career-application",
  WALLET_USED: "wallet-used",
  REDEEM_USED: "redeem-used",
};

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data?: any;
  attachments?: any[];
  cc?: string[];
  bcc?: string[];
}

/**
 * Send an email using a template
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (!options.to) {
      console.error("Email recipient not specified");
      return false;
    }

    // Get default template HTML for this template type
    let templateHtml = getDefaultTemplate(options.template);

    // Render template with data
    const html = await templateService.renderTemplate(
      templateHtml,
      options.data || {}
    );

    // Create email options
    const mailOptions: any = {
      from: EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html,
    };

    // Add CC and BCC if provided
    if (options.cc && options.cc.length) {
      mailOptions.cc = options.cc;
    }

    if (options.bcc && options.bcc.length) {
      mailOptions.bcc = options.bcc;
    }

    // Add attachments if provided
    if (options.attachments && options.attachments.length) {
      mailOptions.attachments = options.attachments;
    }

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);

    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

/**
 * Send an order confirmation email
 */
export async function sendOrderConfirmationEmail(
  order: any,
  email: string
): Promise<boolean> {
  try {
    // Calculate subtotal and delivery charges if not present
    let subtotal = order.subtotal;
    let deliveryCharges = order.deliveryCharges;
    if (typeof subtotal !== 'number' || typeof deliveryCharges !== 'number') {
      // Calculate from items if missing
      subtotal = Array.isArray(order.items)
        ? order.items.reduce((sum: any, item: any) => sum + (item.price * item.quantity), 0)
        : 0;
      deliveryCharges = Array.isArray(order.items)
        ? order.items.reduce((sum: any, item: any) => sum + ((item.product?.deliveryCharges ?? 0) * item.quantity), 0)
        : 0;
    }
    // Attach to order object for template
    order.subtotal = subtotal;
    order.deliveryCharges = deliveryCharges;
    // Calculate total for email (must match order creation logic)
    const walletDiscount = Number(order.walletDiscount) || 0;
    const rewardDiscount = Number(order.rewardDiscount) || 0;
    const redeemDiscount = Number(order.redeemDiscount) || 0;
    order.total = subtotal + deliveryCharges - walletDiscount - rewardDiscount - redeemDiscount;
    if (order.total < 0) order.total = 0;

    let emailOptions = {
      to: email,
      subject: `Order Confirmation: #${order.id}`,
      template: EMAIL_TEMPLATES.ORDER_CONFIRMATION,
      data: {
        order,
        date: new Date().toLocaleDateString(),
        orderLink: `${process.env.SITE_URL}/orders/${order.id}`,
        shippingDetails: order.shippingDetails || order.shipping_details || order.shipping_address || {},
      },
      attachments: [] as any[],
    };

    try {
      return await sendEmail(emailOptions);
    } catch (templateError) {
      console.error("Error rendering order confirmation template, sending fallback plain text email:", templateError);
      // Fallback: send plain text email
      try {
        await transporter.sendMail({
          from: EMAIL_FROM,
          to: email,
          subject: `Order Confirmation: #${order.id}`,
          text: `Your order #${order.id} has been placed successfully.\nOrder total: ₹${order.total}.\nThank you for shopping with us!`,
        });
        return true;
      } catch (fallbackError) {
        console.error("Error sending fallback plain text order confirmation email:", fallbackError);
        return false;
      }
    }
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
    return false;
  }
}

/**
 * Send a return request confirmation email
 */
export async function sendReturnRequestEmail(
  returnRequest: any,
  email: string
): Promise<boolean> {
  try {
    return await sendEmail({
      to: email,
      subject: `Return Request Confirmation: #${returnRequest.id}`,
      template: EMAIL_TEMPLATES.RETURN_REQUESTED,
      data: {
        returnRequest,
        date: new Date().toLocaleDateString(),
        returnLink: `${process.env.SITE_URL}/returns/${returnRequest.id}`,
      },
    });
  } catch (error) {
    console.error("Error sending return request email:", error);
    return false;
  }
}

/**
 * Send a return approval email
 */
export async function sendReturnApprovalEmail(
  returnRequest: any,
  email: string
): Promise<boolean> {
  try {
    return await sendEmail({
      to: email,
      subject: `Return Request Approved: #${returnRequest.id}`,
      template: EMAIL_TEMPLATES.RETURN_APPROVED,
      data: {
        returnRequest,
        date: new Date().toLocaleDateString(),
        returnLink: `${process.env.SITE_URL}/returns/${returnRequest.id}`,
      },
    });
  } catch (error) {
    console.error("Error sending return approval email:", error);
    return false;
  }
}

/**
 * Send a return rejection email
 */
export async function sendReturnRejectionEmail(
  returnRequest: any,
  email: string,
  reason: string
): Promise<boolean> {
  try {
    return await sendEmail({
      to: email,
      subject: `Return Request Rejected: #${returnRequest.id}`,
      template: EMAIL_TEMPLATES.RETURN_REJECTED,
      data: {
        returnRequest,
        reason,
        date: new Date().toLocaleDateString(),
        returnLink: `${process.env.SITE_URL}/returns/${returnRequest.id}`,
      },
    });
  } catch (error) {
    console.error("Error sending return rejection email:", error);
    return false;
  }
}

/**
 * Send a return item received email
 */
export async function sendReturnItemReceivedEmail(
  returnRequest: any,
  email: string
): Promise<boolean> {
  try {
    return await sendEmail({
      to: email,
      subject: `Return Item Received: #${returnRequest.id}`,
      template: EMAIL_TEMPLATES.RETURN_ITEM_RECEIVED,
      data: {
        returnRequest,
        date: new Date().toLocaleDateString(),
        returnLink: `${process.env.SITE_URL}/returns/${returnRequest.id}`,
      },
    });
  } catch (error) {
    console.error("Error sending return item received email:", error);
    return false;
  }
}

/**
 * Send a replacement shipped email
 */
export async function sendReplacementShippedEmail(
  returnRequest: any,
  email: string
): Promise<boolean> {
  try {
    return await sendEmail({
      to: email,
      subject: `Replacement Shipped: #${returnRequest.id}`,
      template: EMAIL_TEMPLATES.REPLACEMENT_SHIPPED,
      data: {
        returnRequest,
        date: new Date().toLocaleDateString(),
        returnLink: `${process.env.SITE_URL}/returns/${returnRequest.id}`,
        trackingNumber: returnRequest.replacementTrackingNumber,
        courierName: returnRequest.replacementCourierName,
      },
    });
  } catch (error) {
    console.error("Error sending replacement shipped email:", error);
    return false;
  }
}

/**
 * Send a refund initiated email
 */
export async function sendRefundInitiatedEmail(
  returnRequest: any,
  email: string
): Promise<boolean> {
  try {
    return await sendEmail({
      to: email,
      subject: `Refund Initiated: #${returnRequest.id}`,
      template: EMAIL_TEMPLATES.REFUND_INITIATED,
      data: {
        returnRequest,
        date: new Date().toLocaleDateString(),
        returnLink: `${process.env.SITE_URL}/returns/${returnRequest.id}`,
        amount: returnRequest.refundAmount,
      },
    });
  } catch (error) {
    console.error("Error sending refund initiated email:", error);
    return false;
  }
}

/**
 * Send a refund processed email
 */
export async function sendRefundProcessedEmail(
  returnRequest: any,
  email: string
): Promise<boolean> {
  try {
    return await sendEmail({
      to: email,
      subject: `Refund Processed: #${returnRequest.id}`,
      template: EMAIL_TEMPLATES.REFUND_PROCESSED,
      data: {
        returnRequest,
        date: new Date().toLocaleDateString(),
        returnLink: `${process.env.SITE_URL}/returns/${returnRequest.id}`,
        amount: returnRequest.refundAmount,
        refundMethod: returnRequest.refundMethod,
      },
    });
  } catch (error) {
    console.error("Error sending refund processed email:", error);
    return false;
  }
}

/**
 * Send a return completed email
 */
export async function sendReturnCompletedEmail(
  returnRequest: any,
  email: string
): Promise<boolean> {
  try {
    return await sendEmail({
      to: email,
      subject: `Return Completed: #${returnRequest.id}`,
      template: EMAIL_TEMPLATES.RETURN_COMPLETED,
      data: {
        returnRequest,
        date: new Date().toLocaleDateString(),
        returnLink: `${process.env.SITE_URL}/returns/${returnRequest.id}`,
      },
    });
  } catch (error) {
    console.error("Error sending return completed email:", error);
    return false;
  }
}

/**
 * Send notification email to a specific seller about their portion of an order
 * This function is called directly for each seller who has items in the order
 */
export async function sendSellerOrderNotification(
  sellerOrderId: number,
  mainOrderId: number,
  sellerId: number,
  buyer: any
): Promise<boolean> {
  try {
    console.log(
      `Sending order notification email to seller ${sellerId} for order ${mainOrderId} (seller order ${sellerOrderId})`
    );

    // Import storage here to avoid circular dependencies
    const { storage } = await import("../storage");

    // Get the seller order
    const sellerOrder = await storage.getSellerOrderById(sellerOrderId);
    if (!sellerOrder) {
      console.error(
        `Cannot send seller notification: Seller order #${sellerOrderId} not found`
      );
      return false;
    }

    // Get the main order
    const order = await storage.getOrder(mainOrderId);
    if (!order) {
      console.error(
        `Cannot send seller notification: Main order #${mainOrderId} not found`
      );
      return false;
    }

    // Get the seller
    const seller = await storage.getUser(sellerId);
    if (!seller || !seller.email) {
      console.error(
        `Cannot send seller notification: Seller #${sellerId} not found or has no email`
      );
      return false;
    }

    // Get only this seller's items from the order
    const orderItems =
      await storage.getOrderItemsBySellerOrderId(sellerOrderId);

    // Send email to seller
    await sendEmail({
      to: seller.email,
      subject: `New Order #${mainOrderId} Received`,
      template: EMAIL_TEMPLATES.SELLER_ORDER_NOTIFICATION,
      data: {
        order,
        sellerOrder,
        sellerName: seller.name || seller.username,
        orderItems,
        date: new Date().toLocaleDateString(),
        orderLink: `${process.env.SITE_URL}/seller/orders/${sellerOrderId}`,
      },
    });

    console.log(`Order notification email sent to seller: ${seller.email}`);
    return true;
  } catch (error) {
    console.error(`Error sending seller order notification:`, error);
    return false;
  }
}

/**
 * Send order cancelled emails to both buyer and seller
 */
export async function sendOrderCancelledEmails(
  orderId: number
): Promise<boolean> {
  try {
    console.log(`Sending order cancelled emails for order #${orderId}`);

    // Import storage here to avoid circular dependencies
    const { storage } = await import("../storage");

    // Get the order
    const order = await storage.getOrder(orderId);
    if (!order) {
      console.error(
        `Cannot send cancellation emails: Order #${orderId} not found`
      );
      return false;
    }

    // Get the buyer
    const buyer = await storage.getUser(order.userId);
    if (!buyer || !buyer.email) {
      console.error(
        `Cannot send buyer cancellation email: Buyer for order #${orderId} not found or has no email`
      );
    } else {
      // Send email to buyer
      await sendEmail({
        to: buyer.email,
        subject: `Your Order #${orderId} Has Been Cancelled`,
        template: EMAIL_TEMPLATES.ORDER_CANCELLED,
        data: {
          order,
          buyerName: buyer.name || buyer.username,
          date: new Date().toLocaleDateString(),
          orderLink: `${process.env.SITE_URL}/orders/${orderId}`,
        },
      });
      console.log(`Cancellation email sent to buyer: ${buyer.email}`);
    }

    // Get all seller orders and send emails to each seller
    const sellerOrders = await storage.getSellerOrders(orderId);

    for (const sellerOrder of sellerOrders) {
      const seller = await storage.getUser(sellerOrder.sellerId);

      if (!seller || !seller.email) {
        console.error(
          `Cannot send seller cancellation email: Seller #${sellerOrder.sellerId} not found or has no email`
        );
        continue;
      }

      // Send email to seller
      await sendEmail({
        to: seller.email,
        subject: `Order #${orderId} Has Been Cancelled`,
        template: EMAIL_TEMPLATES.ORDER_CANCELLED,
        data: {
          order,
          sellerOrder,
          sellerName: seller.name || seller.username,
          date: new Date().toLocaleDateString(),
          orderLink: `${process.env.SITE_URL}/seller/orders/${sellerOrder.id}`,
        },
      });
      console.log(`Cancellation email sent to seller: ${seller.email}`);
    }

    return true;
  } catch (error) {
    console.error(`Error sending order cancelled emails:`, error);
    return false;
  }
}

/**
 * Send order shipped emails to the buyer
 */
export async function sendOrderShippedEmails(
  orderId: number
): Promise<boolean> {
  try {
    console.log(`Sending order shipped emails for order #${orderId}`);

    // Import storage here to avoid circular dependencies
    const { storage } = await import("../storage");

    // Get the order
    const order = await storage.getOrder(orderId);
    if (!order) {
      console.error(`Cannot send shipped emails: Order #${orderId} not found`);
      return false;
    }

    // Get the buyer
    const buyer = await storage.getUser(order.userId);
    if (!buyer || !buyer.email) {
      console.error(
        `Cannot send buyer shipped email: Buyer for order #${orderId} not found or has no email`
      );
      return false;
    }

    // Send email to buyer
    await sendEmail({
      to: buyer.email,
      subject: `Your Order #${orderId} Has Been Shipped`,
      template: EMAIL_TEMPLATES.ORDER_SHIPPED,
      data: {
        order,
        buyerName: buyer.name || buyer.username,
        date: new Date().toLocaleDateString(),
        orderLink: `${process.env.SITE_URL}/orders/${orderId}`,
        trackingNumber: (order as any).trackingNumber || "Not available",
        courierName: (order as any).courierName || "Not specified",
      },
    });
    console.log(`Shipped email sent to buyer: ${buyer.email}`);

    return true;
  } catch (error) {
    console.error(`Error sending order shipped emails:`, error);
    return false;
  }
}

/**
 * Send order placed emails to buyers and admins
 *
 * Note: Seller notifications are sent individually during order processing
 * through the sendSellerOrderNotification() function called from notifySellerAboutOrder()
 */
export async function sendOrderPlacedEmails(orderId: number): Promise<boolean> {
  try {
    console.log(`[EMAIL DEBUG] Sending order confirmation emails for order #${orderId}`);

    // Import storage here to avoid circular dependencies
    const { storage } = await import("../storage");

    // Get the complete order with items and products
    const order = await storage.getOrder(orderId);
    if (!order) {
      console.error(`[EMAIL DEBUG] Cannot send order confirmation emails: Order #${orderId} not found`);
      return false;
    }

    // Get order items with product details
    const orderItems = await storage.getOrderItems(orderId);
    const completeOrder = { ...order, items: orderItems };

    // Get order shipping details
    let shippingDetails = {};
    try {
      if (order.shippingDetails) {
        shippingDetails =
          typeof order.shippingDetails === "string"
            ? JSON.parse(order.shippingDetails)
            : order.shippingDetails;
      } else if (order.addressId) {
        // Fetch address from DB if shippingDetails is empty but addressId exists
        try {
          const address = await storage.getUserAddress(order.addressId);
          if (address) {
            shippingDetails = {
              name: address.fullName || address.addressName || "",
              address: address.address || "",
              city: address.city || "",
              state: address.state || "",
              zipCode: address.pincode || "",
              country: "India",
              phone: address.phone || "",
            };
          }
        } catch (addressError) {
          console.error("[EMAIL DEBUG] Error fetching address for order email:", addressError);
        }
      }
    } catch (e) {
      console.error("[EMAIL DEBUG] Error parsing shipping details", e);
    }

    // Get the buyer
    const buyer = await storage.getUser(order.userId);
    if (!buyer || !buyer.email) {
      console.error(`[EMAIL DEBUG] Cannot send buyer order confirmation email: Buyer for order #${orderId} not found or has no email. User object:`, buyer);
      // Fallback: Optionally notify admin or log for manual follow-up
      try {
        const adminEmailsSetting = await storage.getSystemSetting("adminNotificationEmails");
        const adminEmails = adminEmailsSetting?.value ? JSON.parse(adminEmailsSetting.value) : [];
        if (adminEmails.length > 0) {
          for (const adminEmail of adminEmails) {
            await sendEmail({
              to: adminEmail,
              subject: `Order #${orderId} placed but buyer email missing`,
              template: EMAIL_TEMPLATES.ADMIN_NOTIFICATION,
              data: {
                order: completeOrder,
                buyerInfo: buyer || { id: order.userId, name: "Unknown", email: "Missing" },
                note: "Buyer email missing, could not send confirmation to buyer.",
                date: new Date().toLocaleDateString(),
                orderLink: `${process.env.SITE_URL}/admin/orders/${orderId}`,
              },
            });
          }
        }
      } catch (fallbackError) {
        console.error(`[EMAIL DEBUG] Fallback admin notification failed:`, fallbackError);
      }
      return false;
    } else {
      console.log(`[EMAIL DEBUG] Sending order confirmation email to buyer: ${buyer.email} for order #${orderId}`);
      // Send detailed email to buyer
      try {
        await sendOrderConfirmationEmail(
          {
            ...completeOrder,
            buyerName: buyer.name || buyer.username,
            shippingDetails,
          },
          buyer.email
        );
        console.log(`[EMAIL DEBUG] Order confirmation email sent to buyer: ${buyer.email}`);
      } catch (buyerEmailError) {
        console.error(`[EMAIL DEBUG] Failed to send order confirmation email to buyer: ${buyer.email}`, buyerEmailError);
      }
    }

    // Send notification to admin(s) if configured
    try {
      // Check if we should notify admins about new orders
      const notifyAdminsSetting = await storage.getSystemSetting(
        "notifyAdminsOnNewOrder"
      );
      const adminEmailsSetting = await storage.getSystemSetting(
        "adminNotificationEmails"
      );

      const notifyAdmins = notifyAdminsSetting?.value === "true";
      const adminEmails = adminEmailsSetting?.value
        ? JSON.parse(adminEmailsSetting.value)
        : [];

      if (notifyAdmins && adminEmails && adminEmails.length > 0) {
        // For admin, we send a different email template with additional information
        const sellerOrders = await storage.getSellerOrdersByOrderId(orderId);

        // Get seller information for this order
        const sellerInfo = await Promise.all(
          sellerOrders.map(async (sellerOrder) => {
            try {
              const seller = await storage.getUser(sellerOrder.sellerId);
              return {
                id: seller?.id,
                name: seller?.name || seller?.username || "Unknown Seller",
                email: seller?.email || "Not available",
                phone: seller?.phone || "Not provided",
                sellerOrderId: sellerOrder.id,
                subtotal: sellerOrder.subtotal,
                status: sellerOrder.status || "pending",
              };
            } catch (error) {
              console.error(
                `Error getting seller info for seller ID ${sellerOrder.sellerId}:`,
                error
              );
              return {
                id: sellerOrder.sellerId,
                name: "Unknown Seller",
                email: "Not available",
                phone: "Not available",
                sellerOrderId: sellerOrder.id,
                subtotal: sellerOrder.subtotal,
                status: sellerOrder.status || "pending",
              };
            }
          })
        );

        // Send admin notification email
        for (const adminEmail of adminEmails) {
          await sendEmail({
            to: adminEmail,
            subject: `New Order Notification: Order #${orderId}`,
            template: EMAIL_TEMPLATES.ADMIN_NOTIFICATION,
            data: {
              order: completeOrder,
              buyerInfo: {
                id: buyer.id,
                name: buyer.name || buyer.username || "Unknown Buyer",
                email: buyer.email || "Not available",
                phone: ((buyer as any).phone || (shippingDetails as any)?.phone || "Not provided"),
              },
              sellerInfo,
              date: new Date().toLocaleDateString(),
              orderLink: `${process.env.SITE_URL}/admin/orders/${orderId}`,
            },
          });
          console.log(`Order notification email sent to admin: ${adminEmail}`);
        }
      }
    } catch (adminEmailError) {
      console.error(`Error sending admin notification email:`, adminEmailError);
      // Continue with the process even if admin email fails
    }

    // NOTE: We do NOT send emails to sellers here!
    // Seller notifications are sent individually in the notifySellerAboutOrder() function
    // during order processing to ensure each seller only gets notifications for their own items

    return true;
  } catch (error) {
    console.error(`Error sending order confirmation emails:`, error);
    return false;
  }
}

/**
 * Get default template content for a specific template type
 */
function getDefaultTemplate(templateType: string): string {
  // In a real-world application, these would be loaded from a database
  // or from HTML files on disk
  switch (templateType) {
    case EMAIL_TEMPLATES.ORDER_CONFIRMATION:
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #333; margin-bottom: 10px;">Order Confirmation</h1>
            <p style="font-size: 16px; color: #666;">Thank you for your order!</p>
          </div>
          
          <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Order Number:</strong> #{{order.id}}</p>
            <p style="margin: 5px 0;"><strong>Order Date:</strong> {{date}}</p>
            <p style="margin: 5px 0;"><strong>Payment Method:</strong> {{order.paymentMethod}}</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h2 style="color: #333; border-bottom: 1px solid #e5e5e5; padding-bottom: 10px;">Order Summary</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="background-color: #f8f8f8;">
                <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e5e5e5;">Product</th>
                <th style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e5e5;">Quantity</th>
                <th style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e5e5;">Price</th>
                <th style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e5e5;">Subtotal</th>
              </tr>
              {{#each order.items}}
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e5e5;">{{this.product.name}}</td>
                <td style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e5e5;">{{this.quantity}}</td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e5e5;">₹{{this.price}}</td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e5e5;">₹{{multiply this.quantity this.price}}</td>
              </tr>
              {{/each}}
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Subtotal (Products):</td>
                <td style="padding: 10px; text-align: right; font-weight: bold;">₹{{order.subtotal}}</td>
              </tr>
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Delivery Charges:</td>
                <td style="padding: 10px; text-align: right; font-weight: bold;">₹{{order.deliveryCharges}}</td>
              </tr>
              {{#if order.walletDiscount}}
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold; color: #388e3c;">Wallet Discount ({{order.walletCoinsUsed}} wallet rupees):</td>
                <td style="padding: 10px; text-align: right; color: #388e3c;">-₹{{order.walletDiscount}}</td>
              </tr>
              {{/if}}
              {{#if order.redeemDiscount}}
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold; color: #388e3c;">Redeem Discount ({{order.redeemCoinsUsed}} coins):</td>
                <td style="padding: 10px; text-align: right; color: #388e3c;">-₹{{order.redeemDiscount}}</td>
              </tr>
              {{/if}}
              {{#if order.rewardDiscount}}
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold; color: #388e3c;">Reward Discount ({{order.rewardPointsUsed}} points):</td>
                <td style="padding: 10px; text-align: right; color: #388e3c;">-₹{{order.rewardDiscount}}</td>
              </tr>
              {{/if}}
              <tr style="background-color: #f8f8f8;">
                <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Total (after all discounts):</td>
                <td style="padding: 10px; text-align: right; font-weight: bold;">₹{{order.total}}</td>
              </tr>
            </table>
            {{#if order.walletDiscount}}
            <div style="margin-top: 10px; color: #388e3c; font-size: 14px;">You saved ₹{{order.walletDiscount}} using {{order.walletCoinsUsed}} wallet rupees!</div>
            {{/if}}
            {{#if order.redeemDiscount}}
            <div style="margin-top: 10px; color: #388e3c; font-size: 14px;">You saved ₹{{order.redeemDiscount}} using {{order.redeemCoinsUsed}} redeem coins!</div>
            {{/if}}
            {{#if order.rewardDiscount}}
            <div style="margin-top: 10px; color: #388e3c; font-size: 14px;">You saved ₹{{order.rewardDiscount}} using {{order.rewardPointsUsed}} reward points!</div>
            {{/if}}
          </div>
          
          <div style="margin-bottom: 20px;">
            <h2 style="color: #333; border-bottom: 1px solid #e5e5e5; padding-bottom: 10px;">Shipping Details</h2>
            <p><strong>Name:</strong> {{shippingDetails.name}}</p>
            <p><strong>Address:</strong> {{shippingDetails.address}}</p>
            <p><strong>City:</strong> {{shippingDetails.city}}, <strong>State:</strong> {{shippingDetails.state}}</p>
            <p><strong>PIN Code:</strong> {{shippingDetails.zipCode}}</p>
            <p><strong>Country:</strong> {{shippingDetails.country}}</p>
            <p><strong>Phone:</strong> {{shippingDetails.phone}}</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="{{orderLink}}" style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">View Order Details</a>
            <p style="margin-top: 20px; font-size: 14px; color: #777;">If you have any questions about your order, please contact our customer support team.</p>
          </div>
        </div>
      `;

    case EMAIL_TEMPLATES.ORDER_CANCELLED:
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px; background-color: #f44336; padding: 20px; border-radius: 5px;">
            <h1 style="color: white; margin-bottom: 10px;">Order Cancelled</h1>
            <p style="font-size: 16px; color: white;">Hello {{buyerName}}, your order has been cancelled</p>
          </div>
          
          <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Order Number:</strong> #{{order.id}}</p>
            <p style="margin: 5px 0;"><strong>Cancellation Date:</strong> {{date}}</p>
          </div>
          
          <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #f44336;">
            <p style="margin: 5px 0;"><strong>Important Information:</strong> If your payment was already processed, a refund will be initiated and processed within 5-7 business days. The refund will be made to your original payment method.</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h2 style="color: #333; border-bottom: 1px solid #e5e5e5; padding-bottom: 10px;">Next Steps</h2>
            <p>If you have any questions about this cancellation or would like to place a new order, please visit our website or contact our customer support team.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="{{orderLink}}" style="display: inline-block; padding: 12px 24px; background-color: #757575; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">View Order Details</a>
            <p style="margin-top: 20px; font-size: 14px; color: #777;">Thank you for your understanding.</p>
          </div>
        </div>
      `;

    case EMAIL_TEMPLATES.ORDER_SHIPPED:
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px; background-color: #4CAF50; padding: 20px; border-radius: 5px;">
            <h1 style="color: white; margin-bottom: 10px;">Your Order Has Been Shipped!</h1>
            <p style="font-size: 16px; color: white;">Hello {{buyerName}}, good news!</p>
          </div>
          
          <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Order Number:</strong> #{{order.id}}</p>
            <p style="margin: 5px 0;"><strong>Ship Date:</strong> {{date}}</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h2 style="color: #333; border-bottom: 1px solid #e5e5e5; padding-bottom: 10px;">Shipping Details</h2>
            <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px;">
              <p style="margin: 5px 0;"><strong>Tracking Number:</strong> {{trackingNumber}}</p>
              <p style="margin: 5px 0;"><strong>Courier:</strong> {{courierName}}</p>
              <p style="margin: 5px 0;"><strong>Expected Delivery:</strong> Within 3-5 business days</p>
            </div>
          </div>
          
          <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #4CAF50;">
            <p style="margin: 5px 0;">You can track your shipment using the tracking number provided. If you have any questions or concerns about your delivery, please contact our customer support.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="{{orderLink}}" style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Track Your Order</a>
            <p style="margin-top: 20px; font-size: 14px; color: #777;">Thank you for shopping with LeLeKart!</p>
          </div>
        </div>
      `;

    case EMAIL_TEMPLATES.RETURN_REQUESTED:
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px; background-color: #ff9800; padding: 20px; border-radius: 5px;">
            <h1 style="color: white; margin-bottom: 10px;">Return Request Confirmation</h1>
            <p style="font-size: 16px; color: white;">Hello {{buyerName}}, we've received your request</p>
          </div>
          
          <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Return Request ID:</strong> #{{returnRequest.id}}</p>
            <p style="margin: 5px 0;"><strong>Request Type:</strong> {{returnRequest.requestType}}</p>
            <p style="margin: 5px 0;"><strong>Date Requested:</strong> {{date}}</p>
          </div>
          
          <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #ff9800;">
            <p style="margin: 5px 0;">We will review your request and get back to you as soon as possible. The typical review process takes 1-2 business days.</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h2 style="color: #333; border-bottom: 1px solid #e5e5e5; padding-bottom: 10px;">Next Steps</h2>
            <ol style="margin-left: 20px; line-height: 1.6;">
              <li>Our team will review your return request</li>
              <li>You'll receive an email notification about approval or rejection</li>
              <li>If approved, you'll receive return instructions</li>
              <li>After we receive the item, we'll process your refund or replacement</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="{{returnLink}}" style="display: inline-block; padding: 12px 24px; background-color: #ff9800; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">View Return Request</a>
            <p style="margin-top: 20px; font-size: 14px; color: #777;">If you have any questions, please contact our customer support team.</p>
          </div>
        </div>
      `;

    case EMAIL_TEMPLATES.RETURN_APPROVED:
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px; background-color: #4CAF50; padding: 20px; border-radius: 5px;">
            <h1 style="color: white; margin-bottom: 10px;">Return Request Approved</h1>
            <p style="font-size: 16px; color: white;">Hello {{buyerName}}, good news!</p>
          </div>
          
          <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Return Request ID:</strong> #{{returnRequest.id}}</p>
            <p style="margin: 5px 0;"><strong>Request Type:</strong> {{returnRequest.requestType}}</p>
            <p style="margin: 5px 0;"><strong>Date Approved:</strong> {{date}}</p>
          </div>
          
          <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #4CAF50;">
            <p style="margin: 5px 0;">Your return request has been approved! Please follow the instructions below to complete the return process.</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h2 style="color: #333; border-bottom: 1px solid #e5e5e5; padding-bottom: 10px;">Return Instructions</h2>
            <ol style="margin-left: 20px; line-height: 1.6;">
              <li>Pack the item securely in its original packaging if possible</li>
              <li>Include a copy of the order invoice or the return request number</li>
              <li>Ship the item to the address provided on the return details page</li>
              <li>Keep your shipping receipt and tracking information</li>
            </ol>
            <p style="margin-top: 15px;">For complete instructions and shipping address, please click the button below to view your return details.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="{{returnLink}}" style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">View Return Details</a>
            <p style="margin-top: 20px; font-size: 14px; color: #777;">Once we receive your returned item, we'll process your {{#if returnRequest.requestType === 'refund'}}refund{{else}}{{#if returnRequest.requestType === 'replacement'}}replacement{{else}}return{{/if}}{{/if}} as quickly as possible.</p>
          </div>
        </div>
      `;

    case EMAIL_TEMPLATES.RETURN_REJECTED:
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px; background-color: #f44336; padding: 20px; border-radius: 5px;">
            <h1 style="color: white; margin-bottom: 10px;">Return Request Rejected</h1>
            <p style="font-size: 16px; color: white;">Hello {{buyerName}}, we have an update on your request</p>
          </div>
          
          <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Return Request ID:</strong> #{{returnRequest.id}}</p>
            <p style="margin: 5px 0;"><strong>Request Type:</strong> {{returnRequest.requestType}}</p>
            <p style="margin: 5px 0;"><strong>Date Reviewed:</strong> {{date}}</p>
          </div>
          
          <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #f44336;">
            <p style="margin: 5px 0;"><strong>Reason for Rejection:</strong> {{reason}}</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h2 style="color: #333; border-bottom: 1px solid #e5e5e5; padding-bottom: 10px;">What This Means</h2>
            <p>After careful review, we were unable to approve your return request based on our return policy guidelines. For more details about our return policy, please visit our website.</p>
            <p>If you believe this decision was made in error or if you have additional information that might help us reconsider, please contact our customer support team.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="{{returnLink}}" style="display: inline-block; padding: 12px 24px; background-color: #757575; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">View Return Details</a>
            <a href="#" style="display: inline-block; margin-top: 10px; padding: 12px 24px; background-color: #f44336; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Contact Support</a>
            <p style="margin-top: 20px; font-size: 14px; color: #777;">We value your business and are here to assist with any questions you may have.</p>
          </div>
        </div>
      `;

    case EMAIL_TEMPLATES.RETURN_ITEM_RECEIVED:
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px; background-color: #2196f3; padding: 20px; border-radius: 5px;">
            <h1 style="color: white; margin-bottom: 10px;">Return Item Received</h1>
            <p style="font-size: 16px; color: white;">Hello {{buyerName}}, we've received your return</p>
          </div>
          
          <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Return Request ID:</strong> #{{returnRequest.id}}</p>
            <p style="margin: 5px 0;"><strong>Request Type:</strong> {{returnRequest.requestType}}</p>
            <p style="margin: 5px 0;"><strong>Date Received:</strong> {{date}}</p>
          </div>
          
          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #2196f3;">
            <p style="margin: 5px 0;">Good news! We have successfully received your returned item and are now processing your {{#if returnRequest.requestType === 'refund'}}refund{{else}}replacement{{/if}}.</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h2 style="color: #333; border-bottom: 1px solid #e5e5e5; padding-bottom: 10px;">Next Steps</h2>
            {{#if returnRequest.requestType === 'refund'}}
            <p>Our team will inspect the returned item and process your refund according to our return policy. You should receive another email notification once your refund has been initiated.</p>
            <p>The refund typically takes 5-7 business days to appear in your account after it has been processed, depending on your payment method.</p>
            {{else}}
            <p>Our team will inspect the returned item and prepare your replacement. You should receive another email notification once your replacement has been shipped.</p>
            <p>We aim to ship replacement items within 2-3 business days after receiving the return.</p>
            {{/if}}
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="{{returnLink}}" style="display: inline-block; padding: 12px 24px; background-color: #2196f3; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">View Return Details</a>
            <p style="margin-top: 20px; font-size: 14px; color: #777;">Thank you for your patience. If you have any questions, please contact our customer support team.</p>
          </div>
        </div>
      `;

    case EMAIL_TEMPLATES.REPLACEMENT_SHIPPED:
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px; background-color: #4CAF50; padding: 20px; border-radius: 5px;">
            <h1 style="color: white; margin-bottom: 10px;">Replacement Shipped</h1>
            <p style="font-size: 16px; color: white;">Hello {{buyerName}}, your replacement is on its way!</p>
          </div>
          
          <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Return Request ID:</strong> #{{returnRequest.id}}</p>
            <p style="margin: 5px 0;"><strong>Date Shipped:</strong> {{date}}</p>
          </div>
          
          <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #4CAF50;">
            <p style="margin: 5px 0;">Great news! Your replacement item has been shipped and is on its way to you.</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h2 style="color: #333; border-bottom: 1px solid #e5e5e5; padding-bottom: 10px;">Shipping Information</h2>
            <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px;">
              <p style="margin: 5px 0;"><strong>Tracking Number:</strong> {{trackingNumber}}</p>
              <p style="margin: 5px 0;"><strong>Courier:</strong> {{courierName}}</p>
              <p style="margin: 5px 0;"><strong>Expected Delivery:</strong> Within 3-5 business days</p>
            </div>
            <p style="margin-top: 15px;">You can track your shipment using the tracking number provided above.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="{{returnLink}}" style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Track Your Replacement</a>
            <p style="margin-top: 20px; font-size: 14px; color: #777;">Thank you for your patience. If you have any questions, please contact our customer support team.</p>
          </div>
        </div>
      `;

    case EMAIL_TEMPLATES.REFUND_INITIATED:
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px; background-color: #673AB7; padding: 20px; border-radius: 5px;">
            <h1 style="color: white; margin-bottom: 10px;">Refund Initiated</h1>
            <p style="font-size: 16px; color: white;">Hello {{buyerName}}, your refund is on its way!</p>
          </div>
          
          <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Return Request ID:</strong> #{{returnRequest.id}}</p>
            <p style="margin: 5px 0;"><strong>Date Initiated:</strong> {{date}}</p>
            <p style="margin: 5px 0;"><strong>Refund Amount:</strong> ₹{{amount}}</p>
          </div>
          
          <div style="background-color: #EDE7F6; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #673AB7;">
            <p style="margin: 5px 0;">We've initiated your refund for the returned item. Your money is on its way back to you!</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h2 style="color: #333; border-bottom: 1px solid #e5e5e5; padding-bottom: 10px;">Refund Information</h2>
            <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px;">
              <p style="margin: 5px 0;"><strong>Status:</strong> Initiated</p>
              <p style="margin: 5px 0;"><strong>Expected Completion:</strong> Within 5-7 business days</p>
              <p style="margin: 5px 0;"><strong>Refund Method:</strong> Original payment method</p>
            </div>
            <p style="margin-top: 15px;">Please note that the actual time it takes for the refund to appear in your account depends on your bank or payment provider's processing times.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="{{returnLink}}" style="display: inline-block; padding: 12px 24px; background-color: #673AB7; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">View Refund Details</a>
            <p style="margin-top: 20px; font-size: 14px; color: #777;">Thank you for your patience. If you have any questions, please contact our customer support team.</p>
          </div>
        </div>
      `;

    case EMAIL_TEMPLATES.REFUND_PROCESSED:
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px; background-color: #673AB7; padding: 20px; border-radius: 5px;">
            <h1 style="color: white; margin-bottom: 10px;">Refund Processed</h1>
            <p style="font-size: 16px; color: white;">Hello {{buyerName}}, your refund has been processed!</p>
          </div>
          
          <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Return Request ID:</strong> #{{returnRequest.id}}</p>
            <p style="margin: 5px 0;"><strong>Date Processed:</strong> {{date}}</p>
            <p style="margin: 5px 0;"><strong>Refund Amount:</strong> ₹{{amount}}</p>
          </div>
          
          <div style="background-color: #EDE7F6; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #673AB7;">
            <p style="margin: 5px 0;">Great news! Your refund has been processed successfully and is now on its way to your payment method.</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h2 style="color: #333; border-bottom: 1px solid #e5e5e5; padding-bottom: 10px;">Refund Information</h2>
            <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px;">
              <p style="margin: 5px 0;"><strong>Status:</strong> Processed</p>
              <p style="margin: 5px 0;"><strong>Refund Method:</strong> {{refundMethod}}</p>
              <p style="margin: 5px 0;"><strong>Expected Arrival:</strong> Within 3-5 business days</p>
            </div>
            <p style="margin-top: 15px;">The time it takes for the refund to reflect in your account depends on your bank or payment provider. Most refunds take 3-5 business days to appear, but may occasionally take longer depending on your financial institution.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="{{returnLink}}" style="display: inline-block; padding: 12px 24px; background-color: #673AB7; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">View Refund Details</a>
            <p style="margin-top: 20px; font-size: 14px; color: #777;">Thank you for your patience. If you have any questions, please contact our customer support team.</p>
          </div>
        </div>
      `;

    case EMAIL_TEMPLATES.RETURN_COMPLETED:
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px; background-color: #4CAF50; padding: 20px; border-radius: 5px;">
            <h1 style="color: white; margin-bottom: 10px;">Return Completed</h1>
            <p style="font-size: 16px; color: white;">Hello {{buyerName}}, your return process is now complete!</p>
          </div>
          
          <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Return Request ID:</strong> #{{returnRequest.id}}</p>
            <p style="margin: 5px 0;"><strong>Request Type:</strong> {{returnRequest.requestType}}</p>
            <p style="margin: 5px 0;"><strong>Date Completed:</strong> {{date}}</p>
          </div>
          
          <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #4CAF50;">
            <p style="margin: 5px 0;">We're pleased to inform you that your return request has been fully processed and completed. Thank you for your patience throughout this process.</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h2 style="color: #333; border-bottom: 1px solid #e5e5e5; padding-bottom: 10px;">Return Summary</h2>
            <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px;">
              {{#if returnRequest.requestType === 'refund'}}
              <p style="margin: 5px 0;"><strong>Status:</strong> Refund Completed</p>
              <p style="margin: 5px 0;"><strong>Refund Amount:</strong> ₹{{amount}}</p>
              <p style="margin: 5px 0;"><strong>Refund Method:</strong> {{refundMethod}}</p>
              {{else if returnRequest.requestType === 'replacement'}}
              <p style="margin: 5px 0;"><strong>Status:</strong> Replacement Completed</p>
              <p style="margin: 5px 0;"><strong>Replacement Item:</strong> Delivered</p>
              {{else}}
              <p style="margin: 5px 0;"><strong>Status:</strong> Return Processed</p>
              {{/if}}
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="{{returnLink}}" style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">View Return Details</a>
            <p style="margin-top: 20px; font-size: 14px; color: #777;">We value your business and hope you're satisfied with the resolution. If you have any questions or need further assistance, please contact our customer support team.</p>
          </div>
        </div>
      `;

    case EMAIL_TEMPLATES.SELLER_ORDER_NOTIFICATION:
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #333; margin-bottom: 10px;">New Order Received</h1>
            <p style="font-size: 16px; color: #666;">Hello {{sellerName}}, you have a new order!</p>
          </div>
          
          <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Main Order ID:</strong> #{{order.id}}</p>
            <p style="margin: 5px 0;"><strong>Seller Order ID:</strong> #{{sellerOrder.id}}</p>
            <p style="margin: 5px 0;"><strong>Order Date:</strong> {{date}}</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h2 style="color: #333; border-bottom: 1px solid #e5e5e5; padding-bottom: 10px;">Order Items</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="background-color: #f8f8f8;">
                <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e5e5e5;">Product</th>
                <th style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e5e5;">Quantity</th>
                <th style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e5e5;">Price</th>
                <th style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e5e5;">Subtotal</th>
              </tr>
              {{#each orderItems}}
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e5e5;">{{this.product.name}}</td>
                <td style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e5e5;">{{this.quantity}}</td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e5e5;">₹{{this.price}}</td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e5e5;">₹{{multiply this.quantity this.price}}</td>
              </tr>
              {{/each}}
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Subtotal:</td>
                <td style="padding: 10px; text-align: right;">₹{{sellerOrder.subtotal}}</td>
              </tr>
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Delivery Charges:</td>
                <td style="padding: 10px; text-align: right;">₹{{sellerOrder.deliveryCharge}}</td>
              </tr>
              <tr style="background-color: #f8f8f8;">
                <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
                <td style="padding: 10px; text-align: right; font-weight: bold;">₹{{add sellerOrder.subtotal sellerOrder.deliveryCharge}}</td>
              </tr>
            </table>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h2 style="color: #333; border-bottom: 1px solid #e5e5e5; padding-bottom: 10px;">Shipping Information</h2>
            <p>
              {{#with order}}
                {{#with shippingDetails}}
                  <strong>Name:</strong> {{name}}<br>
                  <strong>Address:</strong> {{address}}<br>
                  <strong>City:</strong> {{city}}, <strong>State:</strong> {{state}}<br>
                  <strong>PIN Code:</strong> {{zipCode}}<br>
                  <strong>Country:</strong> {{country}}<br>
                  <strong>Phone:</strong> {{phone}}
                {{/with}}
              {{/with}}
            </p>
          </div>
          
          <div style="background-color: #fffde7; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #ffd600;">
            <p style="margin: 5px 0;"><strong>Important:</strong> Please process this order as soon as possible. If you cannot fulfill this order, please update the status in your seller dashboard.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="{{orderLink}}" style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">View Order Details</a>
            <p style="margin-top: 20px; font-size: 14px; color: #777;">This order was received through the LeLeKart platform. For any assistance, please contact platform support.</p>
          </div>
        </div>
      `;

    case EMAIL_TEMPLATES.ADMIN_NOTIFICATION:
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px; background-color: #1976d2; padding: 20px; border-radius: 5px;">
            <h1 style="color: white; margin-bottom: 10px;">New Order Notification</h1>
            <p style="font-size: 16px; color: white;">Admin notification for platform order</p>
          </div>
          
          <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Order ID:</strong> #{{order.id}}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> {{date}}</p>
            <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹{{order.total}}</p>
            <p style="margin: 5px 0;"><strong>Payment Method:</strong> {{order.paymentMethod}}</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h2 style="color: #333; border-bottom: 1px solid #e5e5e5; padding-bottom: 10px;">Buyer Information</h2>
            <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px;">
              <p style="margin: 5px 0;"><strong>Name:</strong> {{buyerInfo.name}}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> {{buyerInfo.email}}</p>
              <p style="margin: 5px 0;"><strong>Phone:</strong> {{buyerInfo.phone}}</p>
            </div>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h2 style="color: #333; border-bottom: 1px solid #e5e5e5; padding-bottom: 10px;">Order Items</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="background-color: #f8f8f8;">
                <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e5e5e5;">Product</th>
                <th style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e5e5;">Quantity</th>
                <th style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e5e5;">Price</th>
                <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e5e5e5;">Seller</th>
                <th style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e5e5;">Subtotal</th>
              </tr>
              {{#each order.items}}
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e5e5;">{{this.product.name}}</td>
                <td style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e5e5;">{{this.quantity}}</td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e5e5;">₹{{this.price}}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e5e5;">{{this.product.sellerName}}</td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e5e5;">₹{{multiply this.quantity this.price}}</td>
              </tr>
              {{/each}}
            </table>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h2 style="color: #333; border-bottom: 1px solid #e5e5e5; padding-bottom: 10px;">Seller Orders</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="background-color: #f8f8f8;">
                <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e5e5e5;">Seller</th>
                <th style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e5e5;">Seller Order ID</th>
                <th style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e5e5;">Subtotal</th>
                <th style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e5e5;">Status</th>
              </tr>
              {{#each sellerInfo}}
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e5e5;">{{this.name}}</td>
                <td style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e5e5;">{{this.sellerOrderId}}</td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e5e5;">₹{{this.subtotal}}</td>
                <td style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e5e5;">
                  <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; 
                  background-color: {{#if this.status == 'pending'}}#ff9800{{else}}{{#if this.status == 'processing'}}#2196f3{{else}}{{#if this.status == 'shipped'}}#4caf50{{else}}{{#if this.status == 'delivered'}}#4caf50{{else}}{{#if this.status == 'cancelled'}}#f44336{{else}}#9e9e9e{{/if}}{{/if}}{{/if}}{{/if}}{{/if}}; 
                  color: white;">
                    {{this.status}}
                  </span>
                </td>
              </tr>
              {{/each}}
            </table>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h2 style="color: #333; border-bottom: 1px solid #e5e5e5; padding-bottom: 10px;">Shipping Information</h2>
            <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px;">
              {{#with order}}
                {{#with shippingDetails}}
                  <p style="margin: 5px 0;"><strong>Name:</strong> {{name}}</p>
                  <p style="margin: 5px 0;"><strong>Address:</strong> {{address}}</p>
                  <p style="margin: 5px 0;"><strong>City:</strong> {{city}}, <strong>State:</strong> {{state}}</p>
                  <p style="margin: 5px 0;"><strong>PIN Code:</strong> {{zipCode}}</p>
                  <p style="margin: 5px 0;"><strong>Country:</strong> {{country}}</p>
                  <p style="margin: 5px 0;"><strong>Phone:</strong> {{phone}}</p>
                {{/with}}
              {{/with}}
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="{{orderLink}}" style="display: inline-block; padding: 12px 24px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">View Order Details</a>
            <p style="margin-top: 20px; font-size: 14px; color: #777;">This is an automated admin notification from the LeLeKart platform.</p>
          </div>
        </div>
      `;

    case EMAIL_TEMPLATES.CAREER_APPLICATION:
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; margin-bottom: 20px;">New Career Application</h2>
          <p style="color: #666; margin-bottom: 20px;">A new career application has been submitted. Here are the details:</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-top: 0;">Personal Information</h3>
            <p><strong>Name:</strong> {{name}}</p>
            <p><strong>Father's Name:</strong> {{fatherName}}</p>
            <p><strong>Marital Status:</strong> {{maritalStatus}}</p>
            <p><strong>Address:</strong> {{address}}</p>
            <p><strong>Country:</strong> {{country}}</p>
          </div>

          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-top: 0;">Contact Information</h3>
            <p><strong>Email:</strong> {{email}}</p>
            <p><strong>Phone:</strong> {{phone}}</p>
            <p><strong>WhatsApp:</strong> {{whatsapp}}</p>
          </div>

          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-top: 0;">Education & Experience</h3>
            <p><strong>Highest Qualification:</strong> {{highestQualification}}</p>
            <p><strong>Specialization:</strong> {{specialization}}</p>
            <p><strong>Total Work Experience:</strong> {{workExperience}}</p>
            <p><strong>Valid ID Number:</strong> {{idNumber}}</p>
          </div>

          {{#if message}}
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-top: 0;">Additional Message</h3>
            <p style="white-space: pre-wrap;">{{message}}</p>
          </div>
          {{/if}}

          {{#if resumeUrl}}
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-top: 0;">Resume</h3>
            <div style="word-break: break-all; padding: 10px; background-color: #fff; border: 1px solid #ddd; border-radius: 4px;">
              <p style="margin: 0; color: #007bff; font-family: monospace;">{{resumeUrl}}</p>
            </div>
            <p style="margin-top: 10px; color: #666; font-size: 0.9em;">Copy and paste the above URL in your browser to access the resume</p>
          </div>
          {{/if}}

          <div style="color: #666; font-size: 0.9em; margin-top: 20px;">
            <p>Application submitted on: {{submissionDate}}</p>
          </div>
        </div>
      `;

    case EMAIL_TEMPLATES.WALLET_USED:
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 5px;">
          <h2 style="color: #333;">Wallet Used for Order</h2>
          <p style="font-size: 16px; color: #666;">You used <b>₹{{order.walletDiscount}}</b> from your wallet for order <b>#{{order.id}}</b>.</p>
          <p style="font-size: 14px; color: #666;">Order link: <a href="{{orderLink}}">View Order</a></p>
          <p style="font-size: 12px; color: #999;">Date: {{date}}</p>
        </div>
      `;
    case EMAIL_TEMPLATES.REDEEM_USED:
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 5px;">
          <h2 style="color: #333;">Redeem Coins Used for Order</h2>
          <p style="font-size: 16px; color: #666;">You used <b>₹{{order.redeemDiscount}}</b> ({{order.redeemCoinsUsed}} coins) for order <b>#{{order.id}}</b>.</p>
          <p style="font-size: 14px; color: #666;">Order link: <a href="{{orderLink}}">View Order</a></p>
          <p style="font-size: 12px; color: #999;">Date: {{date}}</p>
        </div>
      `;

    default:
      // Default empty template
      return `
        <div>
          <h1>Notification</h1>
          <p>This is a notification from LeleKart.</p>
        </div>
      `;
  }
}

/**
 * Send a wallet used notification email
 */
export async function sendWalletUsedEmail(order: any, email: string): Promise<boolean> {
  try {
    if (!order.walletDiscount || order.walletDiscount <= 0) return false;
    const emailOptions = {
      to: email,
      subject: `Wallet Used: ₹${order.walletDiscount} for Order #${order.id}`,
      template: EMAIL_TEMPLATES.WALLET_USED,
      data: {
        order,
        date: new Date().toLocaleDateString(),
        orderLink: `${process.env.SITE_URL}/orders/${order.id}`,
      },
    };
    return await sendEmail(emailOptions);
  } catch (error) {
    console.error("Error sending wallet used email:", error);
    return false;
  }
}

/**
 * Send a redeem used notification email
 */
export async function sendRedeemUsedEmail(order: any, email: string): Promise<boolean> {
  try {
    if (!order.redeemDiscount || order.redeemDiscount <= 0) return false;
    const emailOptions = {
      to: email,
      subject: `Redeem Coins Used: ₹${order.redeemDiscount} for Order #${order.id}`,
      template: EMAIL_TEMPLATES.REDEEM_USED,
      data: {
        order,
        date: new Date().toLocaleDateString(),
        orderLink: `${process.env.SITE_URL}/orders/${order.id}`,
      },
    };
    return await sendEmail(emailOptions);
  } catch (error) {
    console.error("Error sending redeem used email:", error);
    return false;
  }
}
