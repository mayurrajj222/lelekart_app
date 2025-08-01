import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, Animated, Easing } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCart } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { API_BASE } from '../lib/api';
import RazorpayPayment from '../components/RazorpayPayment';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands',
  'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh',
  'Lakshadweep', 'Puducherry'
];

const LELE_IMAGE = require('./assets/lele.png');

// Remove chocolate theme colors
// Use a standard palette
const ACCENT_COLOR = '#2874f0';
const BG_COLOR = '#f8fafd';
const CARD_BG = '#fff';
const BORDER_COLOR = '#e0e0e0';
const TEXT_PRIMARY = '#222';
const TEXT_SECONDARY = '#888';
const TEXT_ACCENT = ACCENT_COLOR;

export default function CheckoutScreen({ navigation }) {
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useContext(AuthContext);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addressLoading, setAddressLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [addForm, setAddForm] = useState({
    addressName: '',
    fullName: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    addressType: 'both'
  });
  const [addFieldErrors, setAddFieldErrors] = useState({
    addressName: '',
    fullName: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
  });
  const [addSaving, setAddSaving] = useState(false);
  const [addStateDropdown, setAddStateDropdown] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null); // 'cod' or 'online'
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletToRedeem, setWalletToRedeem] = useState('');
  const [walletError, setWalletError] = useState('');
  const [showRazorpayPayment, setShowRazorpayPayment] = useState(false);

  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.product.price || 0) * item.quantity, 0);
  const deliveryCharge = 0; // Always free delivery
  const finalTotal = subtotal + deliveryCharge;

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

  // Calculate max redeemable
  const maxWallet = walletBalance;

  // Calculate discounts
  const walletDiscount = Number(walletToRedeem) > 0 ? Math.min(Number(walletToRedeem), walletBalance) : 0;
  const grandTotal = Math.max(0, subtotal + deliveryCharge - walletDiscount);

  // Validate input
  useEffect(() => {
    if (Number(walletToRedeem) > walletBalance) setWalletError('Not enough wallet balance');
    else setWalletError('');
  }, [walletToRedeem, walletBalance]);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setAddressLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/addresses`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch addresses');
      const data = await res.json();
      setAddresses(data);
      if (data.length > 0 && !selectedAddress) setSelectedAddress(data[0]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to fetch addresses');
    } finally {
      setAddressLoading(false);
      setLoading(false);
    }
  };

  const handleAddAddress = async () => {
    let errors = {};
    if (!addForm.addressName.trim()) errors.addressName = 'Address name is required';
    if (!addForm.fullName.trim()) errors.fullName = 'Full name is required';
    if (!addForm.address.trim()) errors.address = 'Address is required';
    if (!addForm.city.trim()) errors.city = 'City is required';
    if (!addForm.state.trim()) errors.state = 'State is required';
    if (!/^[0-9]{6}$/.test(addForm.pincode)) errors.pincode = 'Enter a valid 6-digit pincode';
    if (!/^[0-9]{10}$/.test(addForm.phone)) errors.phone = 'Enter a valid 10-digit phone number';
    setAddFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setAddSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(addForm),
      });
      if (!res.ok) throw new Error('Failed to add address');
      setShowAddAddressModal(false);
      setAddForm({ addressName: '', fullName: '', address: '', city: '', state: '', pincode: '', phone: '', addressType: 'both' });
      setAddFieldErrors({ addressName: '', fullName: '', address: '', city: '', state: '', pincode: '', phone: '' });
      await fetchAddresses();
      Alert.alert('Success', 'Address added successfully');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to add address');
    } finally {
      setAddSaving(false);
    }
  };

  const handleRazorpaySuccess = (orderId) => {
    clearCart();
    Alert.alert('Order Placed', 'Thank you for your purchase!');
    navigation.navigate('OrderConfirmation', { order: { id: orderId } });
  };

  const handleRazorpayError = (error) => {
    Alert.alert('Payment Failed', error || 'Payment was unsuccessful. Please try again.');
  };

  const handleRazorpayCancel = () => {
    setShowRazorpayPayment(false);
  };

  const placeOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Select Address', 'Please select a shipping address.');
      return;
    }
    if (grandTotal > 0 && !paymentMethod) {
      Alert.alert('Select Payment Method', 'Please select a payment method (Online or Cash on Delivery) before placing your order.');
      return;
    }
    if (walletError) {
      Alert.alert('Error', 'Please fix wallet errors before placing order.');
      return;
    }
    if (paymentMethod === 'razorpay') {
      setShowRazorpayPayment(true);
      return;
    }
    setPlacingOrder(true);
    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
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
          paymentMethod: grandTotal === 0 ? 'wallet_paid' : paymentMethod,
          walletCoinsUsed: Number(walletToRedeem) > 0 ? Math.min(Number(walletToRedeem), walletBalance) : 0,
          walletDiscount: Number(walletToRedeem) > 0 ? Math.min(Number(walletToRedeem), walletBalance) : 0,
          subtotal: subtotal,
        }),
      });
      if (!res.ok) throw new Error('Order failed');
      const orderData = await res.json();
      clearCart();
      Alert.alert('Order Placed', 'Thank you for your purchase!');
      navigation.navigate('OrderConfirmation', { order: orderData });
    } catch (err) {
      Alert.alert('Order Failed', err.message || 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

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

  return (
    <View style={{ flex: 1, backgroundColor: BG_COLOR, padding: 0 }}>
      <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 12 }}>
        <Image source={LELE_IMAGE} style={{ width: 120, height: 40 }} resizeMode="contain" />
      </View>
      <ScrollView contentContainerStyle={{ padding: 18 }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: TEXT_PRIMARY, marginBottom: 12 }}>Checkout</Text>
        {/* Wallet & Rewards Info Card above Payment Method */}
        <View style={{ backgroundColor: CARD_BG, borderRadius: 10, padding: 14, marginBottom: 18, borderWidth: 1, borderColor: BORDER_COLOR, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Icon name="wallet-outline" size={22} color={TEXT_ACCENT} style={{ marginRight: 8 }} />
            <Text style={{ color: TEXT_SECONDARY, fontWeight: 'bold', fontSize: 15 }}>Wallet Balance</Text>
            <Text style={{ color: TEXT_PRIMARY, fontWeight: 'bold', fontSize: 15, marginLeft: 8 }}>{walletBalance}</Text>
          </View>
        </View>
        {/* Rewards & Wallet Section (for redemption) */}
        <View style={{ backgroundColor: CARD_BG, borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: BORDER_COLOR }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 4, color: TEXT_PRIMARY }}>Redeem Wallet Balance</Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: walletError ? '#e53935' : BORDER_COLOR, borderRadius: 8, padding: 8, marginBottom: 4, marginTop: 4, backgroundColor: '#fff', color: TEXT_PRIMARY }}
            placeholder={`Enter wallet amount to use (max ${walletBalance})`}
            placeholderTextColor={TEXT_SECONDARY}
            keyboardType="numeric"
            value={walletToRedeem}
            onChangeText={v => setWalletToRedeem(v.replace(/[^0-9]/g, ''))}
            maxLength={6}
          />
          {walletError ? <Text style={{ color: '#e53935', marginBottom: 4 }}>{walletError}</Text> : null}
        </View>
        {/* Address Section */}
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 6, color: TEXT_PRIMARY }}>Shipping Address</Text>
        {addressLoading ? (
          <ActivityIndicator size="large" color={TEXT_ACCENT} />
        ) : addresses.length === 0 ? (
          <Text style={{ color: TEXT_SECONDARY, marginBottom: 12 }}>No addresses found.</Text>
        ) : (
          <>
            <Picker
              selectedValue={selectedAddress?.id}
              onValueChange={id => {
                const addr = addresses.find(a => a.id === id);
                setSelectedAddress(addr);
              }}
              style={{ backgroundColor: '#f0f2f5', borderRadius: 8, marginBottom: 8 }}
            >
              {addresses.map(addr => (
                <Picker.Item
                  key={addr.id}
                  label={`${addr.addressName || addr.fullName} - ${addr.address}, ${addr.city}`}
                  value={addr.id}
                />
              ))}
            </Picker>
            <TouchableOpacity
              style={{ backgroundColor: TEXT_ACCENT, borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginBottom: 12 }}
              onPress={() => setShowAddAddressModal(true)}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>+ Add New Address</Text>
            </TouchableOpacity>
          </>
        )}
        {selectedAddress && (
          <View style={{ backgroundColor: CARD_BG, borderRadius: 8, padding: 10, marginBottom: 16, borderWidth: 1, borderColor: BORDER_COLOR }}>
            <Text style={{ fontWeight: 'bold', color: TEXT_PRIMARY }}>{selectedAddress.fullName}</Text>
            <Text style={{ color: TEXT_SECONDARY }}>{selectedAddress.address}</Text>
            <Text style={{ color: TEXT_SECONDARY }}>{selectedAddress.city}, {selectedAddress.state} {selectedAddress.pincode}</Text>
            <Text style={{ color: TEXT_SECONDARY }}>{selectedAddress.phone}</Text>
          </View>
        )}
        {/* Product List */}
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 6, color: TEXT_PRIMARY }}>Products</Text>
        {cartItems.map((item, idx) => (
          <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: BORDER_COLOR }}>
            <Text style={{ flex: 2, color: TEXT_PRIMARY, fontWeight: '500' }}>{item.product.name}</Text>
            <Text style={{ flex: 1, textAlign: 'center' }}>x{item.quantity}</Text>
            <Text style={{ flex: 1, textAlign: 'right', color: TEXT_SECONDARY }}>₹{Number(item.product.price || 0).toFixed(2)}</Text>
            <Text style={{ flex: 1, textAlign: 'right', color: TEXT_ACCENT, fontWeight: '600' }}>₹{(Number(item.product.price || 0) * item.quantity).toFixed(2)}</Text>
          </View>
        ))}
        {/* Price Breakdown Section */}
        <View style={{ backgroundColor: CARD_BG, borderRadius: 10, padding: 16, marginTop: 16, marginBottom: 16, borderWidth: 1, borderColor: BORDER_COLOR }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, color: TEXT_PRIMARY, marginBottom: 8 }}>Price Details</Text>
          <View style={styles.priceRow}>
            <Text style={{ color: TEXT_SECONDARY }}>Subtotal</Text>
            <Text style={{ color: TEXT_PRIMARY, fontWeight: 'bold' }}>₹{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={{ color: TEXT_SECONDARY }}>Delivery Charge</Text>
            <Text style={{ color: TEXT_PRIMARY, fontWeight: 'bold' }}>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</Text>
          </View>
          {walletDiscount > 0 && (
            <View style={styles.priceRow}>
              <Text style={{ color: '#388e3c' }}>Wallet Discount</Text>
              <Text style={{ color: '#388e3c', fontWeight: 'bold' }}>-₹{walletDiscount.toFixed(2)}</Text>
            </View>
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: BORDER_COLOR, paddingTop: 10, marginTop: 8 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 17, color: TEXT_PRIMARY }}>Total</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 17, color: TEXT_ACCENT }}>₹{grandTotal.toFixed(2)}</Text>
          </View>
        </View>
        {/* Payment Method Section */}
        {grandTotal > 0 && <>
          <Text style={{ fontSize: 16, fontWeight: '600', marginTop: 18, marginBottom: 6, color: TEXT_PRIMARY }}>Payment Method</Text>
          <View style={{ flexDirection: 'row', marginBottom: 12 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                padding: 12,
                borderWidth: 2,
                borderColor: paymentMethod === 'cod' ? TEXT_ACCENT : BORDER_COLOR,
                borderRadius: 10,
                marginRight: 8,
                backgroundColor: paymentMethod === 'cod' ? '#f0f6ff' : CARD_BG,
                shadowColor: '#000',
                shadowOpacity: 0.04,
                shadowRadius: 2,
                elevation: paymentMethod === 'cod' ? 2 : 0,
              }}
              onPress={() => setPaymentMethod('cod')}
            >
              <Icon name="cash" size={22} color={paymentMethod === 'cod' ? TEXT_ACCENT : TEXT_SECONDARY} />
              <Text style={{ marginLeft: 8, color: paymentMethod === 'cod' ? TEXT_ACCENT : TEXT_PRIMARY, fontWeight: 'bold', fontSize: 15 }}>Cash on Delivery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                padding: 12,
                borderWidth: 2,
                borderColor: paymentMethod === 'razorpay' ? TEXT_ACCENT : BORDER_COLOR,
                borderRadius: 10,
                backgroundColor: paymentMethod === 'razorpay' ? '#f0f6ff' : CARD_BG,
                shadowColor: '#000',
                shadowOpacity: 0.04,
                shadowRadius: 2,
                elevation: paymentMethod === 'razorpay' ? 2 : 0,
              }}
              onPress={() => setPaymentMethod('razorpay')}
            >
              <Icon name="credit-card-outline" size={22} color={paymentMethod === 'razorpay' ? TEXT_ACCENT : TEXT_SECONDARY} />
              <Text style={{ marginLeft: 8, color: paymentMethod === 'razorpay' ? TEXT_ACCENT : TEXT_PRIMARY, fontWeight: 'bold', fontSize: 15 }}>Online Payment (Cards, UPI, Net Banking)</Text>
            </TouchableOpacity>
          </View>
        </>}
        <TouchableOpacity style={{ backgroundColor: TEXT_ACCENT, borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 8, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }} onPress={placeOrder} disabled={placingOrder}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 17 }}>{placingOrder ? 'Processing...' : grandTotal === 0 ? 'Place Order' : paymentMethod ? 'Place Order' : 'Select Payment Method'}</Text>
        </TouchableOpacity>
      </ScrollView>
      {/* Add Address Modal */}
      <Modal
        visible={showAddAddressModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddAddressModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '90%' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: TEXT_PRIMARY }}>Add New Address</Text>
            <ScrollView style={{ maxHeight: 350 }}>
              <TextInput
                style={{ borderWidth: 1, borderColor: addFieldErrors.addressName ? '#e53935' : '#ccc', borderRadius: 8, padding: 8, marginBottom: 8 }}
                placeholder="Address Name (e.g. Home, Office)"
                value={addForm.addressName}
                onChangeText={v => setAddForm(f => ({ ...f, addressName: v }))}
              />
              {addFieldErrors.addressName ? <Text style={{ color: '#e53935', marginBottom: 4 }}>{addFieldErrors.addressName}</Text> : null}
              <TextInput
                style={{ borderWidth: 1, borderColor: addFieldErrors.fullName ? '#e53935' : '#ccc', borderRadius: 8, padding: 8, marginBottom: 8 }}
                placeholder="Full Name"
                value={addForm.fullName}
                onChangeText={v => setAddForm(f => ({ ...f, fullName: v }))}
              />
              {addFieldErrors.fullName ? <Text style={{ color: '#e53935', marginBottom: 4 }}>{addFieldErrors.fullName}</Text> : null}
              <TextInput
                style={{ borderWidth: 1, borderColor: addFieldErrors.pincode ? '#e53935' : '#ccc', borderRadius: 8, padding: 8, marginBottom: 8 }}
                placeholder="Pincode"
                keyboardType="numeric"
                value={addForm.pincode}
                onChangeText={async v => {
                  const pin = v.replace(/[^0-9]/g, '');
                  setAddForm(f => ({ ...f, pincode: pin }));
                  if (pin.length === 6) {
                    try {
                      const res = await fetch(`${API_BASE}/api/shipping/check-pincode?pincode=${pin}`);
                      const data = await res.json();
                      if (data && data.location && data.location.state) {
                        setAddForm(f => ({ ...f, state: data.location.state, city: data.location.district || f.city }));
                        setAddFieldErrors(e => ({ ...e, pincode: '' }));
                      } else {
                        setAddFieldErrors(e => ({ ...e, pincode: 'Pincode is wrong' }));
                      }
                    } catch {
                      setAddFieldErrors(e => ({ ...e, pincode: 'Pincode is wrong' }));
                    }
                  }
                }}
                maxLength={6}
              />
              {addFieldErrors.pincode ? <Text style={{ color: '#e53935', marginBottom: 4 }}>{addFieldErrors.pincode}</Text> : null}
              <TextInput
                style={{ borderWidth: 1, borderColor: addFieldErrors.address ? '#e53935' : '#ccc', borderRadius: 8, padding: 8, marginBottom: 8 }}
                placeholder="Address"
                value={addForm.address}
                onChangeText={v => setAddForm(f => ({ ...f, address: v }))}
              />
              {addFieldErrors.address ? <Text style={{ color: '#e53935', marginBottom: 4 }}>{addFieldErrors.address}</Text> : null}
              <TextInput
                style={{ borderWidth: 1, borderColor: addFieldErrors.city ? '#e53935' : '#ccc', borderRadius: 8, padding: 8, marginBottom: 8 }}
                placeholder="City"
                value={addForm.city}
                onChangeText={v => setAddForm(f => ({ ...f, city: v }))}
                editable={false}
              />
              {addFieldErrors.city ? <Text style={{ color: '#e53935', marginBottom: 4 }}>{addFieldErrors.city}</Text> : null}
              <TouchableOpacity
                style={{ borderWidth: 1, borderColor: addFieldErrors.state ? '#e53935' : '#ccc', borderRadius: 8, padding: 8, marginBottom: 8 }}
                disabled={true}
              >
                <Text style={{ color: addForm.state ? '#222' : '#888' }}>{addForm.state || 'State (auto-filled)'}</Text>
              </TouchableOpacity>
              {addFieldErrors.state ? <Text style={{ color: '#e53935', marginBottom: 4 }}>{addFieldErrors.state}</Text> : null}
              <TextInput
                style={{ borderWidth: 1, borderColor: addFieldErrors.phone ? '#e53935' : '#ccc', borderRadius: 8, padding: 8, marginBottom: 8 }}
                placeholder="Phone Number"
                keyboardType="numeric"
                value={addForm.phone}
                onChangeText={v => setAddForm(f => ({ ...f, phone: v.replace(/[^0-9]/g, '') }))}
                maxLength={10}
              />
              {addFieldErrors.phone ? <Text style={{ color: '#e53935', marginBottom: 4 }}>{addFieldErrors.phone}</Text> : null}
            </ScrollView>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <TouchableOpacity
                style={{ marginRight: 16, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8, backgroundColor: '#eee' }}
                onPress={() => { setShowAddAddressModal(false); setAddForm({ addressName: '', fullName: '', address: '', city: '', state: '', pincode: '', phone: '', addressType: 'both' }); setAddFieldErrors({ addressName: '', fullName: '', address: '', city: '', state: '', pincode: '', phone: '' }); }}
                disabled={addSaving}
              >
                <Text style={{ color: TEXT_PRIMARY, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8, backgroundColor: TEXT_ACCENT }}
                onPress={handleAddAddress}
                disabled={addSaving}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>{addSaving ? 'Saving...' : 'Save Address'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Razorpay Payment Modal */}
      <Modal
        visible={showRazorpayPayment}
        animationType="slide"
        transparent={false}
      >
        <View style={{ flex: 1, backgroundColor: BG_COLOR }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: BORDER_COLOR }}>
            <TouchableOpacity onPress={() => setShowRazorpayPayment(false)} style={{ marginRight: 12 }}>
              <Icon name="arrow-left" size={24} color={TEXT_ACCENT} />
            </TouchableOpacity>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: TEXT_PRIMARY }}>Razorpay Payment</Text>
          </View>
          <RazorpayPayment
            amount={grandTotal * 100}
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
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
}); 