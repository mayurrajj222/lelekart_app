import React, { useEffect, useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity, 
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ScrollView
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { API_BASE, fetchAddresses, updateAddress, deleteAddress, setDefaultAddress, setDefaultBillingAddress, setDefaultShippingAddress } from '../../lib/api';
import { AuthContext } from '../../context/AuthContext';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands',
  'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh',
  'Lakshadweep', 'Puducherry'
];

export default function AddressesScreen() {
  const { user } = useContext(AuthContext);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [editForm, setEditForm] = useState({
    addressName: '',
    fullName: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    addressType: 'both'
  });
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    addressName: '',
    fullName: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
  });

  // Add Address modal state
  const [addModalVisible, setAddModalVisible] = useState(false);
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

  // Add state for controlling state dropdown visibility and state value from pincode
  const [editStateDropdown, setEditStateDropdown] = useState(false);
  const [addStateDropdown, setAddStateDropdown] = useState(false);

  const fetchAddresses = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      console.log('Fetching real addresses from:', `${API_BASE}/api/addresses`);
      
      const res = await fetch(`${API_BASE}/api/addresses`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          // Add any authentication headers if needed
        },
        credentials: 'include', // Include cookies for authentication
      });
      
      console.log('Response status:', res.status);
      
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Please login to view your addresses');
        }
        throw new Error(`Failed to fetch addresses: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Real addresses data:', data);
      
      setAddresses(data);
    } catch (err) {
      console.error('Error fetching addresses:', err);
      setError(err.message || 'Error fetching addresses');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const onRefresh = () => {
    fetchAddresses(true);
  };

  // Handle edit address
  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setEditForm({
      addressName: address.addressName || '',
      fullName: address.fullName || '',
      address: address.address || '',
      city: address.city || '',
      state: address.state || '',
      pincode: address.pincode || '',
      phone: address.phone || '',
      addressType: address.addressType || 'both'
    });
    setFieldErrors({
      addressName: '',
      fullName: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      phone: '',
    });
    setEditModalVisible(true);
  };

  // Handle save edited address
  const handleSaveAddress = async () => {
    if (!editingAddress) return;
    // Validate fields
    let errors = {};
    if (!editForm.addressName.trim()) errors.addressName = 'Address name is required';
    if (!editForm.fullName.trim()) errors.fullName = 'Full name is required';
    if (!editForm.address.trim()) errors.address = 'Address is required';
    if (!editForm.city.trim()) errors.city = 'City is required';
    if (!editForm.state.trim()) errors.state = 'State is required';
    if (!/^\d{6}$/.test(editForm.pincode)) errors.pincode = 'Enter a valid 6-digit pincode';
    if (!/^\d{10}$/.test(editForm.phone)) errors.phone = 'Enter a valid 10-digit phone number';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    try {
      const result = await updateAddress(editingAddress.id, editForm);
      if (result.success) {
        setEditModalVisible(false);
        setEditingAddress(null);
        fetchAddresses(); // Refresh the list
        Alert.alert('Success', 'Address updated successfully');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update address');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete address
  const handleDeleteAddress = (address) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteAddress(address.id);
              if (result.success) {
                fetchAddresses(); // Refresh the list
                Alert.alert('Success', 'Address deleted successfully');
              } else {
                Alert.alert('Error', result.message);
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to delete address');
            }
          }
        }
      ]
    );
  };

  // Handle set default address
  const handleSetDefault = async (address) => {
    try {
      const result = await setDefaultAddress(address.id);
      if (result.success) {
        fetchAddresses(); // Refresh the list
        Alert.alert('Success', 'Default address updated successfully');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to set default address');
    }
  };

  // Handle set default billing address
  const handleSetDefaultBilling = async (address) => {
    try {
      const result = await setDefaultBillingAddress(address.id);
      if (result.success) {
        fetchAddresses(); // Refresh the list
        Alert.alert('Success', 'Default billing address updated successfully');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to set default billing address');
    }
  };

  // Handle set default shipping address
  const handleSetDefaultShipping = async (address) => {
    try {
      const result = await setDefaultShippingAddress(address.id);
      if (result.success) {
        fetchAddresses(); // Refresh the list
        Alert.alert('Success', 'Default shipping address updated successfully');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to set default shipping address');
    }
  };

  // Add Address handler with validation
  const handleAddAddress = async () => {
    let errors = {};
    if (!addForm.addressName.trim()) errors.addressName = 'Address name is required';
    if (!addForm.fullName.trim()) errors.fullName = 'Full name is required';
    if (!addForm.address.trim()) errors.address = 'Address is required';
    if (!addForm.city.trim()) errors.city = 'City is required';
    if (!addForm.state.trim()) errors.state = 'State is required';
    if (!/^\d{6}$/.test(addForm.pincode)) errors.pincode = 'Enter a valid 6-digit pincode';
    if (!/^\d{10}$/.test(addForm.phone)) errors.phone = 'Enter a valid 10-digit phone number';
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
      setAddModalVisible(false);
      setAddForm({ addressName: '', fullName: '', address: '', city: '', state: '', pincode: '', phone: '', addressType: 'both' });
      setAddFieldErrors({ addressName: '', fullName: '', address: '', city: '', state: '', pincode: '', phone: '' });
      fetchAddresses();
      Alert.alert('Success', 'Address added successfully');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to add address');
    } finally {
      setAddSaving(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAddresses();
    } else {
      setError('Please login to view your addresses');
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2874f0" /></View>;
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchAddresses()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (!addresses.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.noDataText}>No addresses found.</Text>
        <Text style={styles.noDataSubtext}>Add your first address to get started.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Add Address Button */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 16 }}>
        <TouchableOpacity
          style={{ backgroundColor: '#2874f0', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8 }}
          onPress={() => {
            if (addresses.length >= 5) {
              Alert.alert('Limit Reached', 'You can only add up to 5 addresses.');
            } else {
              setAddModalVisible(true);
            }
          }}
        >
          <Icon name="plus" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: 'bold', marginLeft: 8 }}>Add Address</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        style={styles.list}
        data={addresses}
        keyExtractor={item => item.id?.toString() || Math.random().toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2874f0']}
            tintColor="#2874f0"
          />
        }
        renderItem={({ item }) => (
          <View style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <View style={styles.addressInfo}>
                <Text style={styles.name}>{item.fullName || 'Name'}</Text>
                <Text style={styles.addressType}>{item.addressName || 'Address'}</Text>
              </View>
              <View style={styles.badgeContainer}>
                {item.isDefault && <View style={styles.defaultBadge}><Text style={styles.defaultBadgeText}>Default</Text></View>}
                {item.isDefaultBilling && <View style={styles.billingBadge}><Text style={styles.badgeText}>Billing</Text></View>}
                {item.isDefaultShipping && <View style={styles.shippingBadge}><Text style={styles.badgeText}>Shipping</Text></View>}
              </View>
            </View>
            
            <Text style={styles.address}>{item.address || '-'}</Text>
            <Text style={styles.cityState}>{item.city}, {item.state} {item.pincode}</Text>
            <Text style={styles.phone}>Phone: {item.phone}</Text>
            <Text style={styles.type}>{item.addressType}</Text>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={() => handleEditAddress(item)}
              >
                <Icon name="pencil" size={16} color="#2874f0" />
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]} 
                onPress={() => handleDeleteAddress(item)}
              >
                <Icon name="delete" size={16} color="#e53935" />
                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.defaultButtons}>
              {!item.isDefault && (
                <TouchableOpacity 
                  style={styles.defaultButton} 
                  onPress={() => handleSetDefault(item)}
                >
                  <Icon name="star" size={14} color="#ff9800" />
                  <Text style={styles.defaultButtonText}>Set as Default</Text>
                </TouchableOpacity>
              )}
              
              {(item.addressType === 'billing' || item.addressType === 'both') && !item.isDefaultBilling && (
                <TouchableOpacity 
                  style={styles.defaultButton} 
                  onPress={() => handleSetDefaultBilling(item)}
                >
                  <Icon name="credit-card" size={14} color="#2196f3" />
                  <Text style={styles.defaultButtonText}>Default Billing</Text>
                </TouchableOpacity>
              )}
              
              {(item.addressType === 'shipping' || item.addressType === 'both') && !item.isDefaultShipping && (
                <TouchableOpacity 
                  style={styles.defaultButton} 
                  onPress={() => handleSetDefaultShipping(item)}
                >
                  <Icon name="truck" size={14} color="#4caf50" />
                  <Text style={styles.defaultButtonText}>Default Shipping</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />

      {/* Edit Address Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Address</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Address Name</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.addressName}
                  onChangeText={(text) => setEditForm({...editForm, addressName: text})}
                  placeholder="Home, Work, etc."
                />
                {fieldErrors.addressName ? <Text style={{ color: 'red', fontSize: 13 }}>{fieldErrors.addressName}</Text> : null}
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.fullName}
                  onChangeText={(text) => setEditForm({...editForm, fullName: text})}
                  placeholder="Enter full name"
                />
                {fieldErrors.fullName ? <Text style={{ color: 'red', fontSize: 13 }}>{fieldErrors.fullName}</Text> : null}
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Address</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.address}
                  onChangeText={(text) => setEditForm({...editForm, address: text})}
                  placeholder="Enter address"
                  multiline
                />
                {fieldErrors.address ? <Text style={{ color: 'red', fontSize: 13 }}>{fieldErrors.address}</Text> : null}
              </View>
              
              <View style={styles.row}>
                <View style={[styles.inputGroup, {flex: 1, marginRight: 8}]}> 
                  <Text style={styles.inputLabel}>City</Text>
                  <TextInput
                    style={styles.input}
                    value={editForm.city}
                    onChangeText={(text) => setEditForm({...editForm, city: text})}
                    placeholder="City"
                  />
                  {fieldErrors.city ? <Text style={{ color: 'red', fontSize: 13 }}>{fieldErrors.city}</Text> : null}
                </View>
                
                <View style={[styles.inputGroup, {flex: 1, marginLeft: 8}]}> 
                  <Text style={styles.inputLabel}>State</Text>
                  {/* Replace TextInput with Picker for Indian states */}
                  {editStateDropdown && (
                    <View style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, backgroundColor: '#fff' }}>
                      <Picker
                        selectedValue={editForm.state}
                        onValueChange={value => setEditForm({ ...editForm, state: value })}
                      >
                        <Picker.Item label="Select State" value="" />
                        {INDIAN_STATES.map(state => (
                          <Picker.Item key={state} label={state} value={state} />
                        ))}
                      </Picker>
                    </View>
                  )}
                  {fieldErrors.state ? <Text style={{ color: 'red', fontSize: 13 }}>{fieldErrors.state}</Text> : null}
                </View>
              </View>
              
              <View style={styles.row}>
                <View style={[styles.inputGroup, {flex: 1, marginRight: 8}]}> 
                  <Text style={styles.inputLabel}>Pincode</Text>
                  <TextInput
                    style={styles.input}
                    value={editForm.pincode}
                    onChangeText={text => {
                      const digits = text.replace(/[^0-9]/g, '').slice(0, 6);
                      setEditForm(f => ({ ...f, pincode: digits }));
                      if (digits.length === 6) {
                        // Call API to get state
                        fetch(`${API_BASE}/api/shipping/check-pincode?pincode=${digits}`)
                          .then(res => res.json())
                          .then(data => {
                            if (data && data.location && data.location.state) {
                              setEditForm(f => ({ ...f, state: data.location.state }));
                              setEditStateDropdown(true);
                              setFieldErrors(prev => ({ ...prev, pincode: '' }));
                            } else {
                              setEditStateDropdown(false);
                              setFieldErrors(prev => ({ ...prev, pincode: 'Pincode is wrong' }));
                            }
                          })
                          .catch(() => {
                            setEditStateDropdown(false);
                            setFieldErrors(prev => ({ ...prev, pincode: 'Pincode is wrong' }));
                          });
                      } else {
                        setEditStateDropdown(false);
                        if (digits.length > 0 && digits.length < 6) {
                          setFieldErrors(prev => ({ ...prev, pincode: 'Enter a valid 6-digit pincode' }));
                        } else {
                          setFieldErrors(prev => ({ ...prev, pincode: '' }));
                        }
                      }
                    }}
                    placeholder="Pincode"
                    keyboardType="numeric"
                    maxLength={6}
                  />
                  {fieldErrors.pincode ? <Text style={{ color: 'red', fontSize: 13 }}>{fieldErrors.pincode}</Text> : null}
                </View>
                
                <View style={[styles.inputGroup, {flex: 1, marginLeft: 8}]}> 
                  <Text style={styles.inputLabel}>Phone</Text>
                  <TextInput
                    style={styles.input}
                    value={editForm.phone}
                    onChangeText={v => {
                      const digits = v.replace(/[^0-9]/g, '').slice(0, 10);
                      setEditForm(f => ({ ...f, phone: digits }));
                      if (digits.length === 10) {
                        setFieldErrors(prev => ({ ...prev, phone: '' }));
                      } else if (digits.length > 0 && digits.length < 10) {
                        setFieldErrors(prev => ({ ...prev, phone: 'Enter a valid 10-digit phone number' }));
                      } else {
                        setFieldErrors(prev => ({ ...prev, phone: '' }));
                      }
                    }}
                    placeholder="Phone"
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                  {fieldErrors.phone ? <Text style={{ color: 'red', marginBottom: 6, fontSize: 13 }}>{fieldErrors.phone}</Text> : null}
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
                onPress={handleSaveAddress}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Address Modal */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Address</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
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
                  {/* Replace TextInput with Picker for Indian states */}
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
              <TouchableOpacity style={styles.cancelButton} onPress={() => setAddModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveButton, addSaving && styles.saveButtonDisabled]} onPress={handleAddAddress} disabled={addSaving}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafd' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  list: { flex: 1, backgroundColor: '#f8fafd' },
  addressCard: { backgroundColor: '#fff', margin: 12, padding: 18, borderRadius: 10, elevation: 2 },
  
  // Address Header
  addressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  addressInfo: { flex: 1 },
  badgeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  defaultBadge: { backgroundColor: '#ff9800', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  defaultBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  billingBadge: { backgroundColor: '#2196f3', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  shippingBadge: { backgroundColor: '#4caf50', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  
  // Address Content
  name: { fontSize: 16, fontWeight: 'bold', color: '#2874f0' },
  addressType: { fontSize: 14, color: '#666', marginTop: 2, fontStyle: 'italic' },
  address: { fontSize: 15, color: '#222', marginTop: 4 },
  cityState: { fontSize: 15, color: '#444', marginTop: 4 },
  phone: { fontSize: 14, color: '#666', marginTop: 4 },
  type: { fontSize: 12, color: '#888', marginTop: 4, fontWeight: '500' },
  
  // Action Buttons
  actionButtons: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#ddd' },
  actionButtonText: { marginLeft: 4, fontSize: 14, color: '#6B3F1D' },
  deleteButton: { borderColor: '#e53935' },
  deleteButtonText: { color: '#e53935' },
  
  // Default Buttons
  defaultButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  defaultButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#ddd' },
  defaultButtonText: { marginLeft: 4, fontSize: 12, color: '#666' },
  
  // Error and Loading States
  errorText: { color: '#e53935', fontSize: 16, textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: '#6B3F1D', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  noDataText: { fontSize: 18, color: '#666', marginBottom: 8 },
  noDataSubtext: { fontSize: 14, color: '#999', textAlign: 'center' },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, width: '90%', maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#222' },
  modalBody: { padding: 20, maxHeight: 400 },
  modalFooter: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderTopWidth: 1, borderTopColor: '#eee' },
  
  // Form Styles
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, backgroundColor: '#fff' },
  row: { flexDirection: 'row' },
  
  // Button Styles
  cancelButton: { flex: 1, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginRight: 8 },
  cancelButtonText: { textAlign: 'center', fontSize: 16, color: '#666' },
  saveButton: { flex: 1, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#2874f0', marginLeft: 8 },
  saveButtonText: { textAlign: 'center', fontSize: 16, color: '#fff', fontWeight: '600' },
  saveButtonDisabled: { backgroundColor: '#ccc' },
}); 