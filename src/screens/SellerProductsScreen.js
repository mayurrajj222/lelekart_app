import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, ActivityIndicator, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { API_BASE } from '../lib/api';
import { useCart } from '../context/CartContext';

export default function SellerProductsScreen({ route, navigation }) {
  const { sellerName, sellerId } = route.params || {};
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { cartItems, addToCart } = useCart();

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // Fetch products by seller
    const fetchSellerProducts = async () => {
      try {
        let url = `${API_BASE}/api/products?approved=true`;
        
        // If we have sellerId, use it for more precise filtering
        if (sellerId) {
          url += `&sellerId=${encodeURIComponent(sellerId)}`;
        } else if (sellerName) {
          // Fallback to filtering by seller name
          url += `&sellerName=${encodeURIComponent(sellerName)}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch seller products');
        }
        
        const data = await response.json();
        const sellerProducts = Array.isArray(data) ? data : data.products || [];
        
        // Filter products by seller name if we don't have sellerId
        const filteredProducts = sellerId ? sellerProducts : 
          sellerProducts.filter(product => 
            (product.sellerName && product.sellerName.toLowerCase() === sellerName.toLowerCase()) ||
            (product.seller && product.seller.toLowerCase() === sellerName.toLowerCase())
          );
        
        setProducts(filteredProducts);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch seller products');
        setLoading(false);
        console.error('Error fetching seller products:', err);
      }
    };

    fetchSellerProducts();
  }, [sellerName, sellerId]);

  const addToWishlist = async (productId) => {
    try {
      const res = await fetch(`${API_BASE}/api/wishlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to add to wishlist');
      }
      Alert.alert('Success', 'Item added to wishlist!');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to add to wishlist');
    }
  };

  const renderItem = ({ item }) => {
    const cartItem = cartItems.find(ci => ci.product.id === item.id);
    const quantity = cartItem ? cartItem.quantity : 0;
    
    // HomeTab.js discount logic
    const realPrice = Number(item.price);
    let originalPrice = Math.ceil(realPrice * 2 / 100) * 100;
    if (originalPrice <= realPrice) originalPrice = realPrice + 100;
    const discountPercent = Math.round(((originalPrice - realPrice) / originalPrice) * 100);

    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })} 
        activeOpacity={0.85}
      >
        <View style={styles.imageWrapper}>
          {/* Wishlist Heart Icon */}
          <TouchableOpacity
            style={{ position: 'absolute', top: 6, right: 6, zIndex: 2 }}
            onPress={e => {
              e.stopPropagation && e.stopPropagation();
              addToWishlist(item.id);
            }}
          >
            <Icon name="heart-outline" size={22} color="#e91e63" />
          </TouchableOpacity>
          <Image 
            source={{ 
              uri: item.image || item.imageUrl || (item.images && item.images[0]) || 'https://placehold.co/100x100?text=No+Image' 
            }} 
            style={styles.image} 
          />
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discountPercent}%</Text>
          </View>
        </View>
        <Text style={styles.name}>{item.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
          <Text style={[styles.price, { textDecorationLine: 'line-through', color: '#888', marginRight: 6 }]}>
            ₹{originalPrice}
          </Text>
          <Text style={[styles.price, { color: '#43a047', fontWeight: 'bold' }]}>
            ₹{realPrice}
          </Text>
        </View>
        {quantity > 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
            <TouchableOpacity
              style={[styles.addToCartBtn, { backgroundColor: '#e91e63', paddingHorizontal: 10 }]}
              onPress={e => {
                e.stopPropagation();
                if (quantity === 1) {
                  addToCart(item, -1);
                } else {
                  addToCart(item, -1);
                }
              }}
            >
              <Icon name="minus" size={18} color="#fff" />
            </TouchableOpacity>
            <Text style={{ marginHorizontal: 10, fontWeight: 'bold', color: '#222', fontSize: 16 }}>
              {quantity}
            </Text>
            <TouchableOpacity
              style={[styles.addToCartBtn, { backgroundColor: '#43a047', paddingHorizontal: 10 }]}
              onPress={e => {
                e.stopPropagation();
                if (quantity === 0) {
                  addToCart(item, 1);
                  Alert.alert('Success', 'Product added successfully');
                } else {
                  addToCart(item, 1);
                }
              }}
            >
              <Icon name="plus" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addToCartBtn}
            onPress={e => {
              e.stopPropagation();
              addToCart(item, 1);
              Alert.alert('Success', 'Product added successfully');
            }}
          >
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Seller Products</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B3F1D" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Seller Products</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={48} color="#e91e63" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {sellerName ? `${sellerName}'s Products` : 'Seller Products'}
        </Text>
        <View style={{ width: 24 }} />
      </View>
      
      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="package-variant" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No products found from this seller</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.productList}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.productCount}>
              {products.length} product{products.length !== 1 ? 's' : ''} found
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#6B3F1D',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  productList: {
    padding: 8,
  },
  productCount: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    margin: 4,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#e91e63',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
  },
  addToCartBtn: {
    backgroundColor: '#6B3F1D',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 