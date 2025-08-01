import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Animated, Easing, Alert } from 'react-native';
import { sendOtp, demoLogin } from '../lib/api';
import { AuthContext } from '../context/AuthContext';

const LELE_IMAGE = require('./assets/lele.png');

export default function EmailScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemoLogin, setShowDemoLogin] = useState(false);
  const [demoUsername, setDemoUsername] = useState('');
  const [demoPassword, setDemoPassword] = useState('');
  const { setUser } = useContext(AuthContext);

  // Animation for logo and form
  const logoAnim = React.useRef(new Animated.Value(-80)).current;
  const logoOpacity = React.useRef(new Animated.Value(0)).current;
  const formAnim = React.useRef(new Animated.Value(40)).current;
  const formOpacity = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(logoAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(formAnim, {
        toValue: 0,
        duration: 700,
        delay: 300,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 700,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleContinue = async () => {
    setError('');
    if (!email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Check for demo credentials
    if (email === '7771' || email === 'demo@lelekart.com') {
      setShowDemoLogin(true);
      setDemoUsername('7771');
      return;
    }
    
    setLoading(true);
    try {
      const res = await sendOtp(email);
      if (res.success) {
        setLoading(false);
        navigation.navigate('Otp', { email });
      } else {
        setLoading(false);
        setError(res.message || 'Failed to send OTP');
      }
    } catch (e) {
      setLoading(false);
      setError('Network error. Please try again.');
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    
    // Debug: Log the entered values
    console.log('Demo login attempt:', { username: demoUsername, password: demoPassword });
    
    // Check credentials locally first
    if (demoUsername === '7771' && demoPassword === '0000') {
      // Create demo user object
      const demoUser = {
        id: 999,
        email: 'demo@lelekart.com',
        username: 'demo_reviewer',
        name: 'Demo Reviewer',
        phone: '9999999999',
        address: 'Demo Address',
        role: 'buyer',
        isDemoUser: true
      };
      
      setLoading(false);
      setUser(demoUser);
      Alert.alert(
        'Demo Login Successful',
        'Welcome Demo Reviewer! You can now explore the app features.',
        [{ text: 'OK', onPress: () => {
          // Navigate to main app instead of registration
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
          });
        }}]
      );
      return;
    }
    
    // If credentials don't match, show error
    setLoading(false);
    Alert.alert('Invalid Demo Credentials', 'Please use username: 7771 and password: 0000');
  };

  const handleBackToEmail = () => {
    setShowDemoLogin(false);
    setEmail('');
    setDemoUsername('');
    setDemoPassword('');
    setError('');
  };

  return (
    <View style={styles.bgMoodLogin}>
      <Animated.View style={{ alignItems: 'center', marginBottom: 18, transform: [{ translateY: logoAnim }], opacity: logoOpacity }}>
        <Image source={LELE_IMAGE} style={styles.leleLogoLogin} resizeMode="contain" />
      </Animated.View>
      <Animated.View style={{ width: '100%', transform: [{ translateY: formAnim }], opacity: formOpacity }}>
        {!showDemoLogin ? (
          <>
            <Text style={styles.titleMoodLogin}>Welcome to Lelekart</Text>
            <Text style={styles.subtitleMoodLogin}>Login or Register to continue</Text>
            <TextInput
              style={styles.inputMoodLogin}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            {error ? <Text style={styles.errorMoodLogin}>{error}</Text> : null}
            <TouchableOpacity style={styles.buttonMoodLogin} onPress={handleContinue} disabled={loading}>
              <Text style={styles.buttonTextMoodLogin}>{loading ? 'Processing...' : 'Continue with Email'}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.titleMoodLogin}>Demo Login</Text>
            <Text style={styles.subtitleMoodLogin}>Reviewer Access</Text>
            <Text style={styles.demoCredentials}>Username: 7771 | Password: 0000</Text>
            
            <TextInput
              style={styles.inputMoodLogin}
              placeholder="Username"
              value={demoUsername}
              onChangeText={setDemoUsername}
              autoCapitalize="none"
            />
            
            <TextInput
              style={styles.inputMoodLogin}
              placeholder="Password"
              value={demoPassword}
              onChangeText={setDemoPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            
            <TouchableOpacity style={styles.buttonMoodLogin} onPress={handleDemoLogin} disabled={loading}>
              <Text style={styles.buttonTextMoodLogin}>{loading ? 'Logging in...' : 'Demo Login'}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.backButton} onPress={handleBackToEmail}>
              <Text style={styles.backButtonText}>Back to Email Login</Text>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  input: {
    width: '100%',
    height: 48,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    fontSize: 16,
    marginBottom: 12,
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
  bgMoodLogin: {
    flex: 1,
    backgroundColor: '#f7f4ef',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  leleLogoLogin: {
    width: 160,
    height: 60,
    marginBottom: 8,
  },
  titleMoodLogin: {
    fontSize: 30,
    fontFamily: 'serif',
    fontWeight: '600',
    color: '#3d3a36',
    marginBottom: 8,
    textAlign: 'left',
  },
  subtitleMoodLogin: {
    fontSize: 16,
    color: '#888',
    marginBottom: 32,
    textAlign: 'left',
    fontFamily: 'serif',
  },
  inputMoodLogin: {
    width: '100%',
    height: 48,
    borderColor: '#e5e1db',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 18,
    backgroundColor: '#fff',
    fontSize: 17,
    marginBottom: 14,
    fontFamily: 'serif',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  buttonMoodLogin: {
    width: '100%',
    height: 50,
    backgroundColor: '#3d3a36',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  buttonTextMoodLogin: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'serif',
  },
  errorMoodLogin: {
    color: '#e53935',
    marginBottom: 8,
    fontSize: 15,
    fontFamily: 'serif',
  },
  demoHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'serif',
    fontStyle: 'italic',
  },
  demoCredentials: {
    fontSize: 14,
    color: '#2e7dff',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'serif',
    fontWeight: 'bold',
  },
  backButton: {
    width: '100%',
    height: 40,
    backgroundColor: 'transparent',
    borderColor: '#3d3a36',
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  backButtonText: {
    color: '#3d3a36',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'serif',
  },
});
