import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ImageBackground } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE } from '../../lib/api';
import { useNavigation } from '@react-navigation/native';

// Chocolate Theme Colors from RewardsScreen
const CHOCOLATE_DARK = '#4E2A1E';
const CHOCOLATE_MEDIUM = '#6A4A3A';
const CHOCOLATE_LIGHT = '#D2B48C';
const TEXT_LIGHT = '#F5EFE6';
const ACCENT_GOLD = '#FFD700';

const RedeemScreen = ({ route }) => {
  const { availablePoints } = route.params;
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();
  const [pointsToRedeem, setPointsToRedeem] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Conversion rate: 1 point = ₹0.25 (example)
  const POINTS_TO_CURRENCY_RATE = 0.25;
  const redeemedValue = pointsToRedeem ? (parseInt(pointsToRedeem, 10) * POINTS_TO_CURRENCY_RATE).toFixed(2) : '0.00';

  const handleRedeem = async () => {
    const points = parseInt(pointsToRedeem, 10);
    if (!points || points <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number of points to redeem.');
      return;
    }
    if (points > availablePoints) {
      Alert.alert('Insufficient Points', `You only have ${availablePoints} points available.`);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/rewards/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          pointsToRedeem: points,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to redeem points.');
      }

      Alert.alert(
        'Success!',
        `${points} points have been redeemed for ₹${redeemedValue}. The amount has been added to your wallet.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Redemption Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={require('../assets/image.png')} style={styles.background} resizeMode="cover">
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Redeem Your Points</Text>
          <Text style={styles.subtitle}>You have <Text style={{ fontWeight: 'bold', color: ACCENT_GOLD }}>{availablePoints.toLocaleString()}</Text> points available.</Text>

          <View style={styles.inputContainer}>
            <Icon name="star-circle" size={24} color={CHOCOLATE_LIGHT} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter points to redeem"
              placeholderTextColor={CHOCOLATE_MEDIUM}
              keyboardType="number-pad"
              value={pointsToRedeem}
              onChangeText={setPointsToRedeem}
            />
          </View>

          <Text style={styles.valueText}>Equals: <Text style={{ fontWeight: 'bold' }}>₹{redeemedValue}</Text></Text>

          <TouchableOpacity style={styles.redeemButton} onPress={handleRedeem} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={CHOCOLATE_DARK} />
            ) : (
              <Text style={styles.redeemButtonText}>Redeem Now</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: 'rgba(78, 42, 30, 0.95)', // CHOCOLATE_DARK with opacity
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 5 },
    elevation: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: TEXT_LIGHT,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: CHOCOLATE_LIGHT,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    width: '100%',
    marginBottom: 12,
  },
  inputIcon: {
    marginLeft: 15,
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    color: TEXT_LIGHT,
    fontSize: 18,
  },
  valueText: {
    fontSize: 16,
    color: TEXT_LIGHT,
    marginBottom: 24,
  },
  redeemButton: {
    backgroundColor: ACCENT_GOLD,
    borderRadius: 12,
    width: '100%',
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redeemButtonText: {
    color: CHOCOLATE_DARK,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default RedeemScreen; 