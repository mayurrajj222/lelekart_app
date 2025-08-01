import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, TextInput, Button, ScrollView, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE } from '../../lib/api';

const sellerMenu = [
  { label: 'Dashboard', icon: 'view-dashboard-outline', key: 'dashboard' },
  { label: 'Products', icon: 'cube-outline', key: 'products' },
  { label: 'Add New Product', icon: 'bookmark-outline', key: 'addProduct' },
  { label: 'Bulk Import', icon: 'upload-outline', key: 'bulkImport' },
  { label: 'Inventory', icon: 'package-variant-closed', key: 'inventory' },
  { label: 'Smart Inventory', icon: 'chart-bar', key: 'smartInventory' },
  { label: 'Orders', icon: 'shopping-outline', key: 'orders' },
  { label: 'Returns', icon: 'backup-restore', key: 'returns' },
  { label: 'Analytics', icon: 'chart-line', key: 'analytics' },
  { label: 'Payments', icon: 'credit-card-outline', key: 'payments' },
  { label: 'Settings', icon: 'cog-outline', key: 'settings' },
  { label: 'Help & Support', icon: 'help-circle-outline', key: 'help' },
];

export default function SellerProfileScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const [sellerStatus, setSellerStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');

  useEffect(() => {
    let isMounted = true;
    async function fetchSellerStatus() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/seller/status`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setSellerStatus(data);
        } else {
          if (isMounted) setSellerStatus({ message: 'Unable to fetch status', approved: false });
        }
      } catch (e) {
        if (isMounted) setSellerStatus({ message: 'Unable to fetch status', approved: false });
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchSellerStatus();
    return () => { isMounted = false; };
  }, []);

  const handleMenuPress = (key) => {
    // Implement navigation for each menu item if screens exist
    if (navigation && navigation.navigate) {
      navigation.navigate(key.charAt(0).toUpperCase() + key.slice(1));
    } else {
      Alert.alert('Coming Soon', `Feature "${key}" is coming soon!`);
    }
  };

  const handleEditProfile = () => {
    setEditName(user?.name || '');
    setEditModalVisible(true);
  };

  const handleSaveProfile = () => {
    // Optionally, send update to backend here
    setEditModalVisible(false);
  };

  if (!user) {
    return <View style={styles.center}><Text>Please log in as a seller.</Text></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileHeader}>
        {user.profileImage ? (
          <Image source={{ uri: user.profileImage }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Icon name="account-circle" size={64} color="#2874f0" />
          </View>
        )}
        <TouchableOpacity onPress={handleEditProfile}>
          <Text style={styles.profileName}>{user.name || user.username || 'Seller'}</Text>
        </TouchableOpacity>
        <Text style={styles.profileEmail}>{user.email}</Text>
        <View style={styles.statusBadge}>
          {loading ? (
            <ActivityIndicator size="small" color="#2874f0" />
          ) : (
            <Text style={styles.statusText}>
              Seller Status: <Text style={{ color: sellerStatus?.approved ? 'green' : 'orange' }}>{sellerStatus?.message || 'Unknown'}</Text>
            </Text>
          )}
        </View>
      </View>
      <View style={styles.menuList}>
        {sellerMenu.map(item => (
          <TouchableOpacity
            key={item.key}
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => handleMenuPress(item.key)}
          >
            <Icon name={item.icon} size={24} color={'#222'} style={{ marginRight: 18 }} />
            <Text style={styles.menuLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.menuItem} onPress={logout}>
          <Icon name="logout" size={24} color="#e53935" style={{ marginRight: 18 }} />
          <Text style={[styles.menuLabel, { color: '#e53935', fontWeight: 'bold' }]}>Logout</Text>
        </TouchableOpacity>
      </View>
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Name</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Enter your name"
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <Button title="Cancel" onPress={() => setEditModalVisible(false)} />
              <View style={{ width: 12 }} />
              <Button title="Save" onPress={handleSaveProfile} />
            </View>
          </View>
        </View>
      </Modal>
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 Lelekart Seller Hub</Text>
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
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 12, backgroundColor: '#e3eafc' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  profileName: { fontSize: 22, fontWeight: 'bold', color: '#2874f0', marginBottom: 2 },
  profileEmail: { fontSize: 15, color: '#888', marginBottom: 2 },
  statusBadge: { marginTop: 8, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 12, backgroundColor: '#e6f9ec' },
  statusText: { fontWeight: 'bold', color: '#2874f0' },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', padding: 24, borderRadius: 12, width: 300 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#2874f0' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 16 },
  footer: { alignItems: 'center', marginTop: 32, marginBottom: 16 },
  footerText: { fontSize: 13, color: '#888' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
}); 