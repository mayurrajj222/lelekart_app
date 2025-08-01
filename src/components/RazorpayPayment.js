import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { API_BASE } from '../lib/api';

const RazorpayPayment = ({ 
  amount, 
  shippingDetails, 
  onSuccess, 
  onError,
  onCancel 
}) => {
  const [loading, setLoading] = useState(false);
  const [razorpayKey, setRazorpayKey] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    fetchRazorpayKey();
  }, []);

  const fetchRazorpayKey = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/razorpay/key`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch Razorpay key');
      }
      
      const data = await response.json();
      
      if (!data.keyId || typeof data.keyId !== 'string' || !data.keyId.startsWith('rzp_')) {
        throw new Error('Invalid Razorpay key format');
      }
      
      setRazorpayKey(data.keyId);
    } catch (error) {
      console.error('Error fetching Razorpay key:', error);
      Alert.alert(
        'Payment Gateway Error',
        error.message || 'Failed to initialize payment gateway'
      );
    }
  };

  const createRazorpayOrder = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/razorpay/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment order');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw error;
    }
  };

  const verifyPayment = async (paymentId, orderId, signature) => {
    try {
      const response = await fetch(`${API_BASE}/api/razorpay/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          razorpayPaymentId: paymentId,
          razorpayOrderId: orderId,
          razorpaySignature: signature,
          shippingDetails: shippingDetails,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment verification failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  };

  const handlePayment = async () => {
    if (!razorpayKey) {
      Alert.alert(
        'Payment Error',
        'Payment gateway not loaded. Please try again.'
      );
      return;
    }

    setLoading(true);
    try {
      // Create Razorpay order
      const orderData = await createRazorpayOrder();
      
      // Prepare payment options
      const options = {
        description: 'Purchase on Lelekart',
        image: 'https://your-logo-url.com/logo.png', // Replace with your logo
        currency: 'INR',
        key: razorpayKey,
        amount: orderData.amount,
        name: 'Lelekart',
        order_id: orderData.orderId,
        prefill: {
          email: shippingDetails.email || '',
          contact: shippingDetails.phone || '',
          name: shippingDetails.name || '',
        },
        theme: { color: '#2874f0' },
        modal: {
          ondismiss: () => {
            setLoading(false);
            if (onCancel) onCancel();
          }
        }
      };

      // Open Razorpay checkout
      const paymentData = await RazorpayCheckout.open(options);
      
      // Verify payment
      const verificationResult = await verifyPayment(
        paymentData.razorpay_payment_id,
        paymentData.razorpay_order_id,
        paymentData.razorpay_signature
      );

      if (verificationResult.success) {
        Alert.alert(
          'Payment Successful',
          'Your order has been placed successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                if (onSuccess && verificationResult.order) {
                  onSuccess(verificationResult.order.id);
                }
              }
            }
          ]
        );
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      
      let errorMessage = 'Payment failed. Please try again.';
      
      if (error.code === 'PAYMENT_CANCELLED') {
        errorMessage = 'Payment was cancelled';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Payment Failed', errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.paymentCard}>
        <View style={styles.cardHeader}>
          <Icon name="credit-card" size={24} color="#2874f0" />
          <Text style={styles.cardTitle}>Pay with Razorpay</Text>
        </View>
        
        <View style={styles.cardContent}>
          <Text style={styles.description}>
            Pay securely using Razorpay - India's trusted payment gateway
          </Text>
          
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Amount:</Text>
            <Text style={styles.amountValue}>₹{(amount / 100).toFixed(2)}</Text>
          </View>
          
          <Text style={styles.paymentMethods}>
            Pay using Credit/Debit card, Net Banking, UPI, or Wallets
          </Text>
          
          {/* Development mode info */}
          <View style={styles.devInfo}>
            <Text style={styles.devTitle}>Development Environment</Text>
            <Text style={styles.devText}>
              This is a development environment. In production, register your domain in the Razorpay dashboard.
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.payButton, (!razorpayKey || loading) && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={!razorpayKey || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.payButtonText}>Pay Now</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginLeft: 8,
  },
  cardContent: {
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2874f0',
    marginLeft: 8,
  },
  paymentMethods: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
  },
  devInfo: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  devTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 4,
  },
  devText: {
    fontSize: 11,
    color: '#1976d2',
    lineHeight: 16,
  },
  payButton: {
    backgroundColor: '#2874f0',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#ccc',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RazorpayPayment; 