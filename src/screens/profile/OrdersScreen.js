import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image, ScrollView, Alert, Modal, TextInput, Platform } from 'react-native';
import { API_BASE } from '../../lib/api';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString();
}

function addDays(dateStr, days) {
  try {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d;
  } catch {
    return null;
  }
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
    case 'delivered': return '#4caf50';
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
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [orderIdToCancel, setOrderIdToCancel] = useState(null);
  
  // Return functionality states
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returnDescription, setReturnDescription] = useState('');
  const [orderIdToReturn, setOrderIdToReturn] = useState(null);
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnImages, setReturnImages] = useState([]);


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

  const handleCancelOrder = (orderId) => {
    setOrderIdToCancel(orderId);
    setCancelReason('');
    setCancelModalVisible(true);
  };

  const submitCancelOrder = async () => {
    const orderId = orderIdToCancel;
    if (!orderId) return;
    setCancelModalVisible(false);
    setCancelling((prev) => ({ ...prev, [orderId]: true }));
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/cancel`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason || 'No reason provided' }),
      });
      // Even if API doesn't return JSON, attempt to parse safely
      let data = null;
      try { data = await res.json(); } catch {}
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: 'cancelled' } : o));
      Alert.alert('Order Cancelled', 'Order cancelled successfully.');
    } catch (e) {
      Alert.alert('Error', 'Failed to cancel order.');
    } finally {
      setCancelling((prev) => ({ ...prev, [orderId]: false }));
      setOrderIdToCancel(null);
      setCancelReason('');
    }
  };

  // Return functionality
  const handleReturnOrder = (orderId) => {
    setOrderIdToReturn(orderId);
    setReturnReason('');
    setReturnDescription('');
    setReturnModalVisible(true);
  };

  const submitReturnRequest = async () => {
    const orderId = orderIdToReturn;
    if (!orderId) return;
    
    if (!returnReason.trim()) {
      Alert.alert('Reason Required', 'Please select a reason for return.');
      return;
    }
    
    setReturnModalVisible(false);
    setSubmittingReturn(true);
    
    try {
      // Prepare return data
      const returnData = {
        orderId: orderId,
        reason: returnReason,
        description: returnDescription,
        requestType: 'return',
        images: returnImages.length > 0 ? returnImages.map(img => img.uri) : []
      };

      console.log('Submitting return request:', returnData);

      const res = await fetch(`${API_BASE}/api/returns`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(returnData),
      });
      
      if (res.ok) {
        const result = await res.json();
        console.log('Return request successful:', result);
        Alert.alert('Return Request Submitted', 'Your return request has been submitted successfully. We will review it and get back to you soon.');
        // Update order status to show return requested
        setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: 'return_requested' } : o));
      } else {
        let errorMessage = 'Failed to submit return request';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON, try to get text
          try {
            errorMessage = await res.text();
          } catch (textError) {
            console.log('Could not parse error response:', textError);
          }
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Return submission error:', error);
      Alert.alert('Error', error.message || 'Failed to submit return request. Please try again.');
    } finally {
      setSubmittingReturn(false);
      setOrderIdToReturn(null);
      setReturnReason('');
      setReturnDescription('');
      setReturnImages([]);
    }
  };

  const isOrderDelivered = (order) => {
    return ['delivered', 'completed'].includes((order.status || '').toLowerCase());
  };

  const isOrderReturnable = (order) => {
    return isOrderDelivered(order) && !['return_requested', 'returned', 'cancelled'].includes((order.status || '').toLowerCase());
  };

  const pickImage = async () => {
    try {
      // Simple image picker without external packages
      Alert.alert(
        'Select Image',
        'Choose an option',
        [
          {
            text: 'Camera Roll',
            onPress: () => {
              // For now, we'll simulate image selection
              // In a real app, you'd use react-native-image-picker or similar
              const mockImage = {
                uri: 'https://placehold.co/300x200?text=Return+Image',
                type: 'image/jpeg',
                name: 'return_image.jpg',
              };
              setReturnImages(prev => [...prev, mockImage]);
              Alert.alert('Info', 'Image picker would open here. For now, using placeholder image.');
            }
          },
          {
            text: 'Take Photo',
            onPress: () => {
              // For now, we'll simulate taking a photo
              const mockImage = {
                uri: 'https://placehold.co/300x200?text=Photo+Image',
                type: 'image/jpeg',
                name: 'photo_image.jpg',
              };
              setReturnImages(prev => [...prev, mockImage]);
              Alert.alert('Info', 'Camera would open here. For now, using placeholder image.');
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      console.log('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
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
    <>
      <FlatList
        style={styles.list}
        data={orders}
        keyExtractor={item => item.id?.toString() || Math.random().toString()}
        renderItem={({ item }) => {
          const track = tracking[item.id];
          const isCancellable = !['shipped', 'completed', 'cancelled', 'delivered', 'return_requested'].includes((item.status || '').toLowerCase());
          const canReturn = isOrderReturnable(item);
          
          return (
            <View style={styles.orderCard}>
              {/* Status bar */}
              <View style={[styles.statusBar, { backgroundColor: getStatusColor(item.status) }]} />
              <View style={styles.orderHeader}>
                <Text style={styles.orderNumber}>Order ID: <Text style={{color:'#2874f0'}}>{item.id || item.orderNumber}</Text></Text>
                <Text style={styles.orderStatus}>{item.status ? item.status.replace(/_/g, ' ').toUpperCase() : '-'}</Text>
              </View>
              <Text style={styles.orderDate}>Ordered on: {formatDate(item.date)}</Text>
              {/* Show expected delivery unless order is cancelled */}
              {(!item.status || String(item.status).toLowerCase() !== 'cancelled') && !!addDays(item.date, 6) && (
                <Text style={styles.expectedDelivery}>Expected delivery by: {formatDate(addDays(item.date, 6))}</Text>
              )}
              <OrderProducts items={item.items} />
              <Text style={styles.orderTotal}>Total: ₹{item.total || '-'}</Text>
              
              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                {isCancellable && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.cancelBtn, cancelling[item.id] && { opacity: 0.6 }]}
                    onPress={() => handleCancelOrder(item.id)}
                    disabled={cancelling[item.id]}
                  >
                    <Icon name="close-circle" size={16} color="#fff" style={{ marginRight: 5 }} />
                    <Text style={styles.actionBtnText}>{cancelling[item.id] ? 'Cancelling...' : 'Cancel Order'}</Text>
                  </TouchableOpacity>
                )}
                
                {canReturn && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.returnBtn, submittingReturn && { opacity: 0.6 }]}
                    onPress={() => handleReturnOrder(item.id)}
                    disabled={submittingReturn}
                  >
                    <Icon name="undo-variant" size={16} color="#fff" style={{ marginRight: 5 }} />
                    <Text style={styles.actionBtnText}>{submittingReturn ? 'Submitting...' : 'Return Product'}</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={[styles.actionBtn, styles.viewDetailsBtn]}
                  onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
                >
                  <Icon name="eye" size={16} color="#fff" style={{ marginRight: 5 }} />
                  <Text style={styles.actionBtnText}>View Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
      
      {/* Cancel reason modal */}
      {cancelModalVisible && (
        <Modal
          visible={cancelModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setCancelModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Cancel Order</Text>
              <Text style={styles.modalSubtitle}>Please share a reason for cancellation (optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Reason for cancellation"
                value={cancelReason}
                onChangeText={setCancelReason}
                multiline
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#9e9e9e' }]} onPress={() => setCancelModalVisible(false)}>
                  <Text style={styles.modalBtnText}>Dismiss</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#f44336' }]} onPress={submitCancelOrder}>
                  <Text style={styles.modalBtnText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Return request modal */}
      {returnModalVisible && (
        <Modal
          visible={returnModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setReturnModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Return Product</Text>
              <Text style={styles.modalSubtitle}>Please select a reason for return and provide additional details</Text>
              
              {/* Return Reason Selection */}
              <View style={styles.reasonSection}>
                <Text style={styles.reasonLabel}>Reason for Return:</Text>
                <View style={styles.reasonOptions}>
                  {[
                    'Product damaged',
                    'Wrong product received',
                    'Product not as described',
                    'Size/color not as expected',
                    'Changed my mind',
                    'Other'
                  ].map((reason) => (
                    <TouchableOpacity
                      key={reason}
                      style={[
                        styles.reasonOption,
                        returnReason === reason && styles.selectedReasonOption
                      ]}
                      onPress={() => setReturnReason(reason)}
                    >
                      <Text style={[
                        styles.reasonOptionText,
                        returnReason === reason && styles.selectedReasonOptionText
                      ]}>
                        {reason}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              {/* Additional Description */}
              <View style={styles.descriptionSection}>
                <Text style={styles.descriptionLabel}>Additional Details (optional):</Text>
                <TextInput
                  style={styles.descriptionInput}
                  placeholder="Please provide any additional details about your return..."
                  value={returnDescription}
                  onChangeText={setReturnDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalBtn, { backgroundColor: '#9e9e9e' }]} 
                  onPress={() => setReturnModalVisible(false)}
                >
                  <Text style={styles.modalBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalBtn, { backgroundColor: '#ff9800' }]} 
                  onPress={submitReturnRequest}
                  disabled={!returnReason.trim()}
                >
                  <Text style={styles.modalBtnText}>Submit Return</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
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
  expectedDelivery: { fontSize: 13, color: '#ff9800', marginTop: 2 },
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
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 16, width: '100%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  modalSubtitle: { fontSize: 13, color: '#666', marginTop: 6 },
  modalInput: { marginTop: 10, minHeight: 70, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  modalBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, marginLeft: 10 },
  modalBtnText: { color: '#fff', fontWeight: 'bold' },
  actionButtons: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginTop: 10, 
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionBtnText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 13,
    textAlign: 'center',
  },
  cancelBtn: { backgroundColor: '#f44336' },
  returnBtn: { backgroundColor: '#ff9800' },
  viewDetailsBtn: { backgroundColor: '#2874f0' },
  reasonSection: { marginTop: 15 },
  reasonLabel: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  reasonOptions: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between',
    gap: 8,
  },
  reasonOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
    minWidth: '48%',
    alignItems: 'center',
  },
  selectedReasonOption: {
    backgroundColor: '#2874f0',
    borderColor: '#2874f0',
  },
  reasonOptionText: { fontSize: 12, color: '#333', textAlign: 'center' },
  selectedReasonOptionText: { color: '#fff', fontWeight: 'bold' },
  descriptionSection: { marginTop: 15 },
  descriptionLabel: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  descriptionInput: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#333',
    backgroundColor: '#f8f9fa',
  },

}); 