import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, TextInput, Button, Alert } from 'react-native';
import { API_BASE } from '../../lib/api';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

export default function ProfileDetailsScreen() {
  const { setUser } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editFields, setEditFields] = useState({ username: '', email: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const userRes = await fetch(`${API_BASE}/api/user`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        const userData = await userRes.json();
        if (!userRes.ok) throw new Error(userData.error || 'Failed to fetch user info');
        setUser(userData);
        setEditFields({
          username: userData.username || '',
          email: userData.email || '',
          phone: userData.phone || '',
          address: userData.address || '',
        });
      } catch (err) {
        setError(err.message || 'Error fetching profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);
  // Expose fetchProfile for use after save
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const userRes = await fetch(`${API_BASE}/api/user`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const userData = await userRes.json();
      if (!userRes.ok) throw new Error(userData.error || 'Failed to fetch user info');
      setUser(userData);
      setEditFields({
        username: userData.username || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || '',
      });
    } catch (err) {
      setError(err.message || 'Error fetching profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditModalVisible(true);
  };

  const handleSave = async () => {
    // Validate phone number
    if (!/^\d{10}$/.test(editFields.phone)) {
      setPhoneError('Please enter 10 digit valid phone number');
      return;
    } else {
      setPhoneError('');
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/user/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editFields),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');
      await fetchProfile(); // Re-fetch latest user data after save
      setUser(data); // Update AuthContext so changes show everywhere
      setEditModalVisible(false);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2874f0" /></View>;
  }
  if (error) {
    return <View style={styles.center}><Text style={{ color: 'red' }}>{error}</Text></View>;
  }
  if (!user) {
    return <View style={styles.center}><Text>No user data found.</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Personal Information</Text>
      <View style={styles.infoRow}><Text style={styles.infoKey}>Name:</Text><Text style={styles.infoValue}>{user.username || '-'}</Text></View>
      <View style={styles.infoRow}><Text style={styles.infoKey}>Email:</Text><Text style={styles.infoValue}>{user.email || '-'}</Text></View>
      <View style={styles.infoRow}><Text style={styles.infoKey}>Phone:</Text><Text style={styles.infoValue}>{user.phone || '-'}</Text></View>
      <View style={styles.infoRow}><Text style={styles.infoKey}>Address:</Text><Text style={styles.infoValue}>{user.address || '-'}</Text></View>
      <TouchableOpacity style={styles.editButton} onPress={handleEdit}><Text style={styles.editButtonText}>Edit</Text></TouchableOpacity>
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Personal Information</Text>
            <TextInput
              style={styles.input}
              value={editFields.username}
              onChangeText={v => setEditFields(f => ({ ...f, username: v }))}
              placeholder="Username"
            />
            <TextInput
              style={styles.input}
              value={editFields.email}
              onChangeText={v => setEditFields(f => ({ ...f, email: v }))}
              placeholder="Email"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              value={editFields.phone}
              onChangeText={v => {
                // Only allow digits, max 10
                const digits = v.replace(/[^0-9]/g, '').slice(0, 10);
                setEditFields(f => ({ ...f, phone: digits }));
                if (digits.length === 10) {
                  setPhoneError('');
                }
              }}
              placeholder="Phone"
              keyboardType="phone-pad"
            />
            {phoneError ? (
              <Text style={{ color: 'red', marginBottom: 6, fontSize: 13 }}>{phoneError}</Text>
            ) : null}
            <TextInput
              style={styles.input}
              value={editFields.address}
              onChangeText={v => setEditFields(f => ({ ...f, address: v }))}
              placeholder="Address"
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <Button title="Cancel" onPress={() => setEditModalVisible(false)} />
              <View style={{ width: 12 }} />
              <Button title={saving ? 'Saving...' : 'Save'} onPress={handleSave} disabled={saving} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafd', padding: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#2874f0', marginBottom: 18, alignSelf: 'center' },
  infoRow: { flexDirection: 'row', marginBottom: 10 },
  infoKey: { width: 80, fontWeight: 'bold', color: '#555' },
  infoValue: { color: '#444' },
  editButton: { marginTop: 18, alignSelf: 'center', backgroundColor: '#2874f0', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 28 },
  editButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', padding: 24, borderRadius: 12, width: 300 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#2874f0' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 16, marginBottom: 10 },
}); 