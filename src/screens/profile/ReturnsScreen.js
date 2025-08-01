import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { API_BASE } from '../../lib/api';

export default function ReturnsScreen() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReturns = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/returns`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch returns');
        const data = await res.json();
        setReturns(data);
      } catch (err) {
        setError(err.message || 'Error fetching returns');
      } finally {
        setLoading(false);
      }
    };
    fetchReturns();
  }, []);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2874f0" /></View>;
  }
  if (error) {
    return <View style={styles.center}><Text style={{ color: 'red' }}>{error}</Text></View>;
  }
  if (!returns.length) {
    return <View style={styles.center}><Text>No returns found.</Text></View>;
  }

  return (
    <FlatList
      style={styles.list}
      data={returns}
      keyExtractor={item => item.id?.toString() || Math.random().toString()}
      renderItem={({ item }) => (
        <View style={styles.returnCard}>
          <Text style={styles.returnId}>Return #{item.id}</Text>
          <Text style={styles.orderId}>Order ID: {item.orderId}</Text>
          <Text style={styles.returnDate}>Date: {item.date ? new Date(item.date).toLocaleDateString() : '-'}</Text>
          <Text style={styles.returnStatus}>Status: {item.status || '-'}</Text>
          <Text style={styles.returnReason}>Reason: {item.reason || '-'}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { flex: 1, backgroundColor: '#f8fafd' },
  returnCard: { backgroundColor: '#fff', margin: 12, padding: 18, borderRadius: 10, elevation: 2 },
  returnId: { fontSize: 18, fontWeight: 'bold', color: '#2874f0' },
  orderId: { fontSize: 15, color: '#444', marginTop: 4 },
  returnDate: { fontSize: 14, color: '#888', marginTop: 4 },
  returnStatus: { fontSize: 15, color: '#444', marginTop: 4 },
  returnReason: { fontSize: 15, color: '#888', marginTop: 4 },
}); 