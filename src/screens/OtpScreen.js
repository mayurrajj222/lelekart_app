import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { verifyOtp, sendOtp } from '../lib/api';
import { AuthContext } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { API_BASE } from '../lib/api';

export default function OtpScreen({ route, navigation }) {
  const { email } = route.params || {};
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(20);
  const [resendLoading, setResendLoading] = useState(false);
  const { setUser } = useContext(AuthContext);
  const { handlePostLoginCartSync } = useCart();

  React.useEffect(() => {
    if (resendTimer === 0) return;
    const timer = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleVerify = async () => {
    setError('');
    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }
    setLoading(true);
    try {
      const res = await verifyOtp(email, otp);
      setLoading(false);
      if (res.success) {
        if (res.isNewUser) {
          navigation.navigate('Register', { email });
        } else if (res.user) {
          setUser(res.user);
          await handlePostLoginCartSync();
          // Navigate to main app for existing users
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
          });
        }
      } else {
        setError(res.message || 'Invalid OTP');
      }
    } catch (e) {
      setLoading(false);
      setError('Network error. Please try again.');
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setResendLoading(true);
    try {
      const res = await sendOtp(email);
      if (!res.success) {
        setError(res.message || 'Failed to resend OTP');
      }
      setResendTimer(20);
    } catch (e) {
      setError('Network error. Please try again.');
    }
    setResendLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Your Email</Text>
      <Text style={styles.subtitle}>Enter the 6-digit OTP sent to</Text>
      <Text style={styles.email}>{email}</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter 6-digit OTP"
        keyboardType="numeric"
        maxLength={6}
        value={otp}
        onChangeText={setOtp}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Verifying...' : 'Verify OTP'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.resendButton} onPress={handleResendOtp} disabled={resendTimer > 0 || resendLoading || loading}>
        <Text style={styles.resendButtonText}>
          {resendLoading ? 'Resending...' : resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={() => navigation.goBack()} disabled={loading}>
        <Text style={styles.linkText}>Back to email</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 2,
  },
  email: {
    fontSize: 16,
    color: '#2e7dff',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    height: 48,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    fontSize: 18,
    marginBottom: 12,
    letterSpacing: 8,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    height: 48,
    backgroundColor: '#2e7dff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  error: {
    color: '#e53935',
    marginBottom: 8,
    fontSize: 14,
  },
  link: {
    marginTop: 16,
  },
  linkText: {
    color: '#2e7dff',
    fontSize: 16,
  },
  resendButton: {
    width: '100%',
    height: 40,
    backgroundColor: '#fff',
    borderColor: '#2e7dff',
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  resendButtonText: {
    color: '#2e7dff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 