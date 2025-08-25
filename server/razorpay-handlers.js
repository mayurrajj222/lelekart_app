const Razorpay = require('razorpay');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay order
const createRazorpayOrder = async (amount, receipt, notes) => {
  try {
    const order = await razorpay.orders.create({
      amount: amount,
      currency: 'INR',
      receipt: receipt,
      notes: notes,
    });
    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
};

// Verify payment signature
const verifyPaymentSignature = (paymentId, orderId, signature) => {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  
  return expectedSignature === signature;
};

// Handle successful payment
const handleSuccessfulPayment = async (paymentId, orderId, signature) => {
  try {
    // Verify the signature
    const isValid = verifyPaymentSignature(paymentId, orderId, signature);
    
    if (!isValid) {
      return { success: false, error: 'Invalid payment signature' };
    }

    // Get payment details from Razorpay
    const payment = await razorpay.payments.fetch(paymentId);
    
    if (payment.status !== 'captured') {
      return { success: false, error: 'Payment not captured' };
    }

    return { success: true, payment };
  } catch (error) {
    console.error('Error handling successful payment:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  createRazorpayOrder,
  verifyPaymentSignature,
  handleSuccessfulPayment,
}; 