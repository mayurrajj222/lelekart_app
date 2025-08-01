import crypto from 'crypto';

// Constants - Using the provided keys
const KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_live_D6taHqREsQhQII';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'n7NGWADDr8ANqpKLKRbNFay6';

// Validate Razorpay keys
const isValidKeyId = KEY_ID && typeof KEY_ID === 'string' && KEY_ID.startsWith('rzp_');
const isValidKeySecret = KEY_SECRET && typeof KEY_SECRET === 'string' && KEY_SECRET.length > 20;

const isRazorpayConfigured = isValidKeyId && isValidKeySecret;

/**
 * Get Razorpay configuration status
 * @returns Configuration status object
 */
export function getRazorpayConfigStatus() {
  return {
    isConfigured: isRazorpayConfigured,
    keyIdPresent: !!KEY_ID,
    keyIdValid: isValidKeyId,
    keySecretPresent: !!KEY_SECRET,
    keySecretValid: isValidKeySecret,
    keyIdPrefix: KEY_ID ? KEY_ID.substring(0, 4) + '...' : null,
  };
}

if (!isRazorpayConfigured) {
  console.warn("Warning: Razorpay credentials missing or invalid. Payment features will be disabled.");
  if (KEY_ID && !isValidKeyId) {
    console.error("Razorpay Key ID is invalid. It should start with 'rzp_'");
  }
  if (KEY_SECRET && !isValidKeySecret) {
    console.error("Razorpay Key Secret is invalid");
  }
}

/**
 * Get Razorpay Key ID for client-side usage
 * @returns Razorpay Key ID
 */
export function getRazorpayKeyId(): string {
  if (!KEY_ID) {
    throw new Error("Razorpay Key ID not configured");
  }
  
  if (!isValidKeyId) {
    throw new Error("Razorpay Key ID is invalid. It should start with 'rzp_'");
  }
  
  return KEY_ID;
}

/**
 * Generate a receipt ID for Razorpay order
 */
export function generateReceiptId(): string {
  return `receipt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

/**
 * Create a Razorpay order
 * @param amount Amount in paisa (smallest currency unit)
 * @param receipt Receipt ID for the order
 * @param notes Optional notes for the order
 */
export async function createRazorpayOrder(amount: number, receipt: string, notes?: Record<string, string>): Promise<any> {
  if (!isRazorpayConfigured) {
    throw new Error("Razorpay is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your secrets.");
  }

  try {
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')}`
      },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt,
        notes: notes || {},
        payment_capture: 1, // Auto capture payment
      })
    };

    const response = await fetch('https://api.razorpay.com/v1/orders', requestOptions);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Razorpay API error:', {
        statusCode: response.status,
        error: errorData,
        endpoint: 'orders'
      });
      throw new Error(`Razorpay order creation failed: ${JSON.stringify(errorData)}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
}

/**
 * Verify Razorpay payment signature
 * @param orderId Razorpay order ID
 * @param paymentId Razorpay payment ID
 * @param signature Razorpay signature
 */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  if (!KEY_SECRET) {
    throw new Error("Razorpay Key Secret not configured");
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    
    return expectedSignature === signature;
  } catch (error) {
    console.error('Error verifying Razorpay signature:', error);
    return false;
  }
}

/**
 * Get payment details from Razorpay
 * @param paymentId Razorpay payment ID
 */
export async function getPaymentDetails(paymentId: string): Promise<any> {
  if (!isRazorpayConfigured) {
    throw new Error("Razorpay is not configured");
  }

  try {
    const requestOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')}`
      }
    };

    const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, requestOptions);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Razorpay API error:', {
        statusCode: response.status,
        error: errorData,
        endpoint: 'payments'
      });
      throw new Error(`Failed to fetch payment details: ${JSON.stringify(errorData)}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting payment details:', error);
    throw error;
  }
}

/**
 * Handle a successful Razorpay payment
 * @param paymentId Razorpay payment ID
 * @param orderId Razorpay order ID
 * @param signature Razorpay signature
 */
export async function handleSuccessfulPayment(paymentId: string, orderId: string, signature: string): Promise<{success: boolean, payment?: any, error?: string}> {
  try {
    if (!isRazorpayConfigured) {
      return {
        success: false,
        error: "Razorpay is not configured"
      };
    }

    // Verify the payment signature
    const isValid = verifyPaymentSignature(orderId, paymentId, signature);
    
    if (!isValid) {
      return { 
        success: false, 
        error: 'Invalid payment signature' 
      };
    }
    
    // Get payment details
    const paymentDetails = await getPaymentDetails(paymentId);
    
    return {
      success: true,
      payment: paymentDetails
    };
  } catch (error) {
    console.error('Error handling successful payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error processing payment'
    };
  }
} 