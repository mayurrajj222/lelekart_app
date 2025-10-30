import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { API_BASE } from '../../lib/api';
import { AuthContext } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function WishlistScreen() {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const { addToCart, cartItems } = useCart();
  const { wishlistItems, removeFromWishlist, loading, fetchWishlist } = useWishlist();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [removingItem, setRemovingItem] = useState(null);
  const [productStockInfo, setProductStockInfo] = useState({});
  const [notifiedItems, setNotifiedItems] = useState({});
  const [notificationLoading, setNotificationLoading] = useState({});
  const [addingToCart, setAddingToCart] = useState({});

  const onRefresh = () => {
    fetchWishlist();
    // Also refresh stock information
    if (wishlistItems.length > 0) {
      fetchProductStockInfo();
    }
    setRefreshing(false);
  };

  // Fetch latest stock information for wishlist items
  const fetchProductStockInfo = async () => {
    try {
      console.log('Fetching stock info for', wishlistItems.length, 'items');
      const stockInfo = {};
      for (const item of wishlistItems) {
        const productId = item.productId || item.product?.id;
        if (productId) {
          try {
            console.log('Fetching stock for product:', productId);
            const response = await fetch(`${API_BASE}/api/products/${productId}`);
            if (response.ok) {
              const productData = await response.json();
              stockInfo[productId] = {
                stock: productData.stock || 0,
                price: productData.price || 0,
                mrp: productData.mrp || 0
              };
              console.log('Stock info for product', productId, ':', stockInfo[productId]);
            } else {
              console.log('Failed to fetch product', productId, 'status:', response.status);
            }
          } catch (error) {
            console.log(`Failed to fetch stock info for product ${productId}:`, error);
          }
        }
      }
      console.log('Final stock info:', stockInfo);
      setProductStockInfo(stockInfo);
    } catch (error) {
      console.log('Failed to fetch stock information:', error);
    }
  };

  const confirmRemove = (item) => {
    const name = item.product?.name || item.name || 'this product';
    const productId = Number(item.productId || item.product?.id);
    console.log('Confirm remove:', productId, item);
    Alert.alert(
      'Remove from Wishlist',
      `Are you sure you want to remove "${name}" from your wishlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeFromWishlist(productId) }
      ]
    );
  };

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setError('Please login to view your wishlist');
      setLoading(false);
    }
  }, [user]);

  // Reset addingToCart state when cartItems changes
  useEffect(() => {
    console.log('Cart items changed, resetting addingToCart state');
    setAddingToCart({});
  }, [cartItems]);

  // Fetch stock information when wishlist items change
  useEffect(() => {
    if (wishlistItems.length > 0) {
      fetchProductStockInfo();
    }
  }, [wishlistItems]);

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
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchWishlist()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2874f0']}
            tintColor="#2874f0"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Wishlist</Text>
          <View style={styles.headerInfo}>
            <Text style={styles.subtitle}>
              {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
            </Text>
            {Object.keys(notifiedItems).length > 0 && (
              <View style={styles.notificationBadge}>
                <Icon name="bell" size={14} color="#ff9800" />
                <Text style={styles.notificationCount}>
                  {Object.keys(notifiedItems).length} notification{Object.keys(notifiedItems).length !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Out of Stock Summary */}
        {(() => {
          const outOfStockCount = wishlistItems.filter(item => {
            const productId = item.productId || item.product?.id;
            const latestStockInfo = productStockInfo[productId];
            const currentStock = latestStockInfo?.stock ?? item.product?.stock ?? 0;
            return currentStock <= 0;
          }).length;
          
          if (outOfStockCount > 0) {
            return (
              <View style={styles.outOfStockSummary}>
                <Icon name="alert-circle" size={20} color="#f44336" />
                <Text style={styles.outOfStockSummaryText}>
                  {outOfStockCount} item{outOfStockCount !== 1 ? 's' : ''} out of stock
                </Text>
                <Text style={styles.outOfStockSummarySubtext}>
                  Set notifications to get alerts when they're back in stock
                </Text>
              </View>
            );
          }
          return null;
        })()}

        {/* Wishlist Items */}
        {wishlistItems.length > 0 ? (
          <View style={styles.wishlistContainer}>
            {wishlistItems.map((item, index) => {
              // Defensive: fallback to product.images if imageUrl is missing
              let imageUrl = item.product?.imageUrl;
              if (!imageUrl && item.product?.images) {
                try {
                  const imgs = JSON.parse(item.product.images);
                  if (Array.isArray(imgs) && imgs.length > 0) imageUrl = imgs[0];
                } catch {}
              }
              imageUrl = imageUrl || 'https://via.placeholder.com/100';
              
              // Get latest stock information
              const productId = item.productId || item.product?.id;
              const latestStockInfo = productStockInfo[productId];
              const currentStock = latestStockInfo?.stock ?? item.product?.stock ?? 0;
              const currentPrice = latestStockInfo?.price ?? item.product?.price ?? 0;
              const currentMrp = latestStockInfo?.mrp ?? item.product?.mrp ?? 0;
              const inStock = currentStock > 0;
              
              // Check if the item is already in the cart
              const inCart = cartItems.some(cartItem => {
                // Handle different cart item structures
                const cartProductId = cartItem.productId || cartItem.product?.id || cartItem.id;
                const match = cartProductId === productId || String(cartProductId) === String(productId);
                return match;
              }) || addingToCart[productId];

              console.log('Wishlist item info:', {
                productId,
                itemStock: item.product?.stock,
                latestStock: latestStockInfo?.stock,
                currentStock,
                inStock,
                inCart,
                cartItemsCount: cartItems.length,
                cartProductIds: cartItems.map(ci => ci.productId || ci.product?.id || ci.id)
              });
              return (
                <View key={item.id || index} style={[styles.wishlistItem, !inStock && styles.outOfStockItem]}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('ProductDetail', { product: item.product })}
                    style={styles.productTouchable}
                  >
                    <Image
                      source={{ uri: imageUrl }}
                      style={[styles.productImage, !inStock && styles.outOfStockImage]}
                      resizeMode="cover"
                    />
                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={2}>
                        {item.product?.name}
                      </Text>
                      <View style={styles.priceContainer}>
                        <Text style={styles.currentPrice}>₹{currentPrice}</Text>
                        {currentMrp && currentMrp > currentPrice && (
                          <Text style={styles.originalPrice}>₹{currentMrp}</Text>
                        )}
                      </View>
                      <View style={styles.stockInfo}>
                        {inStock ? (
                          <View style={styles.inStockContainer}>
                            <Icon name="check-circle" size={16} color="#4caf50" />
                            <Text style={styles.inStockText}>
                              In Stock ({currentStock} available)
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.outOfStockContainer}>
                            <Icon name="alert-circle" size={16} color="#f44336" />
                            <Text style={styles.outOfStockText}>Out of Stock</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                  <View style={styles.actionButtons}>
                    {inStock && (
                      <TouchableOpacity
                        style={[styles.actionButton, inCart ? styles.goToCartButton : styles.addToCartButton]}
                        onPress={() => {
                          if (inCart) {
                            // Navigate to cart if item is already there
                            navigation.navigate('MainTabs', { screen: 'Cart' });
                          } else {
                            // Add to cart if not already there
                            setAddingToCart(prev => ({ ...prev, [productId]: true }));
                            const updatedProduct = {
                              ...item.product,
                              stock: currentStock,
                              price: currentPrice,
                              mrp: currentMrp
                            };
                            addToCart(updatedProduct, 1)
                              .then(() => {
                                // Small delay to ensure cart state is updated
                                setTimeout(() => {
                                  setAddingToCart(prev => ({ ...prev, [productId]: false }));
                                }, 100);
                                Alert.alert('Success', 'Item added to cart');
                              })
                              .catch((err) => {
                                setAddingToCart(prev => ({ ...prev, [productId]: false }));
                                Alert.alert('Error', err?.message || 'Failed to add item to cart');
                              });
                          }
                        }}
                        disabled={!inStock || addingToCart[productId]}
                      >
                        <Icon name={inCart ? "cart-outline" : (addingToCart[productId] ? "loading" : "cart-plus")} size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>
                          {inCart ? 'Go to Cart' : (addingToCart[productId] ? 'Adding...' : 'Add to Cart')}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {!inStock && (
                      <TouchableOpacity
                        style={[
                          styles.actionButton, 
                          notifiedItems[item.productId || item.product?.id] 
                            ? styles.notifiedButton 
                            : styles.notifyButton
                        ]}
                        onPress={() => {
                          // Check if user is logged in
                          if (!user) {
                            Alert.alert(
                              'Login Required',
                              'Please login to get notified when products are back in stock.',
                              [
                                { text: 'Cancel', style: 'cancel' },
                                { 
                                  text: 'Login', 
                                  onPress: () => {
                                    // Use setTimeout to ensure alert is dismissed before navigation
                                    setTimeout(() => {
                                      navigation.navigate('Account');
                                    }, 100);
                                  }
                                }
                              ]
                            );
                            return;
                          }
                          
                          const productId = item.productId || item.product?.id;
                          const productName = item.product?.name || 'this product';
                          
                          if (notifiedItems[productId]) {
                            // Remove notification
                            setNotificationLoading(prev => ({ ...prev, [productId]: true }));
                            setNotifiedItems(prev => {
                              const newState = { ...prev };
                              delete newState[productId];
                              return newState;
                            });
                            Alert.alert(
                              'Notification Removed', 
                              `You will no longer be notified when "${productName}" comes back in stock.`,
                              [{ text: 'OK' }]
                            );
                            setNotificationLoading(prev => ({ ...prev, [productId]: false }));
                          } else {
                            // Add notification
                            setNotificationLoading(prev => ({ ...prev, [productId]: true }));
                            setNotifiedItems(prev => ({
                              ...prev,
                              [productId]: true
                            }));
                            Alert.alert(
                              'Notification Set!', 
                              `You will be notified when "${productName}" comes back in stock. We'll send you a push notification.`,
                              [{ text: 'Great!' }]
                            );
                            setNotificationLoading(prev => ({ ...prev, [productId]: false }));
                          }
                        }}
                        disabled={notificationLoading[item.productId || item.product?.id]}
                      >
                        {notificationLoading[item.productId || item.product?.id] ? (
                          <ActivityIndicator size="small" color={notifiedItems[item.productId || item.product?.id] ? "#fff" : "#ff9800"} />
                        ) : (
                          <>
                            <Icon 
                              name={notifiedItems[item.productId || item.product?.id] ? "bell" : "bell-outline"} 
                              size={20} 
                              color={notifiedItems[item.productId || item.product?.id] ? "#fff" : "#ff9800"} 
                            />
                            <Text style={[
                              styles.actionButtonText,
                              notifiedItems[item.productId || item.product?.id] 
                                ? styles.notifiedButtonText 
                                : styles.notifyButtonText
                            ]}>
                              {notifiedItems[item.productId || item.product?.id] ? 'Notified' : 'Notify Me'}
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                    
                    {/* Remove button - always show but adjust style based on stock */}
                    <TouchableOpacity
                      style={[
                        styles.actionButton, 
                        styles.removeButton,
                        !inStock && styles.removeButtonOutOfStock
                      ]}
                      onPress={() => confirmRemove(item)}
                      disabled={removingItem === (item.productId || item.product?.id)}
                    >
                      {removingItem === (item.productId || item.product?.id) ? (
                        <ActivityIndicator size="small" color="#f44336" />
                      ) : (
                        <>
                          <Icon name="delete" size={20} color="#f44336" />
                          <Text style={styles.removeButtonText}>Remove</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Icon name="heart-outline" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
            <Text style={styles.emptySubtitle}>
              Start adding items to your wishlist to save them for later
            </Text>
            <TouchableOpacity
              style={styles.shopNowButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.shopNowButtonText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tips Section */}
        {wishlistItems.length > 0 && (
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>Wishlist Tips</Text>
            <View style={styles.tipItem}>
              <Icon name="lightbulb-outline" size={20} color="#ff9800" />
              <Text style={styles.tipText}>
                Items in your wishlist will notify you when prices drop
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="lightbulb-outline" size={20} color="#ff9800" />
              <Text style={styles.tipText}>
                You can add items to cart directly from your wishlist
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="lightbulb-outline" size={20} color="#ff9800" />
              <Text style={styles.tipText}>
                Remove items you no longer want to keep your wishlist organized
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="bell-outline" size={20} color="#ff9800" />
              <Text style={styles.tipText}>
                Get notified when out-of-stock items come back in stock
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
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
  headerInfo: { marginTop: 4 },
  subtitle: { fontSize: 14, color: '#666' },
  notificationBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 8,
    backgroundColor: '#fff3e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start'
  },
  notificationCount: { 
    fontSize: 12, 
    color: '#ff9800', 
    marginLeft: 4,
    fontWeight: '600'
  },
  
  // Wishlist Container
  wishlistContainer: { padding: 16 },
  
  // Out of Stock Summary
  outOfStockSummary: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#ffcdd2',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    alignItems: 'center',
  },
  outOfStockSummaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d32f2f',
    marginTop: 8,
    textAlign: 'center',
  },
  outOfStockSummarySubtext: {
    fontSize: 13,
    color: '#c62828',
    marginTop: 4,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Wishlist Item
  wishlistItem: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  outOfStockItem: {
    opacity: 0.7,
    backgroundColor: '#f8f8f8',
  },
  outOfStockImage: {
    opacity: 0.5,
  },
  productTouchable: {
    flex: 1,
  },
  productImage: { 
    width: width - 64, 
    height: 200, 
    borderRadius: 8, 
    marginBottom: 12 
  },
  productInfo: { marginBottom: 16 },
  productName: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#222', 
    marginBottom: 8,
    lineHeight: 22
  },
  priceContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  currentPrice: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#2874f0',
    marginRight: 8
  },
  originalPrice: { 
    fontSize: 14, 
    color: '#999', 
    textDecorationLine: 'line-through' 
  },
  stockInfo: { marginBottom: 12 },
  inStockContainer: { flexDirection: 'row', alignItems: 'center' },
  inStockText: { 
    fontSize: 14, 
    color: '#4caf50', 
    marginLeft: 4,
    fontWeight: '500'
  },
  outOfStockContainer: { flexDirection: 'row', alignItems: 'center' },
  outOfStockText: { 
    fontSize: 14, 
    color: '#f44336', 
    marginLeft: 4,
    fontWeight: '500'
  },
  
  // Action Buttons
  actionButtons: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionButton: { 
    flex: 1, 
    minWidth: 100,
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 12, 
    borderRadius: 8,
    gap: 8
  },
  addToCartButton: { backgroundColor: '#6B3F1D' },
  goToCartButton: { backgroundColor: '#2874f0' }, // New style for Go to Cart button
  removeButton: { 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#f44336' 
  },
  removeButtonOutOfStock: {
    marginTop: 8,
    width: '100%',
  },
  actionButtonText: { 
    fontSize: 14, 
    fontWeight: '600',
    color: '#fff'
  },
  removeButtonText: { 
    color: '#000', 
    fontSize: 14, 
    fontWeight: '600' 
  },
  notifyButton: { 
    backgroundColor: '#f44336', 
    borderWidth: 1, 
    borderColor: '#f44336' 
  },
  notifyButtonText: { color: '#fff' },
  notifiedButton: { backgroundColor: '#9e9e9e' },
  notifiedButtonText: { color: '#fff' },
  
  // Empty State
  emptyState: { 
    alignItems: 'center', 
    paddingVertical: 60,
    paddingHorizontal: 40
  },
  emptyTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#666', 
    marginTop: 16,
    textAlign: 'center'
  },
  emptySubtitle: { 
    fontSize: 14, 
    color: '#999', 
    textAlign: 'center', 
    marginTop: 8,
    lineHeight: 20
  },
  shopNowButton: { backgroundColor: '#6B3F1D', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8, marginTop: 24 },
  shopNowButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  
  // Tips Section
  tipsSection: { 
    backgroundColor: '#fff', 
    margin: 16, 
    borderRadius: 12, 
    padding: 20 
  },
  tipsTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#222', 
    marginBottom: 16 
  },
  tipItem: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    marginBottom: 12 
  },
  tipText: { 
    flex: 1, 
    fontSize: 14, 
    color: '#666', 
    marginLeft: 12,
    lineHeight: 20
  },
  
  // Error and Loading
  errorText: { color: '#e53935', fontSize: 16, textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: '#6B3F1D', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
}); 