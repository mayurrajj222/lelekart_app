import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, ActivityIndicator, TouchableOpacity, SafeAreaView, TextInput, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { API_BASE } from '../lib/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export default function ProductListScreen({ route, navigation }) {
  const { category } = route.params || {};
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const { cartItems, addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/api/products?category=${encodeURIComponent(category)}&approved=true&limit=300`)
      .then(res => res.json())
      .then(data => {
        const products = Array.isArray(data) ? data : data.products || [];
        
        // Normalize seller names for all products
        const normalizedProducts = products.map(product => {
          if (!product.sellerName) {
            const possibleSellerName = product.sellerUsername || 
                                     product.seller?.username || 
                                     product.seller?.name || 
                                     product.seller_name ||
                                     product.seller_username ||
                                     product.store_name ||
                                     product.storeName ||
                                     product.shop_name ||
                                     product.shopName ||
                                     product.brand ||
                                     product.brandName ||
                                     product.vendor ||
                                     product.vendorName;
            
            if (possibleSellerName) {
              return { ...product, sellerName: possibleSellerName };
            }
          }
          return product;
        });
        
        setProducts(normalizedProducts);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch products');
        setLoading(false);
      });
  }, [category]);

  // Handle search change
  const handleSearchChange = (text) => {
    setSearch(text);
  };

  const renderItem = ({ item }) => {
    const cartItem = cartItems.find(ci => ci.product.id === item.id);
    const quantity = cartItem ? cartItem.quantity : 0;
    
    // HomeTab.js discount logic
    const realPrice = Number(item.price);
    let originalPrice = Math.ceil(realPrice * 2 / 100) * 100;
    if (originalPrice <= realPrice) originalPrice = realPrice + 100;
    const discountPercent = Math.round(((originalPrice - realPrice) / originalPrice) * 100);

    // Ensure at least 4 images
    let images = item.images || [];
    if (typeof images === 'string') {
      try {
        images = JSON.parse(images);
      } catch {
        images = [];
      }
    }
    if (!Array.isArray(images)) images = [];
    
    // If less than 4 images, duplicate the first image or use placeholder
    const firstImage = images[0] || item.image || item.imageUrl || 'https://placehold.co/100x100?text=No+Image';
    while (images.length < 4) {
      images.push(firstImage);
    }

    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })} 
        activeOpacity={0.85}
      >
        <View style={styles.imageWrapper}>
          {/* Wishlist Heart Icon */}
          <TouchableOpacity
            style={styles.wishlistButton}
            onPress={e => {
              e.stopPropagation && e.stopPropagation();
              toggleWishlist(item);
            }}
          >
            <Icon 
              name={isInWishlist(item.id) ? "heart" : "heart-outline"} 
              size={22} 
              color={isInWishlist(item.id) ? "#e91e63" : "#888"} 
            />
          </TouchableOpacity>
          
          <Image 
            source={{ uri: firstImage }} 
            style={styles.image} 
          />
          
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discountPercent}%</Text>
          </View>
        </View>
        
        <Text style={styles.name}>{item.name}</Text>
        
        {/* Seller Name */}
        {(item.sellerName || item.seller) && (
          <Text style={styles.sellerName} numberOfLines={1}>
            by {item.sellerName || item.seller}
          </Text>
        )}
        
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
          <Text style={[styles.price, { textDecorationLine: 'line-through', color: '#888', marginRight: 6 }]}>
            ₹{originalPrice}
          </Text>
          <Text style={[styles.price, { color: '#43a047', fontWeight: 'bold' }]}>
            ₹{realPrice}
          </Text>
        </View>
        
        {quantity > 0 ? (
          <TouchableOpacity 
            style={[styles.addToCartBtn, { backgroundColor: '#2874f0', width: '100%' }]} 
            onPress={e => {
              e.stopPropagation();
              navigation.navigate('MainTabs', { screen: 'Cart' });
            }}
          >
            <Icon name="cart" size={20} color="#fff" />
            <Text style={styles.addToCartText}>Go to Cart</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.addToCartBtn} 
            onPress={e => {
              e.stopPropagation();
              addToCart(item, 1);
              Alert.alert('Success', 'Product added successfully');
            }}
          >
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
              navigation.navigate('CategoryTab');
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
          onChangeText={handleSearchChange}
          placeholderTextColor="#aaa"
        />
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color="#2874f0" style={{ marginTop: 32 }} />
      ) : error ? (
        <Text style={{ color: 'red', textAlign: 'center', marginTop: 32 }}>{error}</Text>
      ) : (
        <FlatList
          data={(() => {
            if (!search.trim()) return products;
            
            const query = search.toLowerCase().trim();
            const exactMatches = [];
            const partialMatches = [];
            const fuzzyMatches = [];
            const broadMatches = [];
            
            products.forEach(product => {
              // Get all searchable text fields
              const name = (product.name || '').toLowerCase();
              const category = (product.category || '').toLowerCase();
              const description = (product.description || '').toLowerCase();
              const seller = (product.sellerName || product.seller?.name || '').toLowerCase();
              const brand = (product.brand || '').toLowerCase();
              const tags = (product.tags || '').toLowerCase();
              
              // Create a combined search string
              const allText = `${name} ${category} ${description} ${seller} ${brand} ${tags}`.toLowerCase();
              
              // Exact name match
              if (name.includes(query)) {
                exactMatches.push(product);
              }
              // Category or brand match
              else if (category.includes(query) || brand.includes(query)) {
                partialMatches.push(product);
              }
              // Description, seller, or tags match
              else if (description.includes(query) || seller.includes(query) || tags.includes(query)) {
                fuzzyMatches.push(product);
              }
              // Broad text search
              else if (allText.includes(query)) {
                broadMatches.push(product);
              }
              // Enhanced word matching
              else {
                const queryWords = query.split(/\s+/).filter(word => word.length > 1);
                const allWords = allText.split(/\s+/);
                
                const hasWordMatch = queryWords.some(queryWord => 
                  allWords.some(textWord => {
                    // Exact word match
                    if (textWord === queryWord) return true;
                    // Word contains query word
                    if (textWord.includes(queryWord)) return true;
                    // Query word contains text word
                    if (queryWord.includes(textWord) && textWord.length > 2) return true;
                    // Character overlap for fuzzy matching
                    if (queryWord.length > 3 && textWord.length > 3) {
                      const overlap = [...queryWord].filter(char => textWord.includes(char)).length;
                      return overlap >= Math.min(queryWord.length * 0.6, textWord.length * 0.6);
                    }
                    return false;
                  })
                );
                
                if (hasWordMatch) {
                  broadMatches.push(product);
                }
              }
            });
            
            const results = [...exactMatches, ...partialMatches, ...fuzzyMatches, ...broadMatches];
            
            // If no matches found, show some random products as fallback
            if (results.length === 0) {
              return products.slice(0, 8);
            }
            
            return results;
          })()}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyMsg}>Showing related products</Text>}
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
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    margin: 8,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    transform: [{ scale: 1 }],
    transition: 'transform 0.1s'
  },
  cardHover: {
    transform: [{ scale: 1.03 }]
  },
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
  sellerName: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
    fontStyle: 'italic',
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
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#fff'
  },
  searchBar: {
    backgroundColor: '#f0f2f5',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: '#000'
  },
  emptyMsg: {
    textAlign: 'center',
    color: '#888',
    marginTop: 32,
    fontSize: 16
  },
  imageWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
    marginBottom: 8,
  },
  wishlistButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 4,
    elevation: 2,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#e53935',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 2,
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
    fontSize: 11,
    letterSpacing: 0.2,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
}); 