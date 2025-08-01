# Razorpay Integration Setup Guide

This guide explains how to set up and use the Razorpay payment integration in the Lelekart React Native app.

## Prerequisites

- Node.js >= 18
- React Native development environment
- Razorpay account with API keys

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
RAZORPAY_KEY_ID=rzp_live_D6taHqREsQhQII
RAZORPAY_KEY_SECRET=n7NGWADDr8ANqpKLKRbNFay6
PORT=5000
NODE_ENV=development
```

## Installation

1. Install the required dependencies:
```bash
npm install react-native-razorpay
```

2. For Android, add the following to `android/app/build.gradle`:
```gradle
dependencies {
    implementation 'com.razorpay:checkout:1.6.33'
}
```

3. For iOS, add the following to `ios/Podfile`:
```ruby
pod 'razorpay-pod', '1.0.32'
```

Then run:
```bash
cd ios && pod install
```

## Server Setup

The server includes the following Razorpay endpoints:

### 1. Get Razorpay Key
```
GET /api/razorpay/key
```
Returns the Razorpay Key ID for client-side usage.

### 2. Get Configuration Status
```
GET /api/razorpay/config
```
Returns the Razorpay configuration status.

### 3. Create Order
```
POST /api/razorpay/create-order
```
Creates a Razorpay order with the current cart items.

### 4. Verify Payment
```
POST /api/razorpay/verify-payment
```
Verifies the payment signature and creates the order in the system.

## Client-Side Integration

### RazorpayPayment Component

The `RazorpayPayment` component handles the payment flow:

```javascript
import RazorpayPayment from '../components/RazorpayPayment';

<RazorpayPayment
  amount={totalAmount * 100} // Convert to paise
  shippingDetails={{
    name: 'John Doe',
    email: 'john@example.com',
    phone: '9876543210',
    address: '123 Main St',
    city: 'Mumbai',
    state: 'Maharashtra',
    zipCode: '400001',
  }}
  onSuccess={(orderId) => {
    // Handle successful payment
    console.log('Payment successful:', orderId);
  }}
  onError={(error) => {
    // Handle payment error
    console.error('Payment failed:', error);
  }}
  onCancel={() => {
    // Handle payment cancellation
    console.log('Payment cancelled');
  }}
/>
```

### OrderSummaryScreen Integration

The `OrderSummaryScreen` has been updated to include Razorpay as a payment option:

1. **Payment Method Selection**: Users can now choose "Razorpay (Cards, UPI, Net Banking)" as a payment method.

2. **Payment Flow**: When Razorpay is selected, the payment modal opens with the Razorpay checkout interface.

3. **Success Handling**: After successful payment, the order is created and the user is redirected to the order confirmation screen.

## Features

### Supported Payment Methods
- Credit/Debit Cards
- UPI (Unified Payments Interface)
- Net Banking
- Digital Wallets
- EMI (Equated Monthly Installments)

### Security Features
- Payment signature verification
- Secure API communication
- Environment-based configuration
- Error handling and logging

### Development vs Production

**Development Mode:**
- Uses test keys (if available)
- More detailed error logging
- Relaxed CORS settings

**Production Mode:**
- Uses live keys
- Strict CORS settings
- Minimal error logging
- Domain verification required

## Testing

### Test Cards (Development)
- Card Number: 4111 1111 1111 1111
- Expiry: Any future date
- CVV: Any 3 digits
- Name: Any name

### UPI Testing
- Use any valid UPI ID
- Test with UPI apps like Google Pay, PhonePe, etc.

## Error Handling

The integration includes comprehensive error handling:

1. **Network Errors**: Handled with retry mechanisms
2. **Payment Failures**: User-friendly error messages
3. **Signature Verification**: Server-side validation
4. **Cart Validation**: Ensures cart is not empty
5. **Authentication**: Requires user login

## Troubleshooting

### Common Issues

1. **"Payment gateway not loaded"**
   - Check internet connection
   - Verify Razorpay key is loaded
   - Restart the app

2. **"Invalid payment signature"**
   - Check server logs
   - Verify Razorpay keys
   - Ensure proper signature verification

3. **"Cart is empty"**
   - Add items to cart before payment
   - Refresh cart data

4. **CORS Errors**
   - Check server CORS configuration
   - Verify allowed origins

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=razorpay:*
```

## Security Considerations

1. **API Keys**: Never expose secret keys in client-side code
2. **Signature Verification**: Always verify payment signatures server-side
3. **HTTPS**: Use HTTPS in production
4. **Input Validation**: Validate all user inputs
5. **Error Messages**: Don't expose sensitive information in error messages

## Production Deployment

1. **Domain Registration**: Register your domain in Razorpay dashboard
2. **SSL Certificate**: Ensure HTTPS is enabled
3. **Environment Variables**: Use production keys
4. **Monitoring**: Set up payment monitoring and alerts
5. **Backup**: Implement proper backup and recovery procedures

## Support

For issues related to:
- **Razorpay API**: Contact Razorpay support
- **React Native Integration**: Check the react-native-razorpay documentation
- **Server Issues**: Check server logs and error messages

## License

This integration is part of the Lelekart project and follows the same license terms. 