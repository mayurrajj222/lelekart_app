import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, SafeAreaView, ActivityIndicator, Modal, FlatList, Alert, TextInput, ImageBackground, Dimensions, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCart } from '../context/CartContext';
import { useNavigation } from '@react-navigation/native';
import OrderConfirmationScreen from './OrderConfirmationScreen'; // Import the new confirmation screen
import { API_BASE } from '../lib/api';
import { AuthContext } from '../context/AuthContext';
import { Picker } from '@react-native-picker/picker';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands',
  'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh',
  'Lakshadweep', 'Puducherry'
];

const SCREEN_HEIGHT = Dimensions.get('window').height;

function AppHeader() {
  return (
    <SafeAreaView style={styles.headerSafeArea}>
      <View style={styles.headerContainer}>
        <Image source={require('./assets/lele.png')} style={styles.headerLogo} resizeMode="contain" />
      </View>
    </SafeAreaView>
  );
}

const BG_IMAGE = require('./assets/image.png');
const LELE_IMAGE = require('./assets/lele.png');

export default function CartTab() {
  const { cartItems, removeFromCart, updateQuantity, clearCart, loading, fetchCart, refreshCart } = useCart();
  const { user } = React.useContext(AuthContext);
  const navigation = useNavigation();
  const total = cartItems.reduce((sum, item) => {
    const price = item.variant ? item.variant.price : item.product.price;
    return sum + price * item.quantity;
  }, 0);
  // Calculate order summary
  const subtotal = total;
  const gst = subtotal * 0.18; // 18% GST
  const deliveryCharge = subtotal > 500 ? 0 : 50; // Free delivery above ₹500
  const finalTotal = subtotal + gst + deliveryCharge;
  const [addresses, setAddresses] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSummary, setOrderSummary] = useState(null);
  // Add state for add address modal in checkout
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
  const checkoutScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(checkoutScale, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(checkoutScale, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [checkoutScale]);

  // Debug: log cart items
  useEffect(() => {
    console.log('Cart Items:', cartItems);
  }, [cartItems]);

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
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before placing an order.');
      return;
    }
    setPlacingOrder(true);
    try {
      // Prepare order data with cart items including variant information
      const requestData = {
        addressId: selectedAddress.id,
        cartItems: cartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.variant ? item.variant.price : item.product.price,
          variant: item.variant || null,
          variantId: item.variant ? item.variant.id : null
        })),
        subtotal: subtotal,
        total: finalTotal,
        deliveryCharge: deliveryCharge,
        gst: gst
      };
      
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestData),
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
      const responseData = await res.json();
      clearCart();
      navigation.navigate('OrderConfirmation', { order: responseData });
    } catch (err) {
      Alert.alert('Order Failed', err.message || 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#2874f0" /></View>;
  }

  return (
    <ImageBackground source={BG_IMAGE} style={{ flex: 1 }} resizeMode="cover">
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <View style={styles.headerSafeArea}>
          <View style={styles.headerContainer}>
            <Image source={require('./assets/lele.png')} style={styles.headerLogo} resizeMode="contain" />
          </View>
        </View>
        <Text style={styles.cartTitleNormal}>Shopping Cart</Text>
        {cartItems.length === 0 ? (
          <View style={styles.emptyCartContainer}>
            <Icon name="cart-off" size={80} color="#ccc" style={{ marginBottom: 16 }} />
            <Text style={{ fontSize: 20, color: '#888', marginBottom: 12 }}>Your cart is empty</Text>
            <TouchableOpacity style={styles.shopNowBtn} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.shopNowText}>Shop Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <ScrollView style={{ flex: 1 }}>
              {cartItems.map((item, idx) => (
                <View key={item.product.id} style={styles.cartRowNormal}>
                  <TouchableOpacity onPress={() => navigation.navigate('ProductDetail', { product: item.product })}>
                    <Image source={{ uri: item.product.imageUrl || (item.product.images && item.product.images[0]) || 'https://placehold.co/60x60?text=No+Image' }} style={styles.cartImageNormal} />
                  </TouchableOpacity>
                  <View style={styles.cartDetailsNormal}>
                    <TouchableOpacity onPress={() => navigation.navigate('ProductDetail', { product: item.product })}>
                      <Text style={styles.cartNameNormal} numberOfLines={2}>{item.product.name}</Text>
                    </TouchableOpacity>
                    {/* Display variant information */}
                    {item.variant && (
                      <>
                        {item.variant.selectedColor && <Text style={styles.cartMetaNormal}>Color: {item.variant.selectedColor}</Text>}
                        {item.variant.selectedSize && <Text style={styles.cartMetaNormal}>Size: {item.variant.selectedSize}</Text>}
                        {item.variant.selectedVariant && item.variant.selectedVariant.weight && <Text style={styles.cartMetaNormal}>Weight: {item.variant.selectedVariant.weight}</Text>}
                      </>
                    )}
                    {/* Fallback to product variant info if variant object doesn't exist */}
                    {!item.variant && (
                      <>
                        {item.product.color && <Text style={styles.cartMetaNormal}>Color: {item.product.color}</Text>}
                        {item.product.size && <Text style={styles.cartMetaNormal}>Size: {item.product.size}</Text>}
                        {item.product.selectedVariant && item.product.selectedVariant.weight && <Text style={styles.cartMetaNormal}>Weight: {item.product.selectedVariant.weight}</Text>}
                        {item.product.selectedColor && <Text style={styles.cartMetaNormal}>Color: {item.product.selectedColor.name}</Text>}
                        {item.product.selectedSize && <Text style={styles.cartMetaNormal}>Size: {item.product.selectedSize.name}</Text>}
                      </>
                    )}
                    <Text style={styles.cartPriceNormal}>₹{item.variant ? item.variant.price : item.product.price}</Text>
                    <View style={styles.cartActionRowNormal}>
                      <View style={styles.cartQtyPillNormal}>
                        <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity - 1)}>
                          <Text style={styles.cartQtyBtnNormal}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.cartQtyTextNormal}>{item.quantity}</Text>
                        <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)}>
                          <Text style={styles.cartQtyBtnNormal}>+</Text>
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity onPress={() => {
                        console.log('Cart Item on Delete:', item);
                        removeFromCart(item.id);
                      }} style={styles.cartDeleteBtnNormal}>
                        <Icon name="trash-can-outline" size={22} color="#e53935" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={styles.cartMoodButtonsWrap}>
              <Animated.View style={{ transform: [{ scale: checkoutScale }] }}>
                <TouchableOpacity style={styles.cartMoodCheckoutBtn} onPress={() => navigation.navigate('Checkout')} activeOpacity={0.85}>
                  <Text style={styles.cartMoodCheckoutBtnText}>Checkout</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        )}
        <Modal
          visible={showAddAddressModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAddAddressModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Address</Text>
                <TouchableOpacity onPress={() => setShowAddAddressModal(false)}>
                  <Icon name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalBody}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Address Name</Text>
                  <TextInput
                    style={styles.input}
                    value={addForm.addressName}
                    onChangeText={text => setAddForm({ ...addForm, addressName: text })}
                    placeholder="Home, Work, etc."
                  />
                  {addFieldErrors.addressName ? <Text style={{ color: 'red', fontSize: 13 }}>{addFieldErrors.addressName}</Text> : null}
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    value={addForm.fullName}
                    onChangeText={text => setAddForm({ ...addForm, fullName: text })}
                    placeholder="Enter full name"
                  />
                  {addFieldErrors.fullName ? <Text style={{ color: 'red', fontSize: 13 }}>{addFieldErrors.fullName}</Text> : null}
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Address</Text>
                  <TextInput
                    style={styles.input}
                    value={addForm.address}
                    onChangeText={text => setAddForm({ ...addForm, address: text })}
                    placeholder="Enter address"
                    multiline
                  />
                  {addFieldErrors.address ? <Text style={{ color: 'red', fontSize: 13 }}>{addFieldErrors.address}</Text> : null}
                </View>
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}> 
                    <Text style={styles.inputLabel}>City</Text>
                    <TextInput
                      style={styles.input}
                      value={addForm.city}
                      onChangeText={text => setAddForm({ ...addForm, city: text })}
                      placeholder="City"
                    />
                    {addFieldErrors.city ? <Text style={{ color: 'red', fontSize: 13 }}>{addFieldErrors.city}</Text> : null}
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}> 
                    <Text style={styles.inputLabel}>State</Text>
                    {addStateDropdown && (
                      <View style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, backgroundColor: '#fff' }}>
                        <Picker
                          selectedValue={addForm.state}
                          onValueChange={value => setAddForm({ ...addForm, state: value })}
                        >
                          <Picker.Item label="Select State" value="" />
                          {INDIAN_STATES.map(state => (
                            <Picker.Item key={state} label={state} value={state} />
                          ))}
                        </Picker>
                      </View>
                    )}
                    {addFieldErrors.state ? <Text style={{ color: 'red', fontSize: 13 }}>{addFieldErrors.state}</Text> : null}
                  </View>
                </View>
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}> 
                    <Text style={styles.inputLabel}>Pincode</Text>
                    <TextInput
                      style={styles.input}
                      value={addForm.pincode}
                      onChangeText={text => {
                        const digits = text.replace(/[^0-9]/g, '').slice(0, 6);
                        setAddForm(f => ({ ...f, pincode: digits }));
                        if (digits.length === 6) {
                          fetch(`${API_BASE}/api/shipping/check-pincode?pincode=${digits}`)
                            .then(res => res.json())
                            .then(data => {
                              if (data && data.location && data.location.state) {
                                setAddForm(f => ({ ...f, state: data.location.state }));
                                setAddStateDropdown(true);
                                setAddFieldErrors(prev => ({ ...prev, pincode: '' }));
                              } else {
                                setAddStateDropdown(false);
                                setAddFieldErrors(prev => ({ ...prev, pincode: 'Pincode is wrong' }));
                              }
                            })
                            .catch(() => {
                              setAddStateDropdown(false);
                              setAddFieldErrors(prev => ({ ...prev, pincode: 'Pincode is wrong' }));
                            });
                        } else {
                          setAddStateDropdown(false);
                          if (digits.length > 0 && digits.length < 6) {
                            setAddFieldErrors(prev => ({ ...prev, pincode: 'Enter a valid 6-digit pincode' }));
                          } else {
                            setAddFieldErrors(prev => ({ ...prev, pincode: '' }));
                          }
                        }
                      }}
                      placeholder="Pincode"
                      keyboardType="numeric"
                      maxLength={6}
                    />
                    {addFieldErrors.pincode ? <Text style={{ color: 'red', fontSize: 13 }}>{addFieldErrors.pincode}</Text> : null}
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}> 
                    <Text style={styles.inputLabel}>Phone</Text>
                    <TextInput
                      style={styles.input}
                      value={addForm.phone}
                      onChangeText={v => {
                        const digits = v.replace(/[^0-9]/g, '').slice(0, 10);
                        setAddForm(f => ({ ...f, phone: digits }));
                        if (digits.length === 10) {
                          setAddFieldErrors(prev => ({ ...prev, phone: '' }));
                        } else if (digits.length > 0 && digits.length < 10) {
                          setAddFieldErrors(prev => ({ ...prev, phone: 'Enter a valid 10-digit phone number' }));
                        } else {
                          setAddFieldErrors(prev => ({ ...prev, phone: '' }));
                        }
                      }}
                      placeholder="Phone"
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                    {addFieldErrors.phone ? <Text style={{ color: 'red', marginBottom: 6, fontSize: 13 }}>{addFieldErrors.phone}</Text> : null}
                  </View>
                </View>
              </ScrollView>
              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddAddressModal(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveButton, addSaving && styles.saveButtonDisabled]} onPress={async () => {
                  // Validate fields
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
                    await fetchAddresses(); // Refresh the list
                    // Select the newly added address (assume it's the last one)
                    setTimeout(() => {
                      setSelectedAddress(prev => {
                        const latest = addresses[addresses.length - 1];
                        return latest || prev;
                      });
                    }, 500);
                    Alert.alert('Success', 'Address added successfully');
                  } catch (err) {
                    Alert.alert('Error', err.message || 'Failed to add address');
                  } finally {
                    setAddSaving(false);
                  }
                }} disabled={addSaving}>
                  {addSaving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <Modal visible={!!orderSummary} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>Order Placed!</Text>
              {orderSummary && (
                <>
                  <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Order ID: {orderSummary.id || orderSummary.orderId}</Text>
                  <Text style={{ marginBottom: 8 }}>Thank you for your purchase.</Text>
                  <Text style={{ marginBottom: 8 }}>Total: ₹{orderSummary.total || orderSummary.amount || total}</Text>
                  <Text style={{ marginBottom: 8 }}>Shipping to: {orderSummary.shippingAddress ? `${orderSummary.shippingAddress.address}, ${orderSummary.shippingAddress.city}` : selectedAddress ? `${selectedAddress.address}, ${selectedAddress.city}` : ''}</Text>
                  <TouchableOpacity style={[styles.checkoutBtn, { marginTop: 16 }]} onPress={() => setOrderSummary(null)}>
                    <Text style={styles.checkoutText}>Close</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  headerSafeArea: { backgroundColor: '#fff', marginTop: 4 },
  headerContainer: { alignItems: 'center', padding: 12 },
  headerLogo: { width: 120, height: 40 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', margin: 16, color: '#222', backgroundColor: '#fff', borderRadius: 8, padding: 8 },
  cartItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, marginHorizontal: 16, marginBottom: 10, padding: 10, elevation: 1 },
  cartItemImage: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
  cartItemName: { fontSize: 15, fontWeight: '600', color: '#222' },
  cartItemPrice: { fontSize: 14, color: '#2874f0' },
  cartItemTotal: { fontSize: 15, fontWeight: 'bold', color: '#222' },
  cartTotalRow: { flexDirection: 'row', justifyContent: 'space-between', margin: 16, alignItems: 'center' },
  cartTotalLabel: { fontSize: 18, fontWeight: 'bold', color: '#222' },
  cartTotalValue: { fontSize: 18, fontWeight: 'bold', color: '#2874f0' },
  checkoutBtn: { backgroundColor: '#2874f0', borderRadius: 8, margin: 16, paddingVertical: 14, alignItems: 'center' },
  checkoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  qtyBtn: { backgroundColor: '#eee', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 },
  qtyBtnText: { fontSize: 18, color: '#2874f0', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '90%', maxHeight: '80%' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  orderSummarySection: {
    marginBottom: 20,
  },
  productsList: {
    maxHeight: 200, // Limit height for scrollable products
    marginBottom: 16,
  },
  orderProductItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  orderProductImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  orderProductDetails: {
    flex: 1,
  },
  orderProductName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    marginBottom: 2,
  },
  orderProductPrice: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  orderProductTotal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2874f0',
  },
  priceBreakdown: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 16,
    marginTop: 16,
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
    fontWeight: 'bold',
    color: '#2874f0',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 12,
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
  addressSection: {
    marginBottom: 20,
  },
  noAddressContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  noAddressText: {
    color: '#888',
    marginBottom: 16,
  },
  addAddressBtn: {
    backgroundColor: '#2874f0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAddressText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  addAddressBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  addAddressTextSecondary: {
    color: '#2874f0',
    fontSize: 14,
    marginLeft: 8,
  },
  paymentSection: {
    marginTop: 20,
  },
  paymentBtn: {
    backgroundColor: '#2874f0',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  paymentBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelBtn: {
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelBtnText: {
    color: '#222',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addressItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 10,
  },
  selectedAddress: {
    borderColor: '#2874f0',
    backgroundColor: '#e3f2fd',
  },
  addressName: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#222',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 2,
  },
  cartCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cartCardImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  cartCardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  cartCardPrice: {
    fontSize: 15,
    color: '#2874f0',
    fontWeight: '600',
    marginBottom: 6,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#eee',
  },
  qtyBtnText: {
    fontSize: 18,
    color: '#2874f0',
    fontWeight: 'bold',
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginHorizontal: 4,
  },
  removeBtn: {
    marginLeft: 8,
    padding: 4,
  },
  stickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
  },
  stickyTotalLabel: {
    fontSize: 16,
    color: '#888',
    fontWeight: '600',
  },
  stickyTotalValue: {
    fontSize: 20,
    color: '#2874f0',
    fontWeight: 'bold',
    marginTop: 2,
  },
  stickyCheckoutBtn: {
    backgroundColor: '#2874f0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginLeft: 16,
  },
  stickyCheckoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyCartContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  shopNowBtn: {
    backgroundColor: '#2874f0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 16,
  },
  shopNowText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // New styles for add address modal
  modalBody: {
    maxHeight: '60%', // Limit height for scrollable form
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#f9f9f9',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#222',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2874f0',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  // Add new styles for mood board look
  bgImageMood: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartContainerMood: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 18,
    paddingTop: 32,
    paddingBottom: 24,
    justifyContent: 'flex-start',
  },
  cartTitleMood: {
    fontSize: 32,
    fontFamily: 'serif',
    fontWeight: '600',
    color: '#3d3a36',
    marginBottom: 24,
    textAlign: 'left',
  },
  cartCardMoodWrap: {
    width: '100%',
    alignItems: 'center',
  },
  cartCardMood: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 22,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    padding: 18,
    marginBottom: 24,
    width: '100%',
    alignItems: 'center',
  },
  cartCardMoodImage: {
    width: 80,
    height: 110,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    marginRight: 18,
  },
  cartCardMoodDetails: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  cartCardMoodName: {
    fontSize: 20,
    fontFamily: 'serif',
    fontWeight: '500',
    color: '#222',
    marginBottom: 2,
  },
  cartCardMoodMeta: {
    fontSize: 15,
    color: '#888',
    marginBottom: 1,
    fontFamily: 'serif',
  },
  cartCardMoodPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginVertical: 6,
    fontFamily: 'serif',
  },
  cartCardMoodQtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  cartCardMoodUpdate: {
    fontSize: 16,
    color: '#222',
    fontFamily: 'serif',
    marginRight: 12,
  },
  cartCardMoodQtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f4ef',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e1db',
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  cartCardMoodQtyBtn: {
    fontSize: 22,
    color: '#888',
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
  cartCardMoodQtyText: {
    fontSize: 18,
    color: '#222',
    fontWeight: '600',
    paddingHorizontal: 8,
    fontFamily: 'serif',
  },
  cartMoodButtonsWrap: {
    width: '100%',
    marginTop: 8,
  },
  cartMoodViewBtn: {
    backgroundColor: '#b7a892',
    borderRadius: 8,
    paddingVertical: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  cartMoodViewBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'serif',
  },
  cartMoodCheckoutBtn: {
    backgroundColor: '#6B3F1D', // rich brown
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 36,
    alignItems: 'center',
    marginBottom: 28,
    minWidth: 120,
    alignSelf: 'center',
    shadowColor: '#6B3F1D',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  cartMoodCheckoutBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'serif',
    letterSpacing: 1,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  leleLogoCartHeaderWrap: {
    alignItems: 'center',
    marginTop: 38,
    marginBottom: 10,
  },
  leleLogoCartHeader: {
    width: 160,
    height: 60,
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e1db',
    marginBottom: 10,
    padding: 8,
    shadowColor: '#b6b1a9',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cartRowImage: {
    width: 54,
    height: 54,
    borderRadius: 8,
    marginRight: 10,
  },
  cartRowDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  cartRowName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3d3a36',
    marginBottom: 2,
  },
  cartRowPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2874f0',
    marginBottom: 2,
  },
  cartRowQtyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  cartRowQtyBtn: {
    backgroundColor: '#f3ede6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginHorizontal: 2,
  },
  cartRowQtyBtnText: {
    fontSize: 16,
    color: '#2874f0',
    fontWeight: 'bold',
  },
  cartRowQtyText: {
    fontSize: 14,
    color: '#3d3a36',
    marginHorizontal: 4,
  },
  cartRowDeleteBtn: {
    marginLeft: 8,
    padding: 4,
  },
  // Add new styles for the fixed row layout at the end of the StyleSheet
  cartRowFixed: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e1db',
    marginBottom: 10,
    padding: 10,
    shadowColor: '#b6b1a9',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    minHeight: 70,
    maxHeight: 90,
    width: '100%',
  },
  cartRowImageFixed: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 10,
  },
  cartRowDetailsFixed: {
    flex: 1,
    justifyContent: 'center',
  },
  cartRowNameFixed: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3d3a36',
    marginBottom: 2,
  },
  cartRowPriceFixed: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2874f0',
    marginBottom: 2,
  },
  cartRowQtyWrapFixed: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  cartRowQtyBtnFixed: {
    backgroundColor: '#f3ede6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginHorizontal: 2,
  },
  cartRowQtyBtnTextFixed: {
    fontSize: 16,
    color: '#2874f0',
    fontWeight: 'bold',
  },
  cartRowQtyTextFixed: {
    fontSize: 15,
    color: '#3d3a36',
    marginHorizontal: 4,
  },
  cartRowDeleteBtnFixed: {
    marginLeft: 8,
    padding: 4,
  },
  // Add new styles for the compact mood board card at the end of the StyleSheet
  moodCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 22,
    shadowColor: '#b6b1a9',
    shadowOpacity: 0.10,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodImage: {
    width: 90,
    height: 120,
    borderRadius: 14,
    backgroundColor: '#f3ede6',
    marginRight: 20,
  },
  moodDetailsWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  moodDetailsTop: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  moodName: {
    fontSize: 19,
    fontWeight: '700',
    color: '#3d3a36',
    fontFamily: 'serif',
    flex: 1,
    marginRight: 8,
  },
  moodPrice: {
    fontSize: 19,
    fontWeight: '700',
    color: '#2874f0',
    fontFamily: 'serif',
  },
  moodMeta: {
    fontSize: 15,
    color: '#888',
    fontFamily: 'serif',
    marginBottom: 1,
  },
  moodUpdateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  moodUpdateLabel: {
    fontSize: 16,
    color: '#3d3a36',
    fontFamily: 'serif',
    marginRight: 14,
  },
  moodQtyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3ede6',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 3,
    marginRight: 12,
  },
  moodQtyBtn: {
    fontSize: 20,
    color: '#2874f0',
    fontWeight: 'bold',
    paddingHorizontal: 10,
  },
  moodQtyText: {
    fontSize: 17,
    color: '#3d3a36',
    marginHorizontal: 8,
    fontFamily: 'serif',
  },
  moodDeleteBtn: {
    marginLeft: 10,
    padding: 6,
  },
  moodCardSmall: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
    shadowColor: '#b6b1a9',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  moodRowSmall: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodImageSmall: {
    width: 60,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#f3ede6',
    marginRight: 12,
  },
  moodDetailsWrapSmall: {
    flex: 1,
    justifyContent: 'center',
  },
  moodDetailsTopSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 2,
  },
  moodNameSmall: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3d3a36',
    fontFamily: 'serif',
    flex: 1,
    marginRight: 6,
  },
  moodPriceSmall: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2874f0',
    fontFamily: 'serif',
    marginRight: 8,
  },
  moodQtyPillSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3ede6',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 1,
    marginRight: 8,
  },
  moodQtyBtnSmall: {
    fontSize: 16,
    color: '#2874f0',
    fontWeight: 'bold',
    paddingHorizontal: 6,
  },
  moodQtyTextSmall: {
    fontSize: 14,
    color: '#3d3a36',
    marginHorizontal: 4,
    fontFamily: 'serif',
  },
  moodDeleteBtnSmall: {
    marginLeft: 4,
    padding: 4,
  },
  moodMetaSmall: {
    fontSize: 13,
    color: '#888',
    fontFamily: 'serif',
    marginBottom: 1,
  },
  // Add new styles for the chocolate mood board card at the end of the StyleSheet
  chocoCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#b6b1a9',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  chocoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chocoImage: {
    width: 60,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#f3ede6',
    marginRight: 14,
  },
  chocoDetailsWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 2,
  },
  chocoName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B3F1D',
    fontFamily: 'serif',
    marginBottom: 2,
  },
  chocoMeta: {
    fontSize: 13,
    color: '#6B3F1D',
    fontFamily: 'serif',
    marginBottom: 1,
  },
  chocoPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B3F1D',
    fontFamily: 'serif',
    marginBottom: 6,
  },
  chocoActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  chocoQtyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3ede6',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginRight: 10,
  },
  chocoQtyBtn: {
    fontSize: 16,
    color: '#6B3F1D',
    fontWeight: 'bold',
    paddingHorizontal: 6,
  },
  chocoQtyText: {
    fontSize: 15,
    color: '#6B3F1D',
    marginHorizontal: 4,
    fontFamily: 'serif',
  },
  chocoDeleteBtn: {
    marginLeft: 8,
    padding: 4,
  },
  // Add new styles for the smaller chocolate card at the end of the StyleSheet
  chocoCardSmall: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    marginBottom: 10,
    shadowColor: '#b6b1a9',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  chocoRowSmall: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chocoImageSmall: {
    width: 44,
    height: 58,
    borderRadius: 8,
    backgroundColor: '#f3ede6',
    marginRight: 10,
  },
  chocoDetailsWrapSmall: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 2,
  },
  chocoNameSmall: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B3F1D',
    fontFamily: 'serif',
    marginBottom: 2,
  },
  chocoMetaSmall: {
    fontSize: 12,
    color: '#6B3F1D',
    fontFamily: 'serif',
    marginBottom: 1,
  },
  chocoPriceSmall: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B3F1D',
    fontFamily: 'serif',
    marginBottom: 4,
  },
  chocoActionRowSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  chocoQtyPillSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3ede6',
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 1,
    marginRight: 8,
  },
  chocoQtyBtnSmall: {
    fontSize: 14,
    color: '#6B3F1D',
    fontWeight: 'bold',
    paddingHorizontal: 5,
  },
  chocoQtyTextSmall: {
    fontSize: 13,
    color: '#6B3F1D',
    marginHorizontal: 3,
    fontFamily: 'serif',
  },
  chocoDeleteBtnSmall: {
    marginLeft: 6,
    padding: 4,
  },
  // Add new styles for the larger chocolate card at the end of the StyleSheet
  chocoCardLarge: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#b6b1a9',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  chocoRowLarge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chocoImageLarge: {
    width: 90,
    height: 120,
    borderRadius: 14,
    backgroundColor: '#f3ede6',
    marginRight: 18,
  },
  chocoDetailsWrapLarge: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  chocoNameLarge: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B3F1D',
    fontFamily: 'serif',
    marginBottom: 4,
  },
  chocoMetaLarge: {
    fontSize: 15,
    color: '#6B3F1D',
    fontFamily: 'serif',
    marginBottom: 2,
  },
  chocoPriceLarge: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B3F1D',
    fontFamily: 'serif',
    marginBottom: 8,
  },
  chocoActionRowLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  chocoQtyPillLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3ede6',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 3,
    marginRight: 12,
  },
  chocoQtyBtnLarge: {
    fontSize: 18,
    color: '#6B3F1D',
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
  chocoQtyTextLarge: {
    fontSize: 16,
    color: '#6B3F1D',
    marginHorizontal: 6,
    fontFamily: 'serif',
  },
  chocoDeleteBtnLarge: {
    marginLeft: 10,
    padding: 6,
  },
  cartTitleNormal: { fontSize: 24, fontWeight: 'bold', color: '#3d3a36', marginTop: 10, marginBottom: 24, textAlign: 'center' },
  cartRowNormal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#e5e1db',
    marginBottom: 14,
    marginLeft: 16,
marginRight: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    shadowColor: '#b6b1a9',
    shadowOpacity: 0.10,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cartImageNormal: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f3ede6',
    marginRight: 12,
  },
  cartDetailsNormal: {
    flex: 1,
    justifyContent: 'center',
  },
  cartNameNormal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B3F1D',
    marginBottom: 2,
  },
  cartMetaNormal: {
    fontSize: 13,
    color: '#6B3F1D',
    marginBottom: 1,
  },
  cartPriceNormal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6B3F1D',
    marginBottom: 4,
  },
  cartActionRowNormal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  cartQtyPillNormal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3ede6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  cartQtyBtnNormal: {
    fontSize: 16,
    color: '#6B3F1D',
    fontWeight: 'bold',
    paddingHorizontal: 5,
  },
  cartQtyTextNormal: {
    fontSize: 15,
    color: '#6B3F1D',
    marginHorizontal: 4,
  },
  cartDeleteBtnNormal: {
    marginLeft: 8,
    padding: 4,
  },
  checkoutBtnBeautiful: {
    marginTop: 20,
    marginBottom: 28,
    alignSelf: 'center',
    backgroundColor: '#6B3F1D', // rich brown
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 36,
    shadowColor: '#6B3F1D',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    minWidth: 120,
  },
  checkoutBtnTextBeautiful: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
}); 