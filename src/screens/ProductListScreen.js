import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, ActivityIndicator, TouchableOpacity, SafeAreaView, TextInput, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { API_BASE } from '../lib/api';
import { useCart } from '../context/CartContext';

export default function ProductListScreen({ route, navigation }) {
  const { category } = route.params || {};
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const { cartItems, addToCart } = useCart();

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/api/products?category=${encodeURIComponent(category)}&approved=true`)
      .then(res => res.json())
      .then(data => {
        setProducts(Array.isArray(data) ? data : data.products || []);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch products');
        setLoading(false);
      });
  }, [category]);

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
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ProductDetail', { productId: item.id })} activeOpacity={0.85}>
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
          <Image source={{ uri: item.image || item.imageUrl || (item.images && item.images[0]) || 'https://placehold.co/100x100?text=No+Image' }} style={styles.image} />
          <View style={styles.discountBadge}><Text style={styles.discountText}>-{discountPercent}%</Text></View>
        </View>
        <Text style={styles.name}>{item.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
          <Text style={[styles.price, { textDecorationLine: 'line-through', color: '#888', marginRight: 6 }]}>₹{originalPrice}</Text>
          <Text style={[styles.price, { color: '#43a047', fontWeight: 'bold' }]}>₹{realPrice}</Text>
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
            <Text style={{ marginHorizontal: 10, fontWeight: 'bold', color: '#222', fontSize: 16 }}>{quantity}</Text>
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
          <TouchableOpacity style={styles.addToCartBtn} onPress={e => {
            e.stopPropagation();
            addToCart(item, 1);
            Alert.alert('Success', 'Product added successfully');
          }}>
            <Icon name="cart-plus" size={20} color="#fff" />
            <Text style={styles.addToCartText}>Add</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack && navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('CategoryTab'); // or 'Home' if that's your main screen
            }
          }}
          style={styles.backBtn}
        >
          <Icon name="arrow-left" size={24} color="#2874f0" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category || 'Products'}</Text>
      </View>
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search products..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#aaa"
        />
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#2874f0" style={{ marginTop: 32 }} />
      ) : error ? (
        <Text style={{ color: 'red', textAlign: 'center', marginTop: 32 }}>{error}</Text>
      ) : (
        <FlatList
          data={products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyMsg}>No products found.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2874f0',
  },
  list: {
    padding: 12,
  },
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 14, margin: 8, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4, transform: [{ scale: 1 }], transition: 'transform 0.1s' },
  cardHover: { transform: [{ scale: 1.03 }] },
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
    textAlign: 'center',
  },
  price: {
    fontSize: 15,
    color: '#43a047',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2874f0',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  addToCartText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  searchBarContainer: { paddingHorizontal: 16, paddingBottom: 8, backgroundColor: '#fff' },
  searchBar: { backgroundColor: '#f0f2f5', borderRadius: 8, padding: 10, fontSize: 16, color: '#222' },
  emptyMsg: { textAlign: 'center', color: '#888', marginTop: 32, fontSize: 16 },
  imageWrapper: { position: 'relative', width: 100, height: 100, marginBottom: 8 },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#e53935',
    borderRadius: 7, // slightly less rounded
    paddingHorizontal: 7, // less padding
    paddingVertical: 2, // less padding
    borderWidth: 1.5,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
    zIndex: 3,
  },
  discountText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11, // smaller
    letterSpacing: 0.2,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
}); 