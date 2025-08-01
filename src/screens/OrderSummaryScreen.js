import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator, 
  Alert,
  FlatList,
  Modal,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCart } from '../context/CartContext';
import { useNavigation } from '@react-navigation/native';
import { API_BASE } from '../lib/api';
import { AuthContext } from '../context/AuthContext';
import { Picker } from '@react-native-picker/picker';
import RazorpayPayment from '../components/RazorpayPayment';

// WALLET RESTRICTION: Users can only use up to 5% of their order total from their wallet balance
// This prevents excessive wallet usage and encourages other payment methods

function AppHeader() {
  return (
    <SafeAreaView style={styles.headerSafeArea}>
      <View style={styles.headerContainer}>
        <Image source={require('./assets/lele.png')} style={styles.headerLogo} resizeMode="contain" />
      </View>
    </SafeAreaView>
  );
}

export default function OrderSummaryScreen({ route }) {
  const { cartItems, clearCart, addToCart, removeFromCart, validateCart, fetchCart, buyNow } = useCart();
  const { user } = React.useContext(AuthContext);
  const navigation = useNavigation();
  const buyNowProduct = route?.params?.buyNowProduct;
  const initialBuyNowQty = route?.params?.buyNowQty || 1;
  const [buyNowQty, setBuyNowQty] = useState(initialBuyNowQty);
  // If buyNowProduct is present, use it for summary
  const items = buyNowProduct ? [{ product: buyNowProduct, quantity: buyNowQty }] : cartItems;
  
  // State management
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null); // cod, online, razorpay
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [showRazorpayPayment, setShowRazorpayPayment] = useState(false);
  const [addForm, setAddForm] = useState({
    addressName: 'Home',
    fullName: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    addressType: 'both',
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  // Add validation state for Add Address
  const [addFormErrors, setAddFormErrors] = useState({});

  // Reward and wallet state (match Checkout page)
  const [walletBalance, setWalletBalance] = useState(0);
  // Remove rewardToRedeem and rewardApplied
  // const [rewardToRedeem, setRewardToRedeem] = useState('');
  const [walletToRedeem, setWalletToRedeem] = useState('');
  const [walletError, setWalletError] = useState('');

  // Only keep rewardInput
  const [walletInput, setWalletInput] = useState('');
  // Remove rewardApplied, only keep walletApplied if needed
  // const [rewardApplied, setRewardApplied] = useState(false);
  const [walletApplied, setWalletApplied] = useState(false);

  // Calculate order summary
  const subtotal = items.reduce((sum, item) => sum + item.product.price * (buyNowProduct ? buyNowQty : item.quantity), 0);
  const gst = subtotal * 0.18; // 18% GST
  const deliveryCharge = 0; // Always free shipping, match website
  
  // Calculate max redeemable with 5% restriction
  const walletValue = Number(walletToRedeem) || 0;
  const orderTotalBeforeWallet = subtotal + deliveryCharge;
  const maxWalletUsage = Math.floor(orderTotalBeforeWallet * 0.05); // 5% of order total
  const walletDiscount = walletValue > 0 ? Math.min(walletValue, walletBalance, maxWalletUsage) : 0;
  const finalTotal = Math.max(0, subtotal + deliveryCharge - walletDiscount);

  // Helper function to calculate 5% wallet restriction
  const calculateMaxWalletUsage = (orderTotal) => {
    return Math.floor(orderTotal * 0.05);
  };

  // Validate input with 5% restriction
  useEffect(() => {
    if (Number(walletToRedeem) > walletBalance) {
      setWalletError('Not enough wallet balance');
    } else if (Number(walletToRedeem) > maxWalletUsage) {
      setWalletError(`Maximum wallet usage is 5% of order total (₹${maxWalletUsage})`);
    } else {
      setWalletError('');
    }
  }, [walletToRedeem, walletBalance, maxWalletUsage]);

  // Fetch reward and wallet balances
  useEffect(() => {
    if (!user) return;
    const fetchBalances = async () => {
      try {
        // Wallet
        const walletRes = await fetch(`${API_BASE}/api/wallet`, { credentials: 'include' });
        if (walletRes.ok) {
          const walletData = await walletRes.json();
          setWalletBalance(walletData.balance || 0);
        }
      } catch {}
    };
    fetchBalances();
  }, [user]);

  useEffect(() => {
    fetchAddresses();
  }, []);

  // After selecting an address (selectedAddress), if it is missing or incomplete but an addressId exists, fetch the address from the API
  useEffect(() => {
    if (!selectedAddress && addresses.length > 0) return;
    if (selectedAddress && (!selectedAddress.address || !selectedAddress.city || !selectedAddress.state || !selectedAddress.pincode) && selectedAddress.id) {
      fetch(`${API_BASE}/api/addresses/${selectedAddress.id}`, { credentials: 'include' })
        .then(res => res.ok ? res.json() : null)
        .then(addr => {
          if (addr && addr.address) {
            setSelectedAddress(addr);
          }
        })
        .catch(() => {});
    }
  }, [selectedAddress, addresses]);

  const fetchAddresses = async () => {
    setAddressLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/addresses`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (res.status === 401) {
        setAddressLoading(false);
        Alert.alert('Login Required', 'Please login to continue.', [
          { text: 'OK', onPress: () => navigation.navigate('Account') }
        ]);
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch addresses');
      const data = await res.json();
      setAddresses(data);
      if ((!selectedAddress || !data.some(a => a.id === selectedAddress.id)) && data.length > 0) {
        setSelectedAddress(data[0]);
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to fetch addresses');
    } finally {
      setAddressLoading(false);
    }
  };



  const handleRazorpaySuccess = async (orderId) => {
    await clearCart();
    // Refetch wallet and rewards balances after order
    try {
      const walletRes = await fetch(`${API_BASE}/api/wallet`, { credentials: 'include' });
      if (walletRes.ok) {
        const walletData = await walletRes.json();
        setWalletBalance(walletData.balance || 0);
      }
    } catch {}
    navigation.navigate('OrderConfirmation', { order: { id: orderId } });
  };

  const handleRazorpayError = (error) => {
    Alert.alert('Payment Failed', error || 'Payment was unsuccessful. Please try again.');
  };

  const handleRazorpayCancel = () => {
    setShowRazorpayPayment(false);
  };

  const placeOrder = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to continue.', [
        { text: 'OK', onPress: () => navigation.navigate('Account') }
      ]);
      return;
    }
    if (!selectedAddress) {
      Alert.alert('Select Address', 'Please select a shipping address.');
      return;
    }
    if (!paymentMethod) {
      Alert.alert('Select Payment Method', 'Please select a payment method before placing your order.');
      return;
    }

    // Handle Razorpay payment
    if (paymentMethod === 'razorpay') {
      setShowRazorpayPayment(true);
      return;
    }

    setPlacingOrder(true);
    try {
      // Validate cart before placing order
      const isValid = await validateCart();
      if (!isValid) {
        Alert.alert('Cart Updated', 'Some items in your cart were updated. Please review and try again.');
        setPlacingOrder(false);
        return;
      }

      if (buyNowProduct) {
        try {
          // Use the buyNow function from cart context
          await buyNow(buyNowProduct, buyNowQty);
          
          // Wait a moment for cart to update
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Refresh cart to ensure it's updated
          await fetchCart();
        } catch (err) {
          console.error('Buy now error:', err);
          Alert.alert('Cart Error', err.message || 'Failed to add product to cart');
          setPlacingOrder(false);
          return;
        }
      }

      // Debug: Log the order payload
      const orderPayload = {
        addressId: selectedAddress.id,
        shippingDetails: {
          name: selectedAddress.fullName || user?.username || '',
          email: user?.email || '',
          phone: selectedAddress.phone || user?.phone || '',
          address: selectedAddress.address,
          city: selectedAddress.city,
          state: selectedAddress.state,
          zipCode: selectedAddress.pincode,
          pincode: selectedAddress.pincode,
          country: selectedAddress.country || 'India',
          addressType: selectedAddress.addressType,
          addressName: selectedAddress.addressName,
        },
        paymentMethod,
        walletDiscount: walletDiscount, // Use the restricted wallet discount
        walletCoinsUsed: walletDiscount, // Use the restricted wallet coins used
      };
      console.log('Order payload:', orderPayload);
      
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(orderPayload),
      });
      
      if (res.status === 401) {
        setPlacingOrder(false);
        Alert.alert('Login Required', 'Please login to continue.', [
          { text: 'OK', onPress: () => navigation.navigate('Account') }
        ]);
        return;
      }
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Order failed');
      }
      
      const orderData = await res.json();
      // Debug: Log the backend response
      console.log('Order response:', orderData);
      
      // Clear cart after successful order
      await clearCart();
      
      // Refetch wallet and rewards balances after order
      try {
        const walletRes = await fetch(`${API_BASE}/api/wallet`, { credentials: 'include' });
        if (walletRes.ok) {
          const walletData = await walletRes.json();
          setWalletBalance(walletData.balance || 0);
        }
      } catch {}
      
      navigation.navigate('OrderConfirmation', { order: orderData });
    } catch (err) {
      Alert.alert('Order Failed', err.message || 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

  const validateAddForm = () => {
    const errors = {};
    if (!addForm.addressName.trim()) errors.addressName = 'Address name is required';
    if (!addForm.fullName.trim()) errors.fullName = 'Full name is required';
    if (!addForm.address.trim()) errors.address = 'Address is required';
    if (!addForm.city.trim()) errors.city = 'City is required';
    if (!addForm.state.trim()) errors.state = 'State is required';
    if (!/^\d{6}$/.test(addForm.pincode)) errors.pincode = 'Enter a valid 6-digit pincode';
    if (!/^\d{10}$/.test(addForm.phone)) errors.phone = 'Enter a valid 10-digit phone number';
    if (!addForm.addressType) errors.addressType = 'Required';
    setAddFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddAddress = async () => {
    setAddError('');
    if (!validateAddForm()) return;
    setAddLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(addForm),
      });
      if (!res.ok) throw new Error('Failed to add address');
      setAddModalVisible(false);
      setAddForm({ addressName: 'Home', fullName: '', address: '', city: '', state: '', pincode: '', phone: '', addressType: 'both' });
      await fetchAddresses();
      setTimeout(() => {
        setSelectedAddress((prev) => addresses[addresses.length]);
      }, 500);
    } catch (err) {
      setAddError(err.message || 'Failed to add address');
    } finally {
      setAddLoading(false);
    }
  };

  const renderProductItem = ({ item }) => (
    <View style={styles.productItem}>
      <Image 
        source={{ uri: item.product.imageUrl || (item.product.images && item.product.images[0]) || 'https://placehold.co/60x60?text=No+Image' }} 
        style={styles.productImage} 
      />
      <View style={styles.productDetails}>
        <Text style={styles.productName}>{item.product.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Text style={styles.productPrice}>₹{item.product.price} × </Text>
          {buyNowProduct ? (
            <>
              <TouchableOpacity
                onPress={() => {
                  if (buyNowQty > 1) setBuyNowQty(q => q - 1);
                }}
                style={{ paddingHorizontal: 8, paddingVertical: 2 }}
                disabled={buyNowQty <= 1}
              >
                <Icon name="minus-circle-outline" size={22} color={buyNowQty > 1 ? "#2874f0" : "#ccc"} />
              </TouchableOpacity>
              <Text style={[styles.productPrice, { minWidth: 24, textAlign: 'center' }]}>{buyNowQty}</Text>
              <TouchableOpacity
                onPress={() => setBuyNowQty(q => q + 1)}
                style={{ paddingHorizontal: 8, paddingVertical: 2 }}
              >
                <Icon name="plus-circle-outline" size={22} color="#2874f0" />
              </TouchableOpacity>
              {/* Remove button for Buy Now mode */}
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ paddingHorizontal: 8, paddingVertical: 2 }}
              >
                <Icon name="trash-can-outline" size={22} color="#b85c5c" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => {
                  if (item.quantity === 1) {
                    removeFromCart(item.id);
                  } else {
                    addToCart(item.product, -1);
                  }
                }}
                style={{ paddingHorizontal: 8, paddingVertical: 2 }}
              >
                <Icon name="minus-circle-outline" size={22} color="#2874f0" />
              </TouchableOpacity>
              <Text style={[styles.productPrice, { minWidth: 24, textAlign: 'center' }]}>{item.quantity}</Text>
              <TouchableOpacity
                onPress={() => addToCart(item.product, 1)}
                style={{ paddingHorizontal: 8, paddingVertical: 2 }}
              >
                <Icon name="plus-circle-outline" size={22} color="#2874f0" />
              </TouchableOpacity>
              {/* Remove button for cart mode */}
              <TouchableOpacity
                onPress={() => removeFromCart(item.id)}
                style={{ paddingHorizontal: 8, paddingVertical: 2 }}
              >
                <Icon name="trash-can-outline" size={22} color="#b85c5c" />
              </TouchableOpacity>
            </>
          )}
        </View>
        <Text style={styles.productTotal}>₹{item.product.price * (buyNowProduct ? buyNowQty : item.quantity)}</Text>
      </View>
    </View>
  );

  const renderAddressItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.addressItem, selectedAddress && selectedAddress.id === item.id && styles.selectedAddress]}
      onPress={() => setSelectedAddress(item)}
    >
      <View style={styles.addressHeader}>
        <Text style={styles.addressName}>{item.addressName || item.fullName}</Text>
        {selectedAddress && selectedAddress.id === item.id && (
          <Icon name="check-circle" size={20} color="#2874f0" />
        )}
      </View>
      <Text style={styles.addressText}>{item.address}</Text>
      <Text style={styles.addressText}>{item.city}, {item.state} {item.pincode}</Text>
      <Text style={styles.addressText}>{item.phone}</Text>
    </TouchableOpacity>
  );

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <AppHeader />
        <View style={styles.emptyContent}>
          <Icon name="cart-off" size={80} color="#ccc" style={{ marginBottom: 16 }} />
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <TouchableOpacity style={styles.shopNowBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.shopNowText}>Shop Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color="#2874f0" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Summary</Text>
        </View>

        {/* Products Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Products ({items.length})</Text>
          <FlatList
            data={items}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.product.id.toString()}
            scrollEnabled={false}
          />
        </View>

        {/* Rewards & Wallet Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Redeem Rewards & Wallet</Text>
          <View style={{ marginBottom: 10 }}>
            <Text style={{ color: '#888', fontWeight: 'bold', marginBottom: 2 }}>Wallet Balance: <Text style={{ color: '#2874f0' }}>{walletBalance}</Text></Text>
            <Text style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>Maximum wallet usage: 5% of order total (₹{maxWalletUsage})</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                style={[styles.input, { borderColor: walletError ? '#e53935' : '#eee', marginBottom: 4, flex: 1 }]}
                placeholder={`Enter wallet amount (max ₹${Math.min(walletBalance, maxWalletUsage)})`}
                placeholderTextColor="#a58a6a"
                keyboardType="numeric"
                value={walletInput}
                onChangeText={v => setWalletInput(v.replace(/[^0-9]/g, ''))}
                maxLength={6}
              />
              <TouchableOpacity
                style={{ marginLeft: 8, backgroundColor: '#2874f0', borderRadius: 6, paddingVertical: 10, paddingHorizontal: 16 }}
                onPress={() => setWalletToRedeem(walletInput)}
                disabled={!walletInput || !!walletError}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Apply</Text>
              </TouchableOpacity>
            </View>
            {walletError ? <Text style={{ color: '#e53935', marginBottom: 4 }}>{walletError}</Text> : null}
          </View>
        </View>

        {/* Price Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Details</Text>
          <View style={styles.priceBreakdown}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Subtotal</Text>
              <Text style={styles.priceValue}>₹{subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Delivery Charge</Text>
              <Text style={styles.priceValue}>
                {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
              </Text>
            </View>
            {walletDiscount > 0 && (
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, { color: '#388e3c' }]}>Wallet Used</Text>
                <Text style={[styles.priceValue, { color: '#388e3c' }]}>-₹{walletDiscount.toFixed(2)}</Text>
              </View>
            )}
            {walletDiscount > 0 && walletValue > maxWalletUsage && (
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, { color: '#ff9800', fontSize: 12 }]}>5% restriction applied</Text>
                <Text style={[styles.priceValue, { color: '#ff9800', fontSize: 12 }]}>₹{maxWalletUsage}</Text>
              </View>
            )}
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{finalTotal.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Shipping Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shipping Address</Text>
            <TouchableOpacity style={styles.addAddressBtn} onPress={() => setAddModalVisible(true)}>
              <Icon name="plus" size={16} color="#2874f0" />
              <Text style={styles.addAddressText}>Add Address</Text>
            </TouchableOpacity>
          </View>
          {addressLoading ? (
            <ActivityIndicator size="large" color="#2874f0" style={styles.loader} />
          ) : addresses.length === 0 ? (
            <View style={styles.noAddressContainer}>
              <Text style={styles.noAddressText}>No address found</Text>
              <TouchableOpacity style={styles.addAddressBtnPrimary} onPress={() => setAddModalVisible(true)}>
                <Icon name="plus" size={18} color="#fff" />
                <Text style={styles.addAddressTextPrimary}>Add Address</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ marginBottom: 12 }}>
              <Picker
                selectedValue={selectedAddress?.id}
                onValueChange={id => {
                  const addr = addresses.find(a => a.id === id);
                  setSelectedAddress(addr);
                }}
                style={[styles.input, { marginBottom: 12 }]}
              >
                {addresses.map(addr => (
                  <Picker.Item
                    key={addr.id}
                    label={`${addr.addressName || addr.fullName} - ${addr.address}, ${addr.city}`}
                    value={addr.id}
                  />
                ))}
              </Picker>
              {selectedAddress && (
                <View style={{ marginTop: 8, padding: 8, backgroundColor: '#f9f9f9', borderRadius: 8 }}>
                  <Text style={{ fontWeight: 'bold' }}>{selectedAddress.fullName}</Text>
                  <Text>{selectedAddress.address}</Text>
                  <Text>{selectedAddress.city}, {selectedAddress.state} {selectedAddress.pincode}</Text>
                  <Text>{selectedAddress.phone}</Text>
                </View>
              )}
            </View>
          )}
          {/* Add Address Modal */}
          <Modal visible={addModalVisible} animationType="slide" transparent>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '90%' }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Add Address</Text>
                <TextInput placeholder="Address Name (e.g. Home, Work)" value={addForm.addressName} onChangeText={t => setAddForm(f => ({ ...f, addressName: t }))} style={styles.input} placeholderTextColor="#a58a6a" />
                {addFormErrors.addressName ? <Text style={{ color: 'red', marginBottom: 8 }}>{addFormErrors.addressName}</Text> : null}
                <TextInput placeholder="Full Name" value={addForm.fullName} onChangeText={t => setAddForm(f => ({ ...f, fullName: t }))} style={styles.input} placeholderTextColor="#a58a6a" />
                {addFormErrors.fullName ? <Text style={{ color: 'red', marginBottom: 8 }}>{addFormErrors.fullName}</Text> : null}
                <TextInput
                  placeholder="Pincode"
                  value={addForm.pincode}
                  onChangeText={async (text) => {
                    const digits = text.replace(/[^0-9]/g, '').slice(0, 6);
                    setAddForm(f => ({ ...f, pincode: digits }));
                    if (digits.length === 6) {
                      // Use the same API as in AddressesScreen.js, or fallback to postalpincode.in
                      try {
                        const res = await fetch(`https://api.postalpincode.in/pincode/${digits}`);
                        const data = await res.json();
                        if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice.length > 0) {
                          const postOffice = data[0].PostOffice[0];
                          setAddForm(f => ({ ...f, state: postOffice.State, city: postOffice.District }));
                          setAddFormErrors(prev => ({ ...prev, pincode: '' }));
                        } else {
                          setAddFormErrors(prev => ({ ...prev, pincode: 'Pincode is wrong' }));
                        }
                      } catch {
                        setAddFormErrors(prev => ({ ...prev, pincode: 'Pincode is wrong' }));
                      }
                    } else {
                      if (digits.length > 0 && digits.length < 6) {
                        setAddFormErrors(prev => ({ ...prev, pincode: 'Enter a valid 6-digit pincode' }));
                      } else {
                        setAddFormErrors(prev => ({ ...prev, pincode: '' }));
                      }
                    }
                  }}
                  keyboardType="numeric"
                  maxLength={6}
                  style={styles.input}
                  placeholderTextColor="#a58a6a"
                />
                {addFormErrors.pincode ? <Text style={{ color: 'red', marginBottom: 8 }}>{addFormErrors.pincode}</Text> : null}
                <TextInput placeholder="Address" value={addForm.address} onChangeText={t => setAddForm(f => ({ ...f, address: t }))} style={styles.input} placeholderTextColor="#a58a6a" />
                {addFormErrors.address ? <Text style={{ color: 'red', marginBottom: 8 }}>{addFormErrors.address}</Text> : null}
                <TextInput placeholder="City" value={addForm.city} onChangeText={t => setAddForm(f => ({ ...f, city: t }))} style={styles.input} placeholderTextColor="#a58a6a" />
                {addFormErrors.city ? <Text style={{ color: 'red', marginBottom: 8 }}>{addFormErrors.city}</Text> : null}
                <TextInput placeholder="State" value={addForm.state} onChangeText={t => setAddForm(f => ({ ...f, state: t }))} style={styles.input} placeholderTextColor="#a58a6a" />
                {addFormErrors.state ? <Text style={{ color: 'red', marginBottom: 8 }}>{addFormErrors.state}</Text> : null}
                <TextInput
                  placeholder="Phone"
                  value={addForm.phone}
                  onChangeText={v => {
                    const digits = v.replace(/[^0-9]/g, '').slice(0, 10);
                    setAddForm(f => ({ ...f, phone: digits }));
                    if (digits.length === 10) {
                      setAddFormErrors(prev => ({ ...prev, phone: '' }));
                    } else if (digits.length > 0 && digits.length < 10) {
                      setAddFormErrors(prev => ({ ...prev, phone: 'Enter a valid 10-digit phone number' }));
                    } else {
                      setAddFormErrors(prev => ({ ...prev, phone: '' }));
                    }
                  }}
                  keyboardType="phone-pad"
                  maxLength={10}
                  style={styles.input}
                  placeholderTextColor="#a58a6a"
                />
                {addFormErrors.phone ? <Text style={{ color: 'red', marginBottom: 8 }}>{addFormErrors.phone}</Text> : null}
                {/* Address Type Dropdown */}
                <View style={{ borderWidth: 1, borderColor: '#eee', borderRadius: 8, marginBottom: 10 }}>
                  <Picker
                    selectedValue={addForm.addressType}
                    onValueChange={itemValue => setAddForm({ ...addForm, addressType: itemValue })}
                    style={[styles.input, { marginBottom: 12 }]}
                  >
                    <Picker.Item label="Both" value="both" />
                    <Picker.Item label="Home" value="home" />
                    <Picker.Item label="Work" value="work" />
                    <Picker.Item label="Other" value="other" />
                  </Picker>
                </View>
                {addFormErrors.addressType ? <Text style={{ color: 'red', marginBottom: 8 }}>{addFormErrors.addressType}</Text> : null}
                {addError ? <Text style={{ color: 'red', marginBottom: 8 }}>{addError}</Text> : null}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                  <TouchableOpacity onPress={() => setAddModalVisible(false)} style={{ marginRight: 16 }}><Text style={{ color: '#2874f0', fontWeight: 'bold' }}>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity onPress={handleAddAddress} disabled={addLoading} style={{ backgroundColor: '#2874f0', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 20 }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>{addLoading ? 'Saving...' : 'Save'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentMethods}>
            <TouchableOpacity
              style={[styles.paymentMethod, paymentMethod === 'cod' && styles.selectedPayment]}
              onPress={() => setPaymentMethod('cod')}
            >
              <Icon name="cash" size={24} color={paymentMethod === 'cod' ? '#2874f0' : '#666'} />
              <Text style={[styles.paymentText, paymentMethod === 'cod' && styles.selectedPaymentText]}>
                Cash on Delivery
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paymentMethod, paymentMethod === 'razorpay' && styles.selectedPayment]}
              onPress={() => setPaymentMethod('razorpay')}
            >
              <Icon name="credit-card-outline" size={24} color={paymentMethod === 'razorpay' ? '#2874f0' : '#666'} />
              <Text style={[styles.paymentText, paymentMethod === 'razorpay' && styles.selectedPaymentText]}>
                Online Payment (Cards, UPI, Net Banking)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Payment Button */}
      <View style={styles.paymentSection}>
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalAmount}>₹{finalTotal.toFixed(2)}</Text>
        </View>
        <TouchableOpacity 
          style={styles.paymentBtn} 
          onPress={placeOrder} 
          disabled={placingOrder || !selectedAddress}
        >
          <Text style={styles.paymentBtnText}>
            {placingOrder ? 'Processing...' : paymentMethod ? `Pay ₹${finalTotal.toFixed(2)}` : 'Select Payment Method'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Razorpay Payment Modal */}
      <Modal
        visible={showRazorpayPayment}
        animationType="slide"
        transparent={false}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowRazorpayPayment(false)} style={styles.backBtn}>
              <Icon name="arrow-left" size={24} color="#2874f0" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Razorpay Payment</Text>
          </View>
          
          <RazorpayPayment
            amount={finalTotal * 100} // Convert to paise
            shippingDetails={{
              name: selectedAddress?.fullName || user?.username || '',
              email: user?.email || '',
              phone: selectedAddress?.phone || user?.phone || '',
              address: selectedAddress?.address || '',
              city: selectedAddress?.city || '',
              state: selectedAddress?.state || '',
              zipCode: selectedAddress?.pincode || '',
            }}
            onSuccess={handleRazorpaySuccess}
            onError={handleRazorpayError}
            onCancel={handleRazorpayCancel}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  headerSafeArea: {
    backgroundColor: '#fff',
  },
  headerContainer: {
    alignItems: 'center',
    padding: 12,
  },
  headerLogo: {
    width: 120,
    height: 40,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  productTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2874f0',
  },
  priceBreakdown: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 15,
    color: '#555',
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2874f0',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 12,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2874f0',
  },
  addressItem: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  selectedAddress: {
    borderColor: '#2874f0',
    backgroundColor: '#e3f2fd',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  addressText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  addAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addAddressText: {
    color: '#2874f0',
    fontSize: 14,
    marginLeft: 4,
  },
  addAddressBtnPrimary: {
    backgroundColor: '#2874f0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  addAddressTextPrimary: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  noAddressContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noAddressText: {
    color: '#888',
    fontSize: 16,
    marginBottom: 12,
  },
  loader: {
    paddingVertical: 20,
  },
  paymentMethods: {
    gap: 12,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    padding: 16,
  },
  selectedPayment: {
    borderColor: '#2874f0',
    backgroundColor: '#e3f2fd',
  },
  paymentText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
  },
  selectedPaymentText: {
    color: '#2874f0',
    fontWeight: '600',
  },
  paymentSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2874f0',
  },
  paymentBtn: {
    backgroundColor: '#2874f0',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  paymentBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    color: '#888',
    marginBottom: 24,
    textAlign: 'center',
  },
  shopNowBtn: {
    backgroundColor: '#2874f0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  shopNowText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: '#f7f3f0', // very light brown
    borderColor: '#bca18c',     // light brown border
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    marginBottom: 12,
    fontSize: 16,
    color: '#222',              // dark text
  },
}); 