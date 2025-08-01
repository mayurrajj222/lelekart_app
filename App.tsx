/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

// import { NewAppScreen } from '@react-native/new-app-screen';
import React, { useState } from 'react';
import { StatusBar, useColorScheme, View, Text, Image, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AuthStack from './src/screens/AuthStack';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider, useCart } from './src/context/CartContext';
import { WishlistProvider } from './src/context/WishlistContext';
import ProductDetail from './src/screens/ProductDetail';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProductListScreen from './src/screens/ProductListScreen';
import SellerProductsScreen from './src/screens/SellerProductsScreen';
import OrderConfirmationScreen from './src/screens/OrderConfirmationScreen';
import OrderSummaryScreen from './src/screens/OrderSummaryScreen';
import OrderDetailScreen from './src/screens/OrderDetailScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import SplashScreen from './src/components/SplashScreen';

// Import your actual screen components
import HomeTab from './src/screens/HomeTab';
import CategoryTab from './src/screens/CategoryTab';
import CartTab from './src/screens/CartTab';
import ProfileTab from './src/screens/ProfileTab';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainApp() {
  const isDarkMode = useColorScheme() === 'dark';
  const { cartItems } = useCart();
  const totalCartItems = cartItems.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#6B3F1D',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          height: 62,
          paddingBottom: 6,
          paddingTop: 6,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '600',
          marginBottom: 2,
        },
        tabBarIcon: ({ color, size, focused }) => {
          if (route.name === 'Categories') {
            return (
              <Image
                source={require('./src/screens/assets/category.png')}
                style={{ width: 25, height: 25, tintColor: color, resizeMode: 'contain' }}
              />
            );
          }
          if (route.name === 'Cart') {
            const iconName = focused ? 'cart' : 'cart-outline';
            return (
              <View style={{ width: 24, height: 24 }}>
                <Icon name={iconName} size={24} color={color} />
                {totalCartItems > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{totalCartItems > 9 ? '9+' : totalCartItems}</Text>
                  </View>
                )}
              </View>
            );
          }
          let iconName = '';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          if (route.name === 'Account') iconName = focused ? 'account' : 'account-outline';
          return <Icon name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeTab} />
      <Tab.Screen name="Categories" component={CategoryTab} />
      <Tab.Screen name="Cart" component={CartTab} />
      <Tab.Screen name="Account" component={ProfileTab} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainApp} />
      <Stack.Screen name="ProductList" component={ProductListScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetail} />
      <Stack.Screen name="SellerProducts" component={SellerProductsScreen} />
      <Stack.Screen name="OrderSummary" component={OrderSummaryScreen} />
      <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </Stack.Navigator>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const isDarkMode = useColorScheme() === 'dark';

  const handleSplashEnd = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onVideoEnd={handleSplashEnd} />;
  }

  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <NavigationContainer>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <RootNavigator />
          </NavigationContainer>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  cartBadge: {
    position: 'absolute',
    right: -8,
    top: -4,
    backgroundColor: '#e91e63',
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default App;
