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
  const { addToCart } = useCart();
  const { wishlistItems, removeFromWishlist, loading, fetchWishlist } = useWishlist();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [removingItem, setRemovingItem] = useState(null);

  const onRefresh = () => {
    fetchWishlist();
    setRefreshing(false);
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
          <Text style={styles.subtitle}>
            {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
          </Text>
        </View>

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
              const inStock = item.product?.stock > 0;
              return (
                <View key={item.id || index} style={styles.wishlistItem}>
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>
                      {item.product?.name}
                    </Text>
                    <View style={styles.priceContainer}>
                      <Text style={styles.currentPrice}>₹{item.product?.price}</Text>
                      {item.product?.mrp && item.product?.mrp > item.product?.price && (
                        <Text style={styles.originalPrice}>₹{item.product?.mrp}</Text>
                      )}
                    </View>
                    <View style={styles.stockInfo}>
                      {inStock ? (
                        <View style={styles.inStockContainer}>
                          <Icon name="check-circle" size={16} color="#4caf50" />
                          <Text style={styles.inStockText}>In Stock</Text>
                        </View>
                      ) : (
                        <View style={styles.outOfStockContainer}>
                          <Icon name="alert-circle" size={16} color="#f44336" />
                          <Text style={styles.outOfStockText}>Out of Stock</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.addToCartButton]}
                      onPress={() => {
                        addToCart(item.product, 1)
                          .then(() => {
                            Alert.alert('Success', 'Item added to cart');
                          })
                          .catch((err) => {
                            Alert.alert('Error', err?.message || 'Failed to add item to cart');
                          });
                      }}
                      disabled={!inStock}
                    >
                      <Icon name="cart-plus" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Add to Cart</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.removeButton]}
                      onPress={() => confirmRemove(item)}
                      disabled={removingItem === (item.productId || item.product?.id)}
                    >
                      {removingItem === (item.productId || item.product?.id) ? (
                        <ActivityIndicator size="small" color="#f44336" />
                      ) : (
                        <>
                          <Icon name="delete" size={20} color="#f44336" />
                          <Text style={[styles.actionButtonText, styles.removeButtonText]}>Remove</Text>
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
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  
  // Wishlist Container
  wishlistContainer: { padding: 16 },
  
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
  actionButtons: { flexDirection: 'row', gap: 12 },
  actionButton: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 12, 
    borderRadius: 8,
    gap: 8
  },
  addToCartButton: { backgroundColor: '#6B3F1D' },
  removeButton: { 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#f44336' 
  },
  actionButtonText: { 
    fontSize: 14, 
    fontWeight: '600',
    color: '#fff'
  },
  removeButtonText: { color: '#f44336' },
  
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