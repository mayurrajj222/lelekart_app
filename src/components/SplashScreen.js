import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Text, Image, Animated } from 'react-native';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ onVideoEnd }) => {
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.8))[0];

  useEffect(() => {
    // Animate logo appearance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Proceed to main app after 3 seconds
    const timer = setTimeout(() => {
      if (onVideoEnd) {
        onVideoEnd();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.logoContainer, 
          { 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Image 
          source={require('../screens/assets/lelelogo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.loadingText}>Welcome to Lelekart</Text>
        <Text style={styles.subText}>Your trusted shopping destination</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 30,
  },
  loadingText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subText: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default SplashScreen; 