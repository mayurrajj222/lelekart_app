import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Easing } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
const LELE_IMAGE = require('./assets/lele.png');

export default function OrderConfirmationScreen({ route, navigation }) {
  const { order } = route.params || {};
  // Animation for logo and card
  const logoAnim = React.useRef(new Animated.Value(-80)).current;
  const logoOpacity = React.useRef(new Animated.Value(0)).current;
  const cardAnim = React.useRef(new Animated.Value(40)).current;
  const cardOpacity = React.useRef(new Animated.Value(0)).current;
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
      Animated.timing(cardAnim, {
        toValue: 0,
        duration: 700,
        delay: 300,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 700,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  return (
    <View style={styles.bgOrderConfirmMood}>
      <Animated.View style={{ alignItems: 'center', marginBottom: 18, transform: [{ translateY: logoAnim }], opacity: logoOpacity }}>
        <Image source={LELE_IMAGE} style={styles.leleLogoOrderConfirm} resizeMode="contain" />
      </Animated.View>
      <Animated.View style={{ width: '100%', alignItems: 'center', transform: [{ translateY: cardAnim }], opacity: cardOpacity }}>
        <View style={styles.orderCardMood}>
          <Icon name="check-circle" size={72} color="#43a047" style={{ marginBottom: 16 }} />
          <Text style={styles.orderTitleMood}>Order Placed Successfully!</Text>
          {order && (
            <>
              <Text style={styles.orderIdMood}>Order ID: {order.id || order.orderId}</Text>
              <Text style={styles.orderTotalMood}>Total: ₹{order.total || order.amount}</Text>
              {/* Show full shipping address */}
              {(() => {
                let shipping = order.shippingDetails;
                if (!shipping && order.shippingAddress) shipping = order.shippingAddress;
                if (typeof shipping === 'string') {
                  try { shipping = JSON.parse(shipping); } catch { shipping = {}; }
                }
                if (shipping && (shipping.address || shipping.city || shipping.state || shipping.pincode || shipping.zipCode)) {
                  return (
                    <View style={{ marginBottom: 8, marginTop: 2 }}>
                      <Text style={styles.orderShippingMood}>Shipping Address:</Text>
                      {shipping.name ? <Text style={styles.orderShippingMood}>{shipping.name}</Text> : null}
                      {shipping.address ? <Text style={styles.orderShippingMood}>{shipping.address}</Text> : null}
                      <Text style={styles.orderShippingMood}>
                        {[shipping.city, shipping.state, shipping.pincode || shipping.zipCode].filter(Boolean).join(', ')}
                      </Text>
                      {shipping.country ? <Text style={styles.orderShippingMood}>{shipping.country}</Text> : null}
                      {shipping.phone ? <Text style={styles.orderShippingMood}>Phone: {shipping.phone}</Text> : null}
                      {shipping.email ? <Text style={styles.orderShippingMood}>Email: {shipping.email}</Text> : null}
                    </View>
                  );
                }
                return <Text style={styles.orderShippingMood}>Shipping address not available.</Text>;
              })()}
            </>
          )}
          <Text style={styles.thankYouMood}>Thank you for shopping with us!</Text>
          <TouchableOpacity style={styles.buttonMood} onPress={() => {
            try {
              navigation.reset({
                index: 0,
                routes: [
                  { name: 'MainTabs', state: { index: 0, routes: [{ name: 'Home' }] } }
                ],
              });
            } catch (e) {
              navigation.navigate('Home');
            }
          }}>
            <Text style={styles.buttonTextMood}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  bgOrderConfirmMood: {
    flex: 1,
    backgroundColor: '#f7f4ef',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  leleLogoOrderConfirm: {
    width: 160,
    height: 60,
    marginBottom: 8,
  },
  orderCardMood: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 22,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    padding: 28,
    alignItems: 'center',
  },
  orderTitleMood: {
    fontSize: 28,
    fontFamily: 'serif',
    fontWeight: '600',
    color: '#3d3a36',
    marginBottom: 12,
    textAlign: 'center',
  },
  orderIdMood: {
    fontSize: 18,
    color: '#222',
    marginBottom: 4,
    fontFamily: 'serif',
  },
  orderTotalMood: {
    fontSize: 18,
    color: '#222',
    marginBottom: 4,
    fontFamily: 'serif',
  },
  orderShippingMood: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'serif',
  },
  thankYouMood: {
    fontSize: 16,
    color: '#43a047',
    marginVertical: 16,
    textAlign: 'center',
    fontFamily: 'serif',
  },
  buttonMood: {
    backgroundColor: '#3d3a36',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 10,
    marginTop: 16,
    alignItems: 'center',
  },
  buttonTextMood: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 18,
    fontFamily: 'serif',
  },
}); 