const express = require('express');
const { createRazorpayOrder, handleSuccessfulPayment } = require('../razorpay-handlers');

const router = express.Router();

// Get Razorpay key
router.get('/key', (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    res.json({
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Error fetching Razorpay key:', error);
    res.status(500).json({ error: 'Failed to fetch payment key' });
  }
});

// Create Razorpay order with wallet discount support
router.post('/create-order', async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  try {
    // Get cart items to calculate total
    const cartItems = await req.app.locals.storage.getCartItems(req.user.id);

    if (cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Get wallet discount information from request
    const walletDiscount = parseFloat(req.body.walletDiscount) || 0;
    const walletCoinsUsed = parseInt(req.body.walletCoinsUsed) || 0;

    // Calculate subtotal
    const subtotal = cartItems.reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0
    );

    // Calculate final amount after wallet discount
    const finalAmount = Math.max(0, subtotal - walletDiscount);

    // Calculate total in lowest currency unit (paise for INR)
    const totalInPaise = Math.round(finalAmount * 100);

    // Create a unique receipt ID
    const receiptId = `receipt_${Date.now()}_${req.user.id}`;

    // Notes for the order
    const notes = {
      userId: req.user.id.toString(),
      email: req.user.email,
      walletDiscount: walletDiscount.toString(),
      walletCoinsUsed: walletCoinsUsed.toString(),
      items: JSON.stringify(
        cartItems.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
        }))
      ),
    };

    // Create Razorpay order
    const order = await createRazorpayOrder(totalInPaise, receiptId, notes);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Failed to create Razorpay order",
      details: errorMessage,
    });
  }
});

// Verify payment with wallet discount support
router.post('/verify-payment', async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      shippingDetails,
      addressId,
      walletDiscount = 0,
      walletCoinsUsed = 0,
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res
        .status(400)
        .json({ error: "Missing payment verification details" });
    }

    // Verify the payment signature
    const result = await handleSuccessfulPayment(
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature
    );

    if (!result.success) {
      return res.status(400).json({ error: "Payment verification failed" });
    }

    // Get cart items
    const cartItems = await req.app.locals.storage.getCartItems(req.user.id);

    if (cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Validate addressId (if provided)
    let validatedAddressId = null;
    if (addressId) {
      const parsedAddressId = parseInt(addressId);
      console.log(`Validating address ID (Razorpay): ${parsedAddressId}`);

      try {
        const address = await req.app.locals.storage.getUserAddress(parsedAddressId);
        if (!address) {
          console.error(`Address with ID ${parsedAddressId} not found`);
          return res.status(400).json({ error: "Address not found" });
        }

        if (address.userId !== req.user.id) {
          console.error(
            `Address ${parsedAddressId} belongs to user ${address.userId}, not ${req.user.id}`
          );
          return res.status(400).json({ error: "Invalid address selected" });
        }

        console.log(`Address validated successfully:`, address);
        validatedAddressId = parsedAddressId;
      } catch (addressError) {
        console.error("Error validating address:", addressError);
        return res.status(400).json({ error: "Error validating address" });
      }
    }

    // Calculate total with wallet discount
    const subtotal = cartItems.reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0
    );
    const finalTotal = Math.max(0, subtotal - walletDiscount);

    // Create order in our system
    const orderData = {
      userId: req.user.id,
      status: "paid", // Payment successful, so mark as paid
      total: finalTotal,
      date: new Date(),
      shippingDetails:
        typeof shippingDetails === "string"
          ? shippingDetails
          : JSON.stringify(shippingDetails || {}),
      paymentMethod: "razorpay",
      paymentId: razorpayPaymentId,
      orderId: razorpayOrderId,
    };

    // Add validated address ID if available
    if (validatedAddressId) {
      orderData.addressId = validatedAddressId;
      console.log(
        `Adding validated addressId ${validatedAddressId} to Razorpay order`
      );
    }

    // Add wallet information if wallet redemption was applied
    if (walletDiscount > 0 && walletCoinsUsed > 0) {
      orderData.walletDiscount = walletDiscount;
      orderData.walletCoinsUsed = walletCoinsUsed;
    }

    console.log(
      "Creating order after successful Razorpay payment:",
      orderData
    );

    const order = await req.app.locals.storage.createOrder(orderData);
    console.log("Order created successfully after Razorpay payment:", order);

    // Create order items
    for (const item of cartItems) {
      const orderItemData = {
        orderId: order.id,
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      };

      console.log("Creating order item:", orderItemData);
      await req.app.locals.storage.createOrderItem(orderItemData);
    }

    // Process wallet redemption if needed
    if (walletDiscount > 0 && walletCoinsUsed > 0) {
      try {
        // Import the redeemCoinsFromWallet function from wallet-handlers
        const { redeemCoinsFromWallet } = await import(
          "./handlers/wallet-handlers"
        );

        // Process the redemption
        await redeemCoinsFromWallet(
          req.user.id,
          walletCoinsUsed,
          "ORDER",
          order.id,
          `Order #${order.id} coin redemption (Razorpay payment)`
        );

        console.log(
          "Wallet transaction created successfully for Razorpay payment"
        );
      } catch (walletError) {
        console.error(
          "Error processing wallet redemption for Razorpay payment:",
          walletError
        );
        // We don't want to fail the order if wallet processing fails at this point
        // Just log the error and continue
      }
    }

    // Clear cart
    await req.app.locals.storage.clearCart(req.user.id);

    res.status(201).json({
      success: true,
      order: {
        ...order,
        razorpayPaymentId,
        razorpayOrderId,
      },
    });
  } catch (error) {
    console.error("Error verifying Razorpay payment:", error);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

module.exports = router; 