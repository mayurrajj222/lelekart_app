import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { API_BASE } from '../../lib/api';
import { useNavigation } from '@react-navigation/native';

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

function StatusTimeline({ timeline }) {
  if (!timeline || !Array.isArray(timeline) || timeline.length === 0) return null;
  return (
    <View style={styles.timelineContainer}>
      {timeline.map((step, idx) => (
        <View key={idx} style={styles.timelineStep}>
          <View style={[styles.timelineDot, idx === timeline.length - 1 && styles.timelineDotActive]} />
          <View style={styles.timelineContent}>
            <Text style={styles.timelineStatus}>{step.status.replace(/_/g, ' ').toUpperCase()}</Text>
            <Text style={styles.timelineDesc}>{step.description}</Text>
            <Text style={styles.timelineDate}>{formatDate(step.timestamp)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function OrderProducts({ items }) {
  if (!items || !Array.isArray(items) || items.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productsScroll}>
      {items.map((orderItem, idx) => (
        <View key={idx} style={styles.productThumbBox}>
          <Image
            source={{ uri: getProductImage(orderItem.product) }}
            style={styles.productThumb}
            resizeMode="cover"
          />
          <Text style={styles.productName} numberOfLines={1}>{orderItem.product?.name || 'Product'}</Text>
          <Text style={styles.productQty}>Qty: {orderItem.quantity}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function getStatusColor(status) {
  switch ((status || '').toLowerCase()) {
    case 'completed': return '#4caf50';
    case 'processing': return '#2196f3';
    case 'shipped': return '#ff9800';
    case 'cancelled': return '#f44336';
    case 'pending': return '#9e9e9e';
    default: return '#2874f0';
  }
}

export default function OrdersScreen() {
  const navigation = useNavigation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tracking, setTracking] = useState({}); // { [orderId]: trackingData }
  const [expanded, setExpanded] = useState(null); // orderId for expanded tracking
  const [cancelling, setCancelling] = useState({}); // { [orderId]: boolean }

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/orders`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch orders');
        let data = await res.json();
        // Sort by date descending (latest first)
        data = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setOrders(data);
      } catch (err) {
        setError(err.message || 'Error fetching orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const fetchTracking = async (orderId) => {
    if (tracking[orderId]) {
      setExpanded(expanded === orderId ? null : orderId);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/tracking`, { credentials: 'include' });
      if (!res.ok) throw new Error('No tracking info');
      const data = await res.json();
      setTracking(prev => ({ ...prev, [orderId]: data }));
      setExpanded(orderId);
    } catch {
      setTracking(prev => ({ ...prev, [orderId]: null }));
      setExpanded(orderId);
    }
  };

  const handleCancelOrder = async (orderId) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            setCancelling((prev) => ({ ...prev, [orderId]: true }));
            try {
              const res = await fetch(`${API_BASE}/api/orders/${orderId}/cancel`, {
                method: 'POST',
                credentials: 'include',
              });
              const data = await res.json();
              setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: 'cancelled' } : o));
              Alert.alert('Order Cancelled', 'Order cancelled successfully. Check your mail.');
            } catch (e) {
              Alert.alert('Error', 'Failed to cancel order.');
            } finally {
              setCancelling((prev) => ({ ...prev, [orderId]: false }));
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2874f0" /></View>;
  }
  if (error) {
    return <View style={styles.center}><Text style={{ color: 'red' }}>{error}</Text></View>;
  }
  if (!orders.length) {
    return <View style={styles.center}><Text>No orders found.</Text></View>;
  }

  return (
    <FlatList
      style={styles.list}
      data={orders}
      keyExtractor={item => item.id?.toString() || Math.random().toString()}
      renderItem={({ item }) => {
        const track = tracking[item.id];
        const isCancellable = !['shipped', 'completed', 'cancelled'].includes((item.status || '').toLowerCase());
        return (
          <View style={styles.orderCard}>
            {/* Status bar */}
            <View style={[styles.statusBar, { backgroundColor: getStatusColor(item.status) }]} />
            <View style={styles.orderHeader}>
              <Text style={styles.orderNumber}>Order ID: <Text style={{color:'#2874f0'}}>{item.id || item.orderNumber}</Text></Text>
              <Text style={styles.orderStatus}>{item.status ? item.status.replace(/_/g, ' ').toUpperCase() : '-'}</Text>
            </View>
            <Text style={styles.orderDate}>Ordered on: {formatDate(item.date)}</Text>
            <OrderProducts items={item.items} />
            <Text style={styles.orderTotal}>Total: ₹{item.total || '-'}</Text>
            {isCancellable && (
              <TouchableOpacity
                style={[styles.cancelBtn, cancelling[item.id] && { opacity: 0.6 }]}
                onPress={() => handleCancelOrder(item.id)}
                disabled={cancelling[item.id]}
              >
                <Text style={styles.cancelBtnText}>{cancelling[item.id] ? 'Cancelling...' : 'Cancel Order'}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={{
                marginTop: 10,
                backgroundColor: '#2874f0',
                borderRadius: 8,
                paddingVertical: 7,
                alignItems: 'center',
                shadowColor: '#2874f0',
                shadowOpacity: 0.15,
                shadowRadius: 6,
                elevation: 2,
              }}
              onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>View Details</Text>
            </TouchableOpacity>
            {track && track.status && (
              <Text style={styles.trackingStatus}>Tracking Status: <Text style={{color:'#388e3c'}}>{track.status.replace(/_/g, ' ').toUpperCase()}</Text></Text>
            )}
            {track && track.courier && (
              <Text style={styles.trackingCourier}>Courier: {track.courier} {track.trackingId ? `| Tracking #: ${track.trackingId}` : ''}</Text>
            )}
            {track && track.estimatedDelivery && (
              <Text style={styles.estimatedDelivery}>Est. Delivery: {formatDate(track.estimatedDelivery)}</Text>
            )}
            <TouchableOpacity style={styles.trackBtn} onPress={() => fetchTracking(item.id)}>
              <Text style={styles.trackBtnText}>{expanded === item.id ? 'Hide Tracking' : 'View Tracking'}</Text>
            </TouchableOpacity>
            {expanded === item.id && (
              <View style={styles.trackingDetailsBox}>
                {track && track.statusTimeline ? (
                  <StatusTimeline timeline={track.statusTimeline} />
                ) : (
                  <Text style={styles.noTracking}>No tracking details available.</Text>
                )}
                {track && track.courierUrl && (
                  <TouchableOpacity onPress={() => {}}>
                    <Text style={styles.courierLink}>Track on Courier Website</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { flex: 1, backgroundColor: '#f1f3f6' },
  orderCard: { backgroundColor: '#fff', margin: 12, padding: 18, borderRadius: 16, elevation: 4, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 12, marginBottom: 18, overflow: 'hidden' },
  statusBar: { height: 5, borderTopLeftRadius: 16, borderTopRightRadius: 16, marginHorizontal: -18, marginTop: -18, marginBottom: 8, backgroundColor: '#6B3F1D' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderNumber: { fontSize: 16, fontWeight: 'bold', color: '#6B3F1D' },
  orderStatus: { fontSize: 14, fontWeight: 'bold', color: '#6B3F1D', backgroundColor: '#e3f0fd', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  orderDate: { fontSize: 13, color: '#888', marginTop: 2 },
  orderTotal: { fontSize: 15, color: '#222', marginTop: 4, fontWeight: 'bold' },
  trackingStatus: { fontSize: 14, color: '#388e3c', marginTop: 6 },
  trackingCourier: { fontSize: 13, color: '#555', marginTop: 2 },
  estimatedDelivery: { fontSize: 13, color: '#ff9800', marginTop: 2 },
  trackBtn: { marginTop: 10, backgroundColor: '#6B3F1D', borderRadius: 8, paddingVertical: 7, alignItems: 'center' },
  trackBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  trackingDetailsBox: { marginTop: 12, backgroundColor: '#f5f7fa', borderRadius: 8, padding: 10 },
  noTracking: { color: '#888', fontStyle: 'italic', textAlign: 'center' },
  courierLink: { color: '#6B3F1D', textAlign: 'center', marginTop: 8, textDecorationLine: 'underline' },
  timelineContainer: { marginTop: 8, marginBottom: 4 },
  timelineStep: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#b0bec5', marginTop: 6, marginRight: 10 },
  timelineDotActive: { backgroundColor: '#6B3F1D' },
  timelineContent: { flex: 1 },
  timelineStatus: { fontWeight: 'bold', color: '#6B3F1D', fontSize: 13 },
  timelineDesc: { color: '#444', fontSize: 12 },
  timelineDate: { color: '#888', fontSize: 11, marginTop: 2 },
  productsScroll: { marginVertical: 10 },
  productThumbBox: { width: 80, alignItems: 'center', marginRight: 12, backgroundColor: '#f8fafd', borderRadius: 10, padding: 6, elevation: 1 },
  productThumb: { width: 54, height: 54, borderRadius: 8, backgroundColor: '#eee' },
  productName: { fontSize: 12, color: '#333', marginTop: 4, maxWidth: 70, textAlign: 'center' },
  productQty: { fontSize: 11, color: '#888', marginTop: 2 },
  cancelBtn: { marginTop: 10, backgroundColor: '#f44336', borderRadius: 8, paddingVertical: 7, alignItems: 'center' },
  cancelBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
}); 