import React, { useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthContext } from '../context/AuthContext';
import ProfileDetailsScreen from './profile/ProfileDetailsScreen';
import OrdersScreen from './profile/OrdersScreen';
import ReturnsScreen from './profile/ReturnsScreen';
import WishlistScreen from './profile/WishlistScreen';
import ReviewsScreen from './profile/ReviewsScreen';
import AddressesScreen from './profile/AddressesScreen';
import RewardsScreen from './profile/RewardsScreen';
import GiftCardsScreen from './profile/GiftCardsScreen';
import WalletScreen from './profile/WalletScreen';
import ShoppingScreen from './profile/ShoppingScreen';
import SettingsScreen from './profile/SettingsScreen';
import SellerProfileScreen from './profile/SellerProfileScreen';
import { useNavigation } from '@react-navigation/native';

const menuItems = [
  { label: 'My Profile', icon: 'account-circle-outline', key: 'profile', screen: 'ProfileDetails' },
  { label: 'My Orders', icon: 'shopping-outline', key: 'orders', screen: 'Orders' },
  { label: 'Returns & Refunds', icon: 'backup-restore', key: 'returns', screen: 'Returns' },
  { label: 'Wishlist', icon: 'heart-outline', key: 'wishlist', screen: 'Wishlist' },
  { label: 'My Reviews', icon: 'star-outline', key: 'reviews', screen: 'Reviews' },
  { label: 'Manage Addresses', icon: 'map-marker-outline', key: 'addresses', screen: 'Addresses' },
  { label: 'Rewards', icon: 'gift-outline', key: 'rewards', screen: 'Rewards' },
  { label: 'Gift Cards', icon: 'card-giftcard', key: 'giftcards', screen: 'GiftCards' },
  { label: 'My Wallet', icon: 'wallet-outline', key: 'wallet', screen: 'Wallet' },
  { label: 'Go Shopping', icon: 'cart-outline', key: 'shopping', screen: 'Shopping' },
  { label: 'Settings', icon: 'cog-outline', key: 'settings', screen: 'Settings' },
];

export default function ProfileScreen() {
  const { user, logout } = useContext(AuthContext);
  const navigation = useNavigation();

  useEffect(() => {
    if (user && user.role === 'seller') {
      navigation.replace('SellerProfile');
    }
  }, [user, navigation]);

  if (!user) return null;
  if (user.role === 'seller') {
    // Optionally render a loading spinner here if navigation is slow
    return null;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileHeader}>
        {/* Show user-uploaded profile image if available, otherwise show nothing */}
        {user.profileImage ? (
          <Image
            source={{ uri: user.profileImage }}
            style={{ width: 64, height: 64, borderRadius: 32, marginBottom: 8 }}
          />
        ) : null}
        <Text style={styles.profileName}>{user.username || user.email}</Text>
        <Text style={styles.profileEmail}>{user.email}</Text>
      </View>
      <View style={styles.menuList}>
        {menuItems.map(item => (
          <TouchableOpacity
            key={item.key}
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Icon name={item.icon} size={24} color={'#222'} style={{ marginRight: 18 }} />
            <Text style={styles.menuLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.menuItem} onPress={() => { logout(); navigation.replace('Register'); }}>
          <Icon name="logout" size={24} color="#e53935" style={{ marginRight: 18 }} />
          <Text style={[styles.menuLabel, { color: '#e53935', fontWeight: 'bold' }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafd' },
  content: { padding: 0 },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 8,
  },
  profileName: { fontSize: 22, fontWeight: 'bold', color: '#2874f0', marginBottom: 2 },
  profileEmail: { fontSize: 15, color: '#888', marginBottom: 2 },
  menuList: { paddingVertical: 8, backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 12, marginTop: 8, elevation: 2 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  menuLabel: { fontSize: 16, color: '#222' },
}); 