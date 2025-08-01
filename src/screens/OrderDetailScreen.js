import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { API_BASE } from '../lib/api';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString();
}

function getProductImage(product) {
  return (
    product?.imageUrl ||
    product?.image_url ||
    (product?.images && Array.isArray(product.images) && product.images[0]) ||
    'https://placehold.co/100x100?text=No+Image'
  );
}

export default function OrderDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { orderId } = route.params || {};
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    fetch(`${API_BASE}/api/orders/${orderId}`, { credentials: 'include' })
      .then(res => res.json())
      .then(async data => {
        // Fallback: If shippingDetails is missing/incomplete and addressId exists, fetch address
        let shipping = data.shippingDetails;
        if (typeof shipping === 'string') {
          try { shipping = JSON.parse(shipping); } catch { shipping = {}; }
        }
        const isShippingEmpty = !shipping || (!shipping.address && !shipping.name && !shipping.city && !shipping.state && !shipping.zipCode);
        if (isShippingEmpty && data.addressId) {
          try {
            const addrRes = await fetch(`${API_BASE}/api/addresses/${data.addressId}`, { credentials: 'include' });
            if (addrRes.ok) {
              const addr = await addrRes.json();
              data.shippingDetails = {
                name: addr.fullName || addr.addressName || '',
                phone: addr.phone || '',
                address: addr.address || '',
                city: addr.city || '',
                state: addr.state || '',
                zipCode: addr.pincode || '',
                country: addr.country || 'India',
              };
            }
          } catch (e) {
            // ignore, fallback to whatever is present
          }
        }
        setOrder(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load order details');
        setLoading(false);
      });
  }, [orderId]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2874f0" /></View>;
  }
  if (error || !order) {
    return <View style={styles.center}><Text style={{ color: 'red' }}>{error || 'Order not found.'}</Text></View>;
  }

  // Parse shipping details if string
  let shipping = order.shippingDetails;
  if (typeof shipping === 'string') {
    try { shipping = JSON.parse(shipping); } catch { shipping = {}; }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
          <Text style={styles.headerBackText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView style={styles.bg} contentContainerStyle={{ padding: 18 }}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <Text style={styles.label}>Order ID: <Text style={styles.value}>{order.id}</Text></Text>
          <Text style={styles.label}>Date: <Text style={styles.value}>{formatDate(order.date)}</Text></Text>
          <Text style={styles.label}>Status: <Text style={[styles.value, { color: '#2874f0' }]}>{order.status?.toUpperCase()}</Text></Text>
          <Text style={styles.label}>Total: <Text style={styles.value}>₹{order.total}</Text></Text>
          <Text style={styles.label}>Payment: <Text style={styles.value}>{order.paymentMethod}</Text></Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Shipping Details</Text>
          <Text style={styles.label}>Name: <Text style={styles.value}>{shipping?.name || '-'}</Text></Text>
          <Text style={styles.label}>Phone: <Text style={styles.value}>{shipping?.phone || '-'}</Text></Text>
          <Text style={styles.label}>Address: <Text style={styles.value}>{shipping?.address || '-'}</Text></Text>
          <Text style={styles.label}>City: <Text style={styles.value}>{shipping?.city || '-'}</Text></Text>
          <Text style={styles.label}>State: <Text style={styles.value}>{shipping?.state || '-'}</Text></Text>
          <Text style={styles.label}>Pincode: <Text style={styles.value}>{shipping?.zipCode || '-'}</Text></Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {order.items && order.items.length > 0 ? order.items.map((item, idx) => (
            <View key={item.id || idx} style={styles.itemRow}>
              <Image source={{ uri: getProductImage(item.product) }} style={styles.itemImg} />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.product?.name}</Text>
                <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                <Text style={styles.itemPrice}>₹{item.price}</Text>
              </View>
            </View>
          )) : <Text style={styles.value}>No items found.</Text>}
        </View>
        {order.trackingId && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Tracking Info</Text>
            <Text style={styles.label}>Courier: <Text style={styles.value}>{order.courierName || '-'}</Text></Text>
            <Text style={styles.label}>Tracking ID: <Text style={styles.value}>{order.trackingId}</Text></Text>
            {order.trackingUrl ? (
              <TouchableOpacity onPress={() => navigation.navigate('WebViewScreen', { url: order.trackingUrl })}>
                <Text style={[styles.value, { color: '#2874f0', textDecorationLine: 'underline' }]}>Track Package</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#6B3F1D', paddingTop: 36, paddingBottom: 16, paddingHorizontal: 16, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, elevation: 4 },
  headerBackBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerBackText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center', flex: 1 },
  bg: { flex: 1, backgroundColor: '#f5f7fa' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 18, elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#6B3F1D', marginBottom: 10 },
  label: { fontSize: 15, color: '#555', marginBottom: 2 },
  value: { fontWeight: 'bold', color: '#222' },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, backgroundColor: '#f8fafd', borderRadius: 10, padding: 8 },
  itemImg: { width: 54, height: 54, borderRadius: 8, backgroundColor: '#eee', marginRight: 12 },
  itemName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  itemQty: { fontSize: 13, color: '#888', marginTop: 2 },
  itemPrice: { fontSize: 14, color: '#2874f0', fontWeight: 'bold', marginTop: 2 },
}); 