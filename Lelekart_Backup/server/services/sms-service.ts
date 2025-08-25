/**
 * SMS Service
 * 
 * This file contains functions for sending SMS notifications using Twilio.
 */

import twilio from 'twilio';

// Initialize Twilio client with credentials from environment variables
let twilioClient: twilio.Twilio | null = null;

/**
 * Check if SMS service is properly configured
 */
export function isSmsConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID && 
    process.env.TWILIO_AUTH_TOKEN && 
    process.env.TWILIO_PHONE_NUMBER
  );
}

/**
 * Initialize Twilio client for sending SMS
 */
export function initializeSmsService(): void {
  if (isSmsConfigured()) {
    try {
      twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID!,
        process.env.TWILIO_AUTH_TOKEN!
      );
      console.log('SMS service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SMS service:', error);
      twilioClient = null;
    }
  } else {
    console.log('SMS service not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to enable SMS notifications.');
    twilioClient = null;
  }
}

/**
 * Send SMS notification
 * @param to Phone number to send SMS to
 * @param message SMS content
 */
export async function sendSms(to: string, message: string): Promise<boolean> {
  if (!twilioClient) {
    if (isSmsConfigured()) {
      initializeSmsService();
    } else {
      console.log('SMS service not configured. Cannot send SMS.');
      return false;
    }
  }

  try {
    if (!twilioClient) {
      console.error('Twilio client initialization failed');
      return false;
    }

    const response = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to
    });

    console.log(`SMS sent successfully. SID: ${response.sid}`);
    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
}

/**
 * Send order notification to seller via SMS
 * @param sellerOrderId Seller's order ID
 * @param mainOrderId Main order ID
 * @param sellerPhone Seller's phone number
 * @param sellerName Seller's name
 */
export async function sendSellerOrderSmsNotification(
  sellerOrderId: number,
  mainOrderId: number,
  sellerPhone: string,
  sellerName: string
): Promise<boolean> {
  // Check seller's notification preferences before sending
  const { storage } = await import('../storage');
  
  // Format message
  const message = `Hello ${sellerName}, you have received a new order #${mainOrderId}-${sellerOrderId}. Please log in to your seller dashboard to view details and process the order.`;
  
  return await sendSms(sellerPhone, message);
}

// Initialize the SMS service when this module is imported
initializeSmsService();