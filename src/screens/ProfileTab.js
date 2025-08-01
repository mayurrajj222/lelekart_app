import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  ImageBackground
} from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthContext } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import {launchImageLibrary} from 'react-native-image-picker';
import { API_BASE } from '../lib/api';
import AddressesScreen from './profile/AddressesScreen';
import GiftCardsScreen from './profile/GiftCardsScreen';
import WalletScreen from './profile/WalletScreen';
import SettingsScreen from './profile/SettingsScreen';
import WishlistScreen from './profile/WishlistScreen';
import OrdersScreen from './profile/OrdersScreen';
import AuthStack from './AuthStack';
import { fetchAddresses, fetchWishlist, fetchWallet } from '../lib/api';
import SellerProfileScreen from './profile/SellerProfileScreen';
import SellerDashboardScreen from './profile/SellerDashboardScreen';
import SellerProductsScreen from './profile/SellerProductsScreen';
import SellerAnalyticsScreen from './profile/SellerAnalyticsScreen';
import SellerOrdersScreen from './profile/SellerOrdersScreen';
import SellerBulkImportScreen from './profile/SellerBulkImportScreen';
import SellerInventoryScreen from './profile/SellerInventoryScreen';
import SellerPaymentsScreen from './profile/SellerPaymentsScreen';
import SellerReturnsScreen from './profile/SellerReturnsScreen';
import AddProductScreen from './profile/AddProductScreen';
import EditProductScreen from './profile/EditProductScreen';
import { View as RNView, Text as RNText } from 'react-native';
import ProductListScreen from './ProductListScreen'; // Fixed import path
import FaqScreen from './profile/FaqScreen';
import ReturnsScreen from './profile/ReturnsScreen';
import ReviewsScreen from './profile/ReviewsScreen';
import RewardsScreen from './profile/RewardsScreen';
import RedeemScreen from './profile/RedeemScreen';

const Stack = createStackNavigator();

function ProfileHomeScreen({ navigation }) {
  const { user, setUser, logout } = useContext(AuthContext);
  const BG_IMAGE = require('./assets/image.png');

  const [profileInfo, setProfileInfo] = useState({ username: user?.username || '' });
  useFocusEffect(
    React.useCallback(() => {
      // Fetch latest profile info from backend
      fetch(`${API_BASE}/api/user`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.username) setProfileInfo({ username: data.username });
        });
    }, [])
  );

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]
    );
  };

  const actionCards = [
    { id: 'return', title: 'Return', icon: 'package-variant-closed', onPress: () => navigation.navigate('Returns') },
    { id: 'review', title: 'Review', icon: 'star-outline', onPress: () => navigation.navigate('Reviews') },
    { id: 'reward', title: 'Reward', icon: 'trophy-outline', onPress: () => navigation.navigate('Rewards') },
  ];

  const options = [
    {
      id: 'wishlist',
      title: 'Your wishlists',
      icon: 'heart-outline',
      onPress: () => navigation.navigate('Wishlist'),
    },
    {
      id: 'orders',
      title: 'Order History',
      icon: 'file-document-outline',
      onPress: () => navigation.navigate('Orders'),
    },
    {
      id: 'addresses',
      title: 'Saved Addresses',
      icon: 'map-marker-outline',
      onPress: () => navigation.navigate('Addresses'),
    },
    {
      id: 'wallet',
      title: 'Wallet',
      icon: 'wallet-outline',
      onPress: () => navigation.navigate('Wallet'),
    },
    {
      id: 'help',
      title: 'Need help? Contact us',
      icon: 'message-question-outline',
      onPress: () => navigation.navigate('Faq'),
    },
    {
      id: 'logout',
      title: 'Log out',
      icon: 'logout',
      onPress: handleLogout,
      color: '#b05a2a',
    },
  ];

  return (
    <ImageBackground source={BG_IMAGE} style={styles.profileBgImage} resizeMode="cover">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Official logo above avatar */}
        <Image source={require('./assets/lele.png')} style={styles.leleLogoProfile} resizeMode="contain" />
        {/* Edit icon top right */}
        <TouchableOpacity style={styles.profileEditIconOnImage} onPress={() => navigation.navigate('Settings')}>
          <Icon name="pencil" size={20} color="#6B3F1D" />
        </TouchableOpacity>
        {/* Profile avatar and info */}
        <View style={styles.profileAvatarWrapOnImage}>
          <Image
            source={user?.profileImage ? { uri: user.profileImage } : require('./assets/avatar.png')}
            style={styles.profileAvatarLargeOnImage}
          />
          <Text style={styles.profileNameLargeOnImage}>{profileInfo.username || 'User'}</Text>
          <Text style={styles.profileEmailLargeOnImage}>{user?.email || 'user@example.com'}</Text>
        </View>
        {/* Action Cards */}
        <View style={styles.actionCardsContainer}>
          {actionCards.map(card => (
            <TouchableOpacity key={card.id} style={styles.actionCard} onPress={card.onPress}>
              <Icon name={card.icon} size={26} color="#444" />
              <Text style={styles.actionCardText}>{card.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Options card */}
        <View style={styles.profileOptionsCardOnImage}>
          {options.map((opt, idx) => (
            <TouchableOpacity key={opt.id} style={[styles.profileOptionRowOnImage, idx === options.length - 1 && { borderBottomWidth: 0 }]} onPress={opt.onPress}>
              <Icon name={opt.icon} size={24} color={opt.id === 'logout' ? '#b05a2a' : '#6B3F1D'} style={{ marginRight: 18 }} />
              <Text style={[styles.profileOptionTextOnImage, opt.id === 'logout' && { color: '#b05a2a' }]}>{opt.title}</Text>
              <View style={{ flex: 1 }} />
              {opt.id !== 'logout' && <Icon name="chevron-right" size={20} color="#6B3F1D" />}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

function ProfileTab() {
  const { user } = useContext(AuthContext);
  if (!user) {
    // If not logged in, show AuthStack inside Profile tab
    return <AuthStack />;
  }
  if (user.role === 'seller') {
    try {
      return (
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#2874f0',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="SellerProfile" 
            component={SellerProfileScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Dashboard" 
            component={SellerDashboardScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Products" 
            component={ProductListScreen} // Changed from SellerProductsScreen
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Analytics" 
            component={SellerAnalyticsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Orders" 
            component={SellerOrdersScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="AddProduct" 
            component={AddProductScreen}
            options={{ headerShown: true, title: 'Add Product' }}
          />
          <Stack.Screen 
            name="EditProduct" 
            component={EditProductScreen}
            options={{ headerShown: true, title: 'Edit Product' }}
          />
          <Stack.Screen 
            name="OrderDetails" 
            component={SellerOrdersScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="BulkImport" 
            component={SellerBulkImportScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Inventory" 
            component={SellerInventoryScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="SmartInventory" 
            component={SellerInventoryScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Payments" 
            component={SellerPaymentsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Returns" 
            component={SellerReturnsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{ headerShown: true, title: 'Settings' }}
          />
          <Stack.Screen 
            name="Help" 
            component={FaqScreen}
            options={{ headerShown: true, title: 'Help & FAQ' }}
          />
        </Stack.Navigator>
      );
    } catch (e) {
      return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>Error loading seller profile: {e.message}</Text></View>;
    }
  }
  // If logged in and not seller, show the buyer profile stack
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2874f0',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="ProfileHome" 
        component={ProfileHomeScreen}
        options={{ 
          title: 'My Account',
          headerStyle: { backgroundColor: '#6B3F1D' },
          headerTintColor: '#fff',
          headerShown: false // If you want to hide header for home, set to true to show
        }}
      />
      <Stack.Screen 
        name="Faq" 
        component={FaqScreen}
        options={{ 
          title: 'Help & FAQ',
          headerStyle: { backgroundColor: '#6B3F1D' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="Orders" 
        component={OrdersScreen}
        options={{ 
          title: 'Order History',
          headerStyle: { backgroundColor: '#6B3F1D' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="Addresses" 
        component={AddressesScreen}
        options={{ 
          title: 'Saved Addresses',
          headerStyle: { backgroundColor: '#6B3F1D' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="Wishlist" 
        component={WishlistScreen}
        options={{ 
          title: 'My Wishlist',
          headerStyle: { backgroundColor: '#6B3F1D' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="GiftCards" 
        component={GiftCardsScreen}
        options={{ 
          title: 'Gift Cards',
          headerStyle: { backgroundColor: '#6B3F1D' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="Wallet" 
        component={WalletScreen}
        options={{ 
          title: 'My Wallet',
          headerStyle: { backgroundColor: '#6B3F1D' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ 
          title: 'Settings',
          headerStyle: { backgroundColor: '#6B3F1D' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="Returns" 
        component={ReturnsScreen}
        options={{ 
          title: 'My Returns',
          headerStyle: { backgroundColor: '#6B3F1D' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="Reviews" 
        component={ReviewsScreen}
        options={{ 
          title: 'My Reviews',
          headerStyle: { backgroundColor: '#6B3F1D' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="Rewards" 
        component={RewardsScreen}
        options={{ 
          title: 'My Rewards',
          headerStyle: { backgroundColor: '#6B3F1D' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="Redeem" 
        component={RedeemScreen}
        options={{ 
          title: 'Redeem Points',
          headerStyle: { backgroundColor: '#6B3F1D' },
          headerTintColor: '#fff',
        }}
      />
    </Stack.Navigator>
  );
}

const HelpScreen = () => (
  <RNView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
    <RNText style={{ fontSize: 18, color: '#2874f0', fontWeight: 'bold' }}>Help & Support</RNText>
    <RNText style={{ marginTop: 12, color: '#555', textAlign: 'center', paddingHorizontal: 24 }}>
      For assistance, contact support@lelekart.com or call +91 98774 54036.
    </RNText>
  </RNView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafd',
  },
  
  // Profile Header
  profileHeader: {
    backgroundColor: '#C4A484',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 14,
    color: '#2874f0',
    fontWeight: '600',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  profilePhone: {
    fontSize: 14,
    color: '#666',
  },
  editButton: {
    padding: 8,
  },
  profileUserType: {
    fontSize: 14,
    color: '#4caf50',
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  
  // Stats Container
  statsContainer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    paddingVertical: 20,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: '#e3f2fd',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  statOrders: { backgroundColor: '#2874f0' },
  statWishlist: { backgroundColor: '#e91e63' },
  statWallet: { backgroundColor: '#9c27b0' },
  statAddresses: { backgroundColor: '#4caf50' },
  statIcon: { marginBottom: 2 },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
  },
  refreshBtn: {
    marginLeft: 8,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    width: 36,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  
  // Options Container
  optionsContainer: {
    backgroundColor: '#fff',
    marginTop: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  
  // Logout Section
  logoutSection: {
    backgroundColor: '#fff',
    marginTop: 8,
    paddingVertical: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 16,
    color: '#f44336',
    fontWeight: '600',
    marginLeft: 8,
  },
  profileBg: {
    flex: 1,
    backgroundColor: '#f7f3ef', // lighter chocolate background
    paddingTop: 32,
    alignItems: 'center',
  },
  profileEditIcon: {
    position: 'absolute',
    top: 36,
    right: 24,
    zIndex: 2,
    backgroundColor: '#6B3F1D',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  profileAvatarWrap: {
    alignItems: 'center',
    marginBottom: 18,
  },
  profileAvatarLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 12,
    backgroundColor: '#e7d3c2', // soft chocolate
  },
  profileNameLarge: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6B3F1D',
    marginBottom: 2,
  },
  profileEmailLarge: {
    fontSize: 15,
    color: '#a67c52',
    marginBottom: 2,
  },
  profilePhoneLarge: {
    fontSize: 15,
    color: '#a67c52',
    marginBottom: 2,
  },
  profileTabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#C4A484',
    borderRadius: 16,
    marginBottom: 18,
    alignSelf: 'center',
    marginTop: 2,
  },
  profileTabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 28,
    borderRadius: 16,
  },
  profileTabBtnActive: {
    backgroundColor: '#C4A484',
  },
  profileTabText: {
    fontSize: 15,
    color: '#6B3F1D',
    fontWeight: '600',
  },
  profileTabTextActive: {
    color: '#fff',
  },
  profileOptionsCard: {
    backgroundColor: '#6B3F1D',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 0,
    marginHorizontal: 16,
    width: '92%',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginTop: 8,
  },
  profileOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderBottomWidth: 1,
    borderBottomColor: '#a67c52', // lighter chocolate
  },
  profileOptionText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  profileBgPerfected: {
    flex: 1,
    backgroundColor: '#f9f6f2', // very light chocolate
    paddingTop: 32,
    alignItems: 'center',
  },
  leleLogoProfile: {
    width: 70,
    height: 38,
    marginBottom: 8,
    marginTop: 2,
    alignSelf: 'center',
    opacity: 0.92,
  },
  profileEditIconPerfected: {
    position: 'absolute',
    top: 36,
    right: 24,
    zIndex: 2,
    backgroundColor: '#e7d3c2',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  profileAvatarWrapPerfected: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 2,
  },
  profileAvatarLargePerfected: {
    width: 92,
    height: 92,
    borderRadius: 46,
    marginBottom: 10,
    backgroundColor: '#e7d3c2',
    borderWidth: 2,
    borderColor: '#d1b08a',
  },
  profileNameLargePerfected: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#6B3F1D',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  profileEmailLargePerfected: {
    fontSize: 15,
    color: '#a67c52',
    marginBottom: 2,
  },
  profilePhoneLargePerfected: {
    fontSize: 15,
    color: '#a67c52',
    marginBottom: 2,
  },
  profileTabSwitcherPerfected: {
    flexDirection: 'row',
    backgroundColor: '#e7d3c2',
    borderRadius: 16,
    marginBottom: 18,
    alignSelf: 'center',
    marginTop: 2,
    padding: 2,
    width: 140,
    justifyContent: 'center',
  },
  profileTabBtnActivePerfected: {
    backgroundColor: '#6B3F1D',
    borderRadius: 14,
    paddingVertical: 7,
    paddingHorizontal: 28,
  },
  profileTabTextActivePerfected: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  profileOptionsCardPerfected: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 0,
    marginHorizontal: 16,
    width: '92%',
    shadowColor: '#6B3F1D',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    marginTop: 8,
  },
  profileOptionRowPerfected: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 22,
    borderBottomWidth: 1,
    borderBottomColor: '#f3e3d2',
  },
  profileOptionTextPerfected: {
    fontSize: 16,
    color: '#6B3F1D',
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  profileBgDarkChoco: {
    flex: 1,
    backgroundColor: '#6B3F1D',
    paddingTop: 32,
    alignItems: 'center',
  },
  profileEditIconDarkChoco: {
    position: 'absolute',
    top: 36,
    right: 24,
    zIndex: 2,
    backgroundColor: '#6B3F1D',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  profileAvatarWrapDarkChoco: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 2,
  },
  profileAvatarLargeDarkChoco: {
    width: 92,
    height: 92,
    borderRadius: 46,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileNameLargeDarkChoco: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  profileEmailLargeDarkChoco: {
    fontSize: 15,
    color: '#fff',
    marginBottom: 2,
  },
  profilePhoneLargeDarkChoco: {
    fontSize: 15,
    color: '#fff',
    marginBottom: 2,
  },
  profileTabSwitcherDarkChoco: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 18,
    alignSelf: 'center',
    marginTop: 2,
    padding: 2,
    width: 140,
    justifyContent: 'center',
  },
  profileTabBtnActiveDarkChoco: {
    backgroundColor: '#6B3F1D',
    borderRadius: 14,
    paddingVertical: 7,
    paddingHorizontal: 28,
  },
  profileTabTextActiveDarkChoco: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  profileOptionsCardDarkChoco: {
    backgroundColor: '#6B3F1D',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 0,
    marginHorizontal: 16,
    width: '92%',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    marginTop: 8,
  },
  profileOptionRowDarkChoco: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 22,
    borderBottomWidth: 1,
    borderBottomColor: '#fff',
  },
  profileOptionTextDarkChoco: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  profileBgImage: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 32,
  },
  profileEditIconOnImage: {
    position: 'absolute',
    top: 36,
    right: 24,
    zIndex: 2,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  profileAvatarWrapOnImage: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 2,
  },
  profileAvatarLargeOnImage: {
    width: 92,
    height: 92,
    borderRadius: 46,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#6B3F1D',
  },
  profileNameLargeOnImage: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#6B3F1D',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  profileEmailLargeOnImage: {
    fontSize: 15,
    color: '#6B3F1D',
    marginBottom: 2,
  },
  profilePhoneLargeOnImage: {
    fontSize: 15,
    color: '#6B3F1D',
    marginBottom: 2,
  },
  profileTabSwitcherOnImage: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 16,
    marginBottom: 18,
    alignSelf: 'center',
    marginTop: 2,
    padding: 2,
    width: 140,
    justifyContent: 'center',
  },
  profileTabBtnActiveOnImage: {
    backgroundColor: '#6B3F1D',
    borderRadius: 14,
    paddingVertical: 7,
    paddingHorizontal: 28,
  },
  profileTabTextActiveOnImage: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  profileOptionsCardOnImage: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 0,
    marginHorizontal: 16,
    width: '92%',
    shadowColor: '#6B3F1D',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    marginTop: 8,
  },
  profileOptionRowOnImage: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 22,
    borderBottomWidth: 1,
    borderBottomColor: '#e7d3c2',
  },
  profileOptionTextOnImage: {
    fontSize: 16,
    color: '#6B3F1D',
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  actionCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '92%',
    marginTop: 18,
    marginBottom: 18,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    width: '31%',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  actionCardText: {
    color: '#555',
    fontWeight: '600',
    marginTop: 10,
    fontSize: 13,
  },
  // Add styles for the redeem button
  tierCard: {
    backgroundColor: '#6B3F1D', // CHOCOLATE_DARK
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  redeemButton: {
    backgroundColor: '#C4A484', // ACCENT_GOLD
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  redeemButtonText: {
    color: '#6B3F1D', // CHOCOLATE_DARK
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileTab; 