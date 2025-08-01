import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EmailScreen from './EmailScreen';
import OtpScreen from './OtpScreen';
import RegisterScreen from './RegisterScreen';
import ProfileScreen from './ProfileScreen';
import OrdersScreen from './profile/OrdersScreen';
import ReturnsScreen from './profile/ReturnsScreen';
import ReviewsScreen from './profile/ReviewsScreen';
import AddressesScreen from './profile/AddressesScreen';
import RewardsScreen from './profile/RewardsScreen';
import GiftCardsScreen from './profile/GiftCardsScreen';
import WalletScreen from './profile/WalletScreen';
import ShoppingScreen from './profile/ShoppingScreen';
import SettingsScreen from './profile/SettingsScreen';
import WishlistScreen from './profile/WishlistScreen';
import ProfileDetailsScreen from './profile/ProfileDetailsScreen';
import { AuthContext } from '../context/AuthContext';

const Stack = createNativeStackNavigator();

export default function RegistrationStack() {
  const { user } = useContext(AuthContext);
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      {user ? (
        <>
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="ProfileDetails" component={ProfileDetailsScreen} />
          <Stack.Screen name="Orders" component={OrdersScreen} />
          <Stack.Screen name="Returns" component={ReturnsScreen} />
          <Stack.Screen name="Reviews" component={ReviewsScreen} />
          <Stack.Screen name="Addresses" component={AddressesScreen} />
          <Stack.Screen name="Rewards" component={RewardsScreen} />
          <Stack.Screen name="GiftCards" component={GiftCardsScreen} />
          <Stack.Screen name="Wallet" component={WalletScreen} />
          <Stack.Screen name="Shopping" component={ShoppingScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Wishlist" component={WishlistScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Email" component={EmailScreen} />
          <Stack.Screen name="Otp" component={OtpScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
} 