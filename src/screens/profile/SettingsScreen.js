import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  Image,
  Linking
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { API_BASE } from '../../lib/api';
import { AuthContext } from '../../context/AuthContext';
import {launchImageLibrary} from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
// import FaqModal from '../BottomDials/FaqModal'; // Removed because BottomDials folder was deleted

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { user, setUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Modal states
  const [profileModal, setProfileModal] = useState(false);
  const [securityModal, setSecurityModal] = useState(false);
  // const [notificationsModal, setNotificationsModal] = useState(false); // Removed
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    phone: '',
    address: ''
  });
  
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // const [notificationSettings, setNotificationSettings] = useState({ // Removed
  //   orderUpdates: true,
  //   promotions: true,
  //   priceAlerts: true,
  //   stockAlerts: true,
  //   accountUpdates: true,
  //   deliveryUpdates: true,
  //   recommendationAlerts: true,
  //   paymentReminders: true
  // });

  // Add state for seller-specific modals and forms
  const [storeModal, setStoreModal] = useState(false);
  const [pickupModal, setPickupModal] = useState(false);
  const [taxModal, setTaxModal] = useState(false);
  const [holidayModal, setHolidayModal] = useState(false);
  const [returnPolicyModal, setReturnPolicyModal] = useState(false);
  const [storeForm, setStoreForm] = useState({ name: '', description: '', contact: '' });
  const [pickupForm, setPickupForm] = useState({ address: '', city: '', state: '', pincode: '', phone: '' });
  const [taxForm, setTaxForm] = useState({ gstin: '', businessName: '', pan: '' });
  const [holidayMode, setHolidayMode] = useState(false);
  const [holidayEndDate, setHolidayEndDate] = useState('');
  const [autoAcceptOrders, setAutoAcceptOrders] = useState(false);
  const [returnPolicy, setReturnPolicy] = useState('');

  // Add state for profile photo
  const [profilePhoto, setProfilePhoto] = useState(user?.profileImage || user?.avatar || '');
  const [photoUploading, setPhotoUploading] = useState(false);

  // Add state for phone and pincode errors
  const [phoneError, setPhoneError] = useState('');
  const [pincodeError, setPincodeError] = useState('');

  // Sync profilePhoto with user context
  useEffect(() => {
    setProfilePhoto(user?.profileImage || user?.avatar || '');
  }, [user]);

  // Add state for FAQ WebView modal
  const [faqModalVisible, setFaqModalVisible] = useState(false);

  // Add utility to determine if user is seller
  const isSeller = user && user.role === 'seller';

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      let userData, notifData;
      if (isSeller) {
        // Seller: fetch seller settings
        const res = await fetch(`${API_BASE}/api/seller/settings`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to fetch seller settings');
        userData = await res.json();
        setProfileForm({
          username: userData.personalInfo?.username || '',
          email: userData.personalInfo?.email || '',
          phone: userData.personalInfo?.phone || '',
          address: userData.address?.address || ''
        });
        notifData = userData.notificationPreferences || {};
        setStoreForm(userData.store || { name: '', description: '', contact: '' });
        setPickupForm(userData.pickupAddress || { address: '', city: '', state: '', pincode: '', phone: '' });
        setTaxForm(userData.taxInformation || { gstin: '', businessName: '', pan: '' });
        setHolidayMode(userData.holidayMode || false);
        setHolidayEndDate(userData.holidayModeEndDate || '');
        setAutoAcceptOrders(userData.autoAcceptOrders || false);
        setReturnPolicy(userData.returnPolicy || '');
      } else {
        // Buyer: fetch user settings
        const res = await fetch(`${API_BASE}/api/user`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to fetch user data');
        userData = await res.json();
        setProfileForm({
          username: userData.username || '',
          email: userData.email || '',
          phone: userData.phone || '',
          address: userData.address || ''
        });
        // Fetch notification preferences
        try {
          const notifRes = await fetch(`${API_BASE}/api/user/notification-preferences`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });
          if (notifRes.ok) notifData = await notifRes.json();
        } catch {}
      }
      // setNotificationSettings({ // Removed
      //   orderUpdates: notifData.orderUpdates ?? true,
      //   promotions: notifData.promotions ?? true,
      //   priceAlerts: notifData.priceAlerts ?? true,
      //   stockAlerts: notifData.stockAlerts ?? true,
      //   accountUpdates: notifData.accountUpdates ?? true,
      //   deliveryUpdates: notifData.deliveryUpdates ?? true,
      //   recommendationAlerts: notifData.recommendationAlerts ?? true,
      //   paymentReminders: notifData.paymentReminders ?? true
      // });
    } catch (err) {
      setError(err.message || 'Error fetching settings');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (profileForm.phone.length !== 10) {
      setPhoneError('Please enter 10 digit valid phone number');
      return;
    } else {
      setPhoneError('');
    }
    setSaving(true);
    try {
      let res;
      if (isSeller) {
        res = await fetch(`${API_BASE}/api/seller/settings/personal-info`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(profileForm),
        });
      } else {
        res = await fetch(`${API_BASE}/api/user/profile`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(profileForm),
        });
      }
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
      // Fetch the latest user data from backend and update AuthContext
      const userRes = await fetch(`${API_BASE}/api/user`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData);
      }
      setProfileModal(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (securityForm.newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/user/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: securityForm.currentPassword,
          newPassword: securityForm.newPassword
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update password');
      }

      setSecurityModal(false);
      setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      Alert.alert('Success', 'Password updated successfully');
    } catch (err) {
      console.error('Error updating password:', err);
      Alert.alert('Error', err.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  // const handleNotificationUpdate = async () => { // Removed
  //   setSaving(true);
  //   try {
  //     let res;
  //     if (isSeller) {
  //       res = await fetch(`${API_BASE}/api/seller/settings/notifications`, {
  //         method: 'PUT',
  //         headers: { 'Content-Type': 'application/json' },
  //         credentials: 'include',
  //         body: JSON.stringify(notificationSettings),
  //       });
  //     } else {
  //       res = await fetch(`${API_BASE}/api/user/notification-preferences`, {
  //         method: 'PUT',
  //         headers: { 'Content-Type': 'application/json' },
  //         credentials: 'include',
  //         body: JSON.stringify(notificationSettings),
  //       });
  //     }
  //     if (!res.ok) {
  //       const errorData = await res.json();
  //       Alert.alert('Error', errorData.error || 'Failed to update notification preferences');
  //       return; // Do not close modal or show success
  //     }
  //     setNotificationsModal(false);
  //     Alert.alert('Success', 'Notification preferences updated successfully');
  //   } catch (err) {
  //     Alert.alert('Error', err.message || 'Failed to update notification preferences');
  //   } finally {
  //     setSaving(false);
  //   }
  // };

  // const toggleNotification = (key) => { // Removed
  //   setNotificationSettings(prev => ({
  //     ...prev,
  //     [key]: !prev[key]
  //   }));
  // };

  // Add handlers for saving each section
  const handleStoreSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/seller/settings/store`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(storeForm),
      });
      if (!res.ok) throw new Error('Failed to update store info');
      setStoreModal(false);
      Alert.alert('Success', 'Store info updated');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update store info');
    } finally {
      setSaving(false);
    }
  };
  const handlePickupSave = async () => {
    if (pickupForm.pincode.length !== 6) {
      setPincodeError('Please enter a valid 6 digit pincode');
      return;
    } else {
      setPincodeError('');
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/seller/settings/pickup-address`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(pickupForm),
      });
      if (!res.ok) throw new Error('Failed to update pickup address');
      setPickupModal(false);
      Alert.alert('Success', 'Pickup address updated');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update pickup address');
    } finally {
      setSaving(false);
    }
  };
  const handleTaxSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/seller/settings/tax-info`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(taxForm),
      });
      if (!res.ok) throw new Error('Failed to update tax info');
      setTaxModal(false);
      Alert.alert('Success', 'Tax info updated');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update tax info');
    } finally {
      setSaving(false);
    }
  };
  const handleHolidaySave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/seller/settings/holiday-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ holidayMode, holidayModeEndDate: holidayEndDate }),
      });
      if (!res.ok) throw new Error('Failed to update holiday mode');
      setHolidayModal(false);
      Alert.alert('Success', 'Holiday mode updated');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update holiday mode');
    } finally {
      setSaving(false);
    }
  };
  const handleReturnPolicySave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/seller/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ returnPolicy }),
      });
      if (!res.ok) throw new Error('Failed to update return policy');
      setReturnPolicyModal(false);
      Alert.alert('Success', 'Return policy updated');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update return policy');
    } finally {
      setSaving(false);
    }
  };
  const handleAutoAcceptToggle = async (value) => {
    setAutoAcceptOrders(value);
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/seller/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ autoAcceptOrders: value }),
      });
      if (!res.ok) throw new Error('Failed to update auto accept orders');
      Alert.alert('Success', 'Auto accept orders updated');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update auto accept orders');
    } finally {
      setSaving(false);
    }
  };

  // Add handler for picking and uploading a new profile photo
  const handlePickProfilePhoto = async () => {
    let result = await new Promise((resolve, reject) => {
      launchImageLibrary({mediaType: 'photo', quality: 0.7, selectionLimit: 1}, (response) => {
        if (response.didCancel) return resolve({ cancelled: true });
        if (response.errorCode) return reject(response.errorMessage);
        resolve({ cancelled: false, assets: response.assets });
      });
    });
    if (!result.cancelled && result.assets && result.assets[0]?.uri) {
      setPhotoUploading(true);
      try {
        const uri = result.assets[0].uri;
        // Upload to backend
        const formData = new FormData();
        formData.append('profileImage', { uri, name: 'profile.jpg', type: 'image/jpeg' });
        const endpoint = `${API_BASE}/api/user/profile-image`;
        console.log('Uploading profile image to:', endpoint, formData);
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'multipart/form-data' },
          credentials: 'include',
          body: formData,
        });
        if (!res.ok) throw new Error('Failed to update profile photo');
        // Check if response is JSON
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.profileImage) {
            setProfilePhoto(data.profileImage);
            const updatedUser = { ...user, profileImage: data.profileImage };
            setUser(updatedUser);
          } else {
            setProfilePhoto('');
            const updatedUser = { ...user, profileImage: '' };
            setUser(updatedUser);
          }
        } else {
          const text = await res.text();
          console.error('Server did not return JSON. Response:', text);
          throw new Error('Server did not return JSON: ' + text);
        }
        Alert.alert('Success', 'Profile photo updated');
      } catch (err) {
        Alert.alert('Error', err.message || 'Failed to update profile photo');
      } finally {
        setPhotoUploading(false);
      }
    }
  };

  // Add handler for removing profile photo
  const handleRemoveProfilePhoto = async () => {
    setPhotoUploading(true);
    try {
      setProfilePhoto(''); // This ensures the local state is cleared
      const updatedUser = { ...user, profileImage: '' };
      setUser(updatedUser);
      // Send request to backend to remove profile image
      const endpoint = isSeller ? `${API_BASE}/api/seller/settings/personal-info` : `${API_BASE}/api/user/profile`;
      const method = isSeller ? 'PUT' : 'PATCH';
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ profileImage: '' }),
      });
      if (!res.ok) throw new Error('Failed to remove profile photo');
      // Re-fetch user data to update AuthContext everywhere
      const userRes = await fetch(`${API_BASE}/api/user`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (userRes.ok) {
        const freshUser = await userRes.json();
        setUser(freshUser);
        setProfilePhoto(freshUser.profileImage || freshUser.avatar || ''); // Update local state to match backend
      } else {
        setProfilePhoto(''); // Fallback to default avatar
      }
      Alert.alert('Success', 'Profile photo removed');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to remove profile photo');
    } finally {
      setPhotoUploading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserData();
    } else {
      setError('Please login to view settings');
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2874f0" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchUserData()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Profile Photo Section */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <TouchableOpacity onPress={handlePickProfilePhoto} disabled={photoUploading}>
            <Image
              source={profilePhoto ? { uri: profilePhoto } : require('../assets/avatar.png')}
              style={{ width: 90, height: 90, borderRadius: 45, marginBottom: 8, backgroundColor: '#e3eafc' }}
            />
            <Text style={{ color: '#2874f0', fontWeight: 'bold', textAlign: 'center' }}>{photoUploading ? 'Uploading...' : 'Change Profile Photo'}</Text>
          </TouchableOpacity>
         {profilePhoto ? (
           <TouchableOpacity onPress={handleRemoveProfilePhoto} disabled={photoUploading} style={{ marginTop: 8 }}>
             <Text style={{ color: '#e53935', fontWeight: 'bold', textAlign: 'center' }}>Remove Photo</Text>
           </TouchableOpacity>
         ) : null}
        </View>

        {/* Settings Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={() => setProfileModal(true)}>
            <View style={styles.settingIcon}>
              <Icon name="account" size={24} color="#2874f0" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Profile Information</Text>
              <Text style={styles.settingSubtitle}>Update your personal details</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>

          {/* <TouchableOpacity style={styles.settingItem} onPress={() => setNotificationsModal(true)}> // Removed
            <View style={styles.settingIcon}>
              <Icon name="bell" size={24} color="#ff9800" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Notifications</Text>
              <Text style={styles.settingSubtitle}>Manage notification preferences</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity> */}
          {/* <TouchableOpacity style={styles.settingItem} onPress={() => setFaqModalVisible(true)}> // Removed
            <View style={styles.settingIcon}>
              <Icon name="help-circle" size={24} color="#666" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Help & Support</Text>
              <Text style={styles.settingSubtitle}>Get help and contact support</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity> */}
        </View>

        {isSeller && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Seller Settings</Text>
            <TouchableOpacity style={styles.settingItem} onPress={() => setStoreModal(true)}>
              <View style={styles.settingIcon}>
                <Icon name="store" size={24} color="#2874f0" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Store Info</Text>
                <Text style={styles.settingSubtitle}>Update your store details</Text>
              </View>
              <Icon name="chevron-right" size={24} color="#ccc" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem} onPress={() => setTaxModal(true)}>
              <View style={styles.settingIcon}>
                <Icon name="file-document" size={24} color="#4caf50" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Tax Info</Text>
                <Text style={styles.settingSubtitle}>GST and business tax details</Text>
              </View>
              <Icon name="chevron-right" size={24} color="#ccc" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem} onPress={() => setPickupModal(true)}>
              <View style={styles.settingIcon}>
                <Icon name="truck" size={24} color="#ff9800" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Pickup Address</Text>
                <Text style={styles.settingSubtitle}>Manage your pickup address</Text>
              </View>
              <Icon name="chevron-right" size={24} color="#ccc" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem} onPress={() => setHolidayModal(true)}>
              <View style={styles.settingIcon}>
                <Icon name="calendar-remove" size={24} color="#e91e63" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Holiday Mode</Text>
                <Text style={styles.settingSubtitle}>Temporarily pause your store</Text>
              </View>
              <Icon name="chevron-right" size={24} color="#ccc" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem} onPress={() => setReturnPolicyModal(true)}>
              <View style={styles.settingIcon}>
                <Icon name="clipboard-text" size={24} color="#607d8b" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Return Policy</Text>
                <Text style={styles.settingSubtitle}>Set your store's return policy</Text>
              </View>
              <Icon name="chevron-right" size={24} color="#ccc" />
            </TouchableOpacity>
            <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Icon name="check-circle" size={24} color="#009688" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Auto Accept Orders</Text>
                <Text style={styles.settingSubtitle}>Automatically accept all new orders</Text>
              </View>
              <Switch value={autoAcceptOrders} onValueChange={handleAutoAcceptToggle} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Profile Modal */}
      <Modal
        visible={profileModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setProfileModal(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  style={styles.input}
                  value={profileForm.username}
                  onChangeText={(text) => setProfileForm({...profileForm, username: text})}
                  placeholder="Enter username"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={profileForm.email}
                  onChangeText={(text) => setProfileForm({...profileForm, email: text})}
                  placeholder="Enter email"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={profileForm.phone}
                  onChangeText={text => {
                    // Only allow digits, max 10
                    const digits = text.replace(/[^0-9]/g, '').slice(0, 10);
                    setProfileForm(f => ({ ...f, phone: digits }));
                    if (digits.length === 10) {
                      setPhoneError('');
                    } else if (digits.length > 0 && digits.length < 10) {
                      setPhoneError('Please enter 10 digit valid phone number');
                    } else {
                      setPhoneError('');
                    }
                  }}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                {phoneError ? (
                  <Text style={{ color: 'red', fontSize: 13, marginBottom: 4 }}>{phoneError}</Text>
                ) : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Address</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={profileForm.address}
                  onChangeText={(text) => setProfileForm({...profileForm, address: text})}
                  placeholder="Enter address"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setProfileModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.disabledButton]}
                onPress={handleProfileUpdate}
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

      {/* Notifications Modal (Removed) */}
      {/* <Modal // Removed
        visible={notificationsModal} // Removed
        animationType="slide" // Removed
        transparent={true} // Removed
        onRequestClose={() => setNotificationsModal(false)} // Removed
      > // Removed
        <View style={styles.modalOverlay}> // Removed
          <View style={styles.modalContent}> // Removed
            <View style={styles.modalHeader}> // Removed
              <Text style={styles.modalTitle}>Notification Preferences</Text> // Removed
              <TouchableOpacity onPress={() => setNotificationsModal(false)}> // Removed
                <Icon name="close" size={24} color="#666" /> // Removed
              </TouchableOpacity> // Removed
            </View> // Removed

            <ScrollView style={styles.modalBody}> // Removed
              <View style={styles.notificationItem}> // Removed
                <View style={styles.notificationInfo}> // Removed
                  <Text style={styles.notificationTitle}>Order Updates</Text> // Removed
                  <Text style={styles.notificationSubtitle}>Get notified about order status changes</Text> // Removed
                </View> // Removed
                <Switch // Removed
                  value={notificationSettings.orderUpdates} // Removed
                  onValueChange={() => toggleNotification('orderUpdates')} // Removed
                  trackColor={{ false: '#ddd', true: '#2874f0' }} // Removed
                  thumbColor="#fff" // Removed
                /> // Removed
              </View> // Removed

              <View style={styles.notificationItem}> // Removed
                <View style={styles.notificationInfo}> // Removed
                  <Text style={styles.notificationTitle}>Promotions</Text> // Removed
                  <Text style={styles.notificationSubtitle}>Receive promotional offers and discounts</Text> // Removed
                </View> // Removed
                <Switch // Removed
                  value={notificationSettings.promotions} // Removed
                  onValueChange={() => toggleNotification('promotions')} // Removed
                  trackColor={{ false: '#ddd', true: '#2874f0' }} // Removed
                  thumbColor="#fff" // Removed
                /> // Removed
              </View> // Removed

              <View style={styles.notificationItem}> // Removed
                <View style={styles.notificationInfo}> // Removed
                  <Text style={styles.notificationTitle}>Price Alerts</Text> // Removed
                  <Text style={styles.notificationSubtitle}>Get notified when prices drop</Text> // Removed
                </View> // Removed
                <Switch // Removed
                  value={notificationSettings.priceAlerts} // Removed
                  onValueChange={() => toggleNotification('priceAlerts')} // Removed
                  trackColor={{ false: '#ddd', true: '#2874f0' }} // Removed
                  thumbColor="#fff" // Removed
                /> // Removed
              </View> // Removed

              <View style={styles.notificationItem}> // Removed
                <View style={styles.notificationInfo}> // Removed
                  <Text style={styles.notificationTitle}>Stock Alerts</Text> // Removed
                  <Text style={styles.notificationSubtitle}>Get notified when items come back in stock</Text> // Removed
                </View> // Removed
                <Switch // Removed
                  value={notificationSettings.stockAlerts} // Removed
                  onValueChange={() => toggleNotification('stockAlerts')} // Removed
                  trackColor={{ false: '#ddd', true: '#2874f0' }} // Removed
                  thumbColor="#fff" // Removed
                /> // Removed
              </View> // Removed

              <View style={styles.notificationItem}> // Removed
                <View style={styles.notificationInfo}> // Removed
                  <Text style={styles.notificationTitle}>Account Updates</Text> // Removed
                  <Text style={styles.notificationSubtitle}>Important account-related notifications</Text> // Removed
                </View> // Removed
                <Switch // Removed
                  value={notificationSettings.accountUpdates} // Removed
                  onValueChange={() => toggleNotification('accountUpdates')} // Removed
                  trackColor={{ false: '#ddd', true: '#2874f0' }} // Removed
                  thumbColor="#fff" // Removed
                /> // Removed
              </View> // Removed

              <View style={styles.notificationItem}> // Removed
                <View style={styles.notificationInfo}> // Removed
                  <Text style={styles.notificationTitle}>Delivery Updates</Text> // Removed
                  <Text style={styles.notificationSubtitle}>Track your order delivery status</Text> // Removed
                </View> // Removed
                <Switch // Removed
                  value={notificationSettings.deliveryUpdates} // Removed
                  onValueChange={() => toggleNotification('deliveryUpdates')} // Removed
                  trackColor={{ false: '#ddd', true: '#2874f0' }} // Removed
                  thumbColor="#fff" // Removed
                /> // Removed
              </View> // Removed
            </ScrollView> // Removed

            <View style={styles.modalFooter}> // Removed
              <TouchableOpacity // Removed
                style={styles.cancelButton} // Removed
                onPress={() => setNotificationsModal(false)} // Removed
              > // Removed
                <Text style={styles.cancelButtonText}>Cancel</Text> // Removed
              </TouchableOpacity> // Removed

              <TouchableOpacity // Removed
                style={[styles.saveButton, saving && styles.disabledButton]} // Removed
                onPress={handleNotificationUpdate} // Removed
                disabled={saving} // Removed
              > // Removed
                {saving ? ( // Removed
                  <ActivityIndicator size="small" color="#fff" /> // Removed
                ) : ( // Removed
                  <Text style={styles.saveButtonText}>Save</Text> // Removed
                )} // Removed
              </TouchableOpacity> // Removed
            </View> // Removed
          </View> // Removed
        </View> // Removed
      </Modal> // Removed */}

      {/* Store Info Modal */}
      <Modal visible={storeModal} animationType="slide" transparent onRequestClose={() => setStoreModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Store Info</Text>
              <TouchableOpacity onPress={() => setStoreModal(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Store Name</Text>
                <TextInput style={styles.input} value={storeForm.name} onChangeText={text => setStoreForm(f => ({ ...f, name: text }))} placeholder="Enter store name" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput style={styles.input} value={storeForm.description} onChangeText={text => setStoreForm(f => ({ ...f, description: text }))} placeholder="Enter description" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Contact</Text>
                <TextInput style={styles.input} value={storeForm.contact} onChangeText={text => setStoreForm(f => ({ ...f, contact: text }))} placeholder="Enter contact details" />
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setStoreModal(false)}><Text style={styles.cancelButtonText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.saveButton, saving && styles.disabledButton]} onPress={handleStoreSave} disabled={saving}>{saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveButtonText}>Save</Text>}</TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pickup Address Modal */}
      <Modal visible={pickupModal} animationType="slide" transparent onRequestClose={() => setPickupModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Pickup Address</Text>
              <TouchableOpacity onPress={() => setPickupModal(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Address</Text>
                <TextInput style={styles.input} value={pickupForm.address} onChangeText={text => setPickupForm(f => ({ ...f, address: text }))} placeholder="Enter address" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>City</Text>
                <TextInput style={styles.input} value={pickupForm.city} onChangeText={text => setPickupForm(f => ({ ...f, city: text }))} placeholder="Enter city" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>State</Text>
                <TextInput style={styles.input} value={pickupForm.state} onChangeText={text => setPickupForm(f => ({ ...f, state: text }))} placeholder="Enter state" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Pincode</Text>
                <TextInput
                  style={styles.input}
                  value={pickupForm.pincode}
                  onChangeText={text => {
                    // Only allow digits, max 6
                    const digits = text.replace(/[^0-9]/g, '').slice(0, 6);
                    setPickupForm(f => ({ ...f, pincode: digits }));
                    if (digits.length === 6) {
                      setPincodeError('');
                    } else if (digits.length > 0 && digits.length < 6) {
                      setPincodeError('Please enter a valid 6 digit pincode');
                    } else {
                      setPincodeError('');
                    }
                  }}
                  placeholder="Enter pincode"
                  keyboardType="numeric"
                  maxLength={6}
                />
                {pincodeError ? (
                  <Text style={{ color: 'red', fontSize: 13, marginBottom: 4 }}>{pincodeError}</Text>
                ) : null}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput style={styles.input} value={pickupForm.phone} onChangeText={text => setPickupForm(f => ({ ...f, phone: text }))} placeholder="Enter phone number" keyboardType="phone-pad" />
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setPickupModal(false)}><Text style={styles.cancelButtonText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.saveButton, saving && styles.disabledButton]} onPress={handlePickupSave} disabled={saving}>{saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveButtonText}>Save</Text>}</TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Tax Info Modal */}
      <Modal visible={taxModal} animationType="slide" transparent onRequestClose={() => setTaxModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Tax Info</Text>
              <TouchableOpacity onPress={() => setTaxModal(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>GSTIN</Text>
                <TextInput style={styles.input} value={taxForm.gstin} onChangeText={text => setTaxForm(f => ({ ...f, gstin: text }))} placeholder="Enter GSTIN" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Business Name</Text>
                <TextInput style={styles.input} value={taxForm.businessName} onChangeText={text => setTaxForm(f => ({ ...f, businessName: text }))} placeholder="Enter business name" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PAN</Text>
                <TextInput style={styles.input} value={taxForm.pan} onChangeText={text => setTaxForm(f => ({ ...f, pan: text }))} placeholder="Enter PAN" />
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setTaxModal(false)}><Text style={styles.cancelButtonText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.saveButton, saving && styles.disabledButton]} onPress={handleTaxSave} disabled={saving}>{saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveButtonText}>Save</Text>}</TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Holiday Mode Modal */}
      <Modal visible={holidayModal} animationType="slide" transparent onRequestClose={() => setHolidayModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Holiday Mode</Text>
              <TouchableOpacity onPress={() => setHolidayModal(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Enable Holiday Mode</Text>
                <Switch value={holidayMode} onValueChange={setHolidayMode} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>End Date (optional)</Text>
                <TextInput style={styles.input} value={holidayEndDate} onChangeText={setHolidayEndDate} placeholder="YYYY-MM-DD" />
              </View>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setHolidayModal(false)}><Text style={styles.cancelButtonText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.saveButton, saving && styles.disabledButton]} onPress={handleHolidaySave} disabled={saving}>{saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveButtonText}>Save</Text>}</TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Return Policy Modal */}
      <Modal visible={returnPolicyModal} animationType="slide" transparent onRequestClose={() => setReturnPolicyModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Return Policy</Text>
              <TouchableOpacity onPress={() => setReturnPolicyModal(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Return Policy</Text>
                <TextInput style={[styles.input, styles.textArea]} value={returnPolicy} onChangeText={setReturnPolicy} placeholder="Enter return policy" multiline numberOfLines={4} />
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setReturnPolicyModal(false)}><Text style={styles.cancelButtonText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.saveButton, saving && styles.disabledButton]} onPress={handleReturnPolicySave} disabled={saving}>{saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveButtonText}>Save</Text>}</TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* FAQ Modal (new) */}
      {/* <FaqModal visible={faqModalVisible} onClose={() => setFaqModalVisible(false)} /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafd' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  scrollView: { flex: 1 },
  
  // Header
  header: { padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#222' },
  
  // Sections
  section: { backgroundColor: '#fff', marginTop: 8, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#222', marginVertical: 16 },
  
  // Setting Items
  settingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  settingIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8f9fa', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  settingInfo: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: '600', color: '#222' },
  settingSubtitle: { fontSize: 14, color: '#666', marginTop: 2 },
  settingValue: { fontSize: 14, color: '#999' },
  
  // Notification Items (Removed)
  // notificationItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  // notificationInfo: { flex: 1 },
  // notificationTitle: { fontSize: 16, fontWeight: '600', color: '#222' },
  // notificationSubtitle: { fontSize: 14, color: '#666', marginTop: 2 },
  
  // Error and Loading
  errorText: { color: '#e53935', fontSize: 16, textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: '#2874f0', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  
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
  textArea: { height: 80, textAlignVertical: 'top' },
  
  // Button Styles
  cancelButton: { flex: 1, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginRight: 8 },
  cancelButtonText: { textAlign: 'center', fontSize: 16, color: '#666' },
  saveButton: { flex: 1, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#2874f0', marginLeft: 8 },
  saveButtonText: { textAlign: 'center', fontSize: 16, color: '#fff', fontWeight: '600' },
  disabledButton: { backgroundColor: '#ccc' },
}); 