import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, ScrollView, TouchableOpacity, Platform, PermissionsAndroid, Alert, Modal } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { API_BASE } from '../lib/api';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { WebView } from 'react-native-webview';

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

export default function OrderDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { orderId } = route.params || {};
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoiceHtml, setInvoiceHtml] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

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

  const handleDownloadInvoice = async () => {
    try {
      // Show loading state
      setLoading(true);
      
      // Check if ReactNativeBlobUtil is available
      if (!ReactNativeBlobUtil || !ReactNativeBlobUtil.fs) {
        // Fallback: Open invoice in browser for download
        const url = `${API_BASE}/api/orders/${orderId}/invoice?format=html`;
        Alert.alert(
          'Download Invoice',
          'Opening invoice in browser for download...',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open',
              onPress: () => {
                // For React Native, we'll use Linking to open the URL
                import('react-native').then(({ Linking }) => {
                  Linking.openURL(url).catch(err => {
                    console.error('Failed to open URL:', err);
                    Alert.alert('Error', 'Failed to open invoice. Please try again.');
                  });
                });
              },
            },
          ]
        );
        return;
      }

      // Request permissions for Android 13+ (API 33+)
      if (Platform.OS === 'android') {
        // Check Android version and request appropriate permissions
        const androidVersion = Platform.Version;
        
        if (androidVersion >= 33) {
          // Android 13+ - request POST_NOTIFICATIONS permission for download notifications
          try {
            const notificationGranted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
              {
                title: 'Notification Permission',
                message: 'App needs notification permission to show download progress',
                buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
              }
            );
            console.log('Notification permission:', notificationGranted);
          } catch (e) {
            console.log('Notification permission not available or already granted');
          }
        } else {
          // Android 12 and below - request WRITE_EXTERNAL_STORAGE
          try {
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
              {
                title: 'Storage Permission',
                message: 'App needs access to storage to download invoice',
                buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
              }
            );
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
              Alert.alert('Permission Denied', 'Storage permission is required to download invoice');
              return;
            }
          } catch (e) {
            console.log('Storage permission not available or already granted');
          }
        }
      }

      // Download HTML invoice (since server returns HTML for now)
      const url = `${API_BASE}/api/orders/${orderId}/invoice?format=html`;

      if (Platform.OS === 'android') {
        const fileName = `invoice-order-${orderId}.html`;
        const dest = `${ReactNativeBlobUtil.fs.dirs.DownloadDir}/${fileName}`;

        const res = await ReactNativeBlobUtil.config({
          addAndroidDownloads: {
            useDownloadManager: true,
            notification: true,
            mime: 'text/html',
            description: 'Downloading invoice',
            mediaScannable: true,
            title: fileName,
            path: dest,
          },
        }).fetch('GET', url, { 
          'Accept': 'text/html'
        });

        const downloadPath = res.path();
        Alert.alert(
          'Success',
          `Invoice downloaded!\nSaved to: ${downloadPath}`,
          [
            { text: 'OK' },
            {
              text: 'Open File',
              onPress: () => {
                try {
                  ReactNativeBlobUtil.android.actionViewIntent(downloadPath, 'text/html');
                } catch (e) {
                  Alert.alert('Open Failed', 'Please open the file from your Downloads app.');
                }
              },
            },
          ]
        );
      } else {
        // iOS: download to Documents dir
        const fileName = `invoice-order-${orderId}.html`;
        const dest = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/${fileName}`;
        const res = await ReactNativeBlobUtil.config({ path: dest, fileCache: true }).fetch('GET', url, { 
          'Accept': 'text/html'
        });
        const downloadPath = res.path();
        Alert.alert('Success', `Invoice saved to: ${downloadPath}`);
      }
      
    } catch (error) {
      console.error('Error downloading invoice:', error);
      Alert.alert('Error', 'Failed to download invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = async () => {
    try {
      setLoading(true);
      
      // Call the invoice API endpoint - explicitly request HTML format
      const response = await fetch(`${API_BASE}/api/orders/${orderId}/invoice?format=html`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'text/html'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate invoice');
      }

      // Check content type to determine how to handle the response
      const contentType = response.headers.get('content-type') || '';
      console.log('Invoice response content-type:', contentType);
      
      let htmlData;
      if (contentType.includes('text/html')) {
        // Server returned HTML
        htmlData = await response.text();
        console.log('Received HTML invoice data');
      } else {
        // Server returned something else (likely PDF), show error
        console.log('Server returned non-HTML content, content-type:', contentType);
        Alert.alert('Error', 'Server returned PDF format. Please use the download option instead.');
        return;
      }
      
      // Wrap the server HTML in a mobile-friendly container
      const mobileHtmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
          <style>
            body { 
              margin: 0; 
              padding: 10px; 
              background: #f5f5f5; 
              font-family: Arial, sans-serif;
              overflow-x: auto;
            }
            .invoice-container {
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            /* Make the invoice responsive */
            .invoice-container * {
              max-width: 100%;
              box-sizing: border-box;
            }
            table {
              font-size: 12px;
            }
            @media (max-width: 768px) {
              .invoice-container {
                margin: 5px;
                padding: 10px;
              }
              table {
                font-size: 10px;
              }
              table th, table td {
                padding: 4px;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            ${htmlData}
          </div>
        </body>
        </html>
      `;
      
      setInvoiceHtml(mobileHtmlContent);
      setShowInvoiceModal(true);
      
    } catch (error) {
      console.error('Error viewing invoice:', error);
      Alert.alert('Error', 'Failed to load invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={styles.label}>Status: <Text style={[styles.value, { color: getStatusColor(order.status) }]}>{order.status?.replace(/_/g, ' ').toUpperCase() || 'PENDING'}</Text></Text>
          <Text style={styles.label}>Total: <Text style={styles.value}>₹{order.total}</Text></Text>
          <Text style={styles.label}>Payment: <Text style={styles.value}>{order.paymentMethod}</Text></Text>
          {/* Show expected delivery unless order is cancelled */}
          {(!order.status || String(order.status).toLowerCase() !== 'cancelled') && !!addDays(order.date, 6) && (
            <Text style={styles.label}>Expected delivery by: <Text style={[styles.value, { color: '#ff9800' }]}>{formatDate(addDays(order.date, 6))}</Text></Text>
          )}
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
            <TouchableOpacity 
              key={item.id || idx} 
              style={styles.itemRow}
              onPress={() => {
                if (item.product?.id) {
                  navigation.navigate('ProductDetail', { 
                    productId: item.product.id,
                    product: item.product 
                  });
                }
              }}
            >
              <Image source={{ uri: getProductImage(item.product) }} style={styles.itemImg} />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.product?.name}</Text>
                <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                <Text style={styles.itemPrice}>₹{item.price}</Text>
              </View>
            </TouchableOpacity>
          )) : <Text style={styles.value}>No items found.</Text>}
        </View>

        {/* Invoice Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Invoice</Text>
          <View style={styles.invoiceButtonsContainer}>
            <TouchableOpacity 
              style={[styles.invoiceButton, styles.invoiceViewButton]} 
              onPress={handleViewInvoice}
              disabled={loading}
            >
              <Text style={styles.invoiceButtonText}>
                {loading ? '⏳ Loading...' : '👁️ View Invoice'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.invoiceButton, styles.invoiceDownloadButton]} 
              onPress={handleDownloadInvoice}
              disabled={loading}
            >
              <Text style={styles.invoiceButtonText}>
                {loading ? '⏳ Generating...' : '📄 Download Invoice'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.invoiceNote}>View invoice on-screen or download as PDF</Text>
        </View>

        {/* Tracking Info hidden per requirement */}
      </ScrollView>

      {/* Invoice Modal */}
      <Modal
        visible={showInvoiceModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowInvoiceModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setShowInvoiceModal(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Invoice - Order #{orderId}</Text>
            <View style={{ width: 40 }} />
          </View>
          {invoiceHtml && (
            <WebView
              source={{ html: invoiceHtml }}
              style={styles.webView}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              originWhitelist={['*']}
              mixedContentMode="compatibility"
              allowsInlineMediaPlayback={true}
            />
          )}
        </View>
      </Modal>
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
  invoiceButton: {
    backgroundColor: '#2874f0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  invoiceButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  invoiceNote: {
    fontSize: 13,
    color: '#888',
    marginTop: 10,
    textAlign: 'center',
  },
  invoiceButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  invoiceViewButton: {
    backgroundColor: '#4CAF50',
    flex: 1,
  },
  invoiceDownloadButton: {
    backgroundColor: '#2874f0',
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#6B3F1D',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  webView: {
    flex: 1,
  },
}); 