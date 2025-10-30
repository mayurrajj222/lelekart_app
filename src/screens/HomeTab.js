import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity, SafeAreaView, Animated, Alert, Dimensions, TextInput, Keyboard, Linking, Modal, ScrollView, PermissionsAndroid, Platform, BackHandler } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { API_BASE } from '../lib/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import DealOfTheDay from './DealOfTheDay';
// import Carousel from 'react-native-reanimated-carousel';
import { Picker } from '@react-native-picker/picker';
import FullScreenSearch from '../components/FullScreenSearch';


const BG_IMAGE = require('./assets/image.png');
const LELE_IMAGE = require('./assets/lele.png');
const { width } = Dimensions.get('window');
const NUM_COLUMNS = 2;
const CARD_SIZE = (width - 32 - 16 * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

// Chocolate theme colors
const CHOCOLATE = '#4E2E1E';
const CHOCOLATE_LIGHT = '#7B4A2D';
const CHOCOLATE_ACCENT = '#D2691E';

const MemoizedHomeTabHeader = React.memo(function HomeTabHeader({ onWishlistPress, onCameraPress, user, onProfilePress, search, setSearch, onSearchPress, profileUsername, products, handleSearchChange, showSearchSuggestions, setShowSearchSuggestions, setShowFullScreenSearch }) {
  return (
    <>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          {showSearchSuggestions ? (
            <TouchableOpacity 
              onPress={() => {
                setShowSearchSuggestions(false);
                setSearch('');
              }} 
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Icon name="arrow-left" size={24} color="#2874f0" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={onProfilePress} activeOpacity={0.7}>
              <Image
                source={user?.profileImage ? { uri: user.profileImage } : require('./assets/avatar.png')}
                style={styles.profileAvatar}
              />
            </TouchableOpacity>
          )}
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.welcomeText}>
              {showSearchSuggestions ? 'Search Results' : `Welcome${profileUsername ? ` ${profileUsername}!` : '!'}`}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.headerIconBtn} onPress={onWishlistPress}>
          <Icon name="heart-outline" size={28} color="#2874f0" />
        </TouchableOpacity>
      </View>
      <View style={styles.logoHeaderWrap}>
        <Image source={LELE_IMAGE} style={styles.logoImageHeader} />
      </View>
      <TouchableOpacity 
        style={styles.searchBar}
        onPress={() => setShowFullScreenSearch(true)}
        activeOpacity={0.8}
      >
        <Icon name="magnify" size={20} color="#666" style={styles.searchIcon} />
        <Text style={styles.searchPlaceholder}>Search for products...</Text>
        <Icon name="microphone" size={20} color="#666" style={styles.voiceIcon} />
        <Icon name="camera" size={20} color="#666" style={styles.cameraIcon} />
      </TouchableOpacity>
    </>
  );
});

export default function HomeTab() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { addToCart, cartItems } = useCart();
  const { wishlistItems, toggleWishlist, isInWishlist } = useWishlist();
  const navigation = useNavigation();
  const [allProductsLimit, setAllProductsLimit] = useState(10); // Start with 10 to show 4 after featured
  const flatListRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [footerLinks, setFooterLinks] = useState({ about: [], help: [], consumer_policy: [] });
  const [footerLoading, setFooterLoading] = useState(true);
  const [footerError, setFooterError] = useState(false);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showFullScreenSearch, setShowFullScreenSearch] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDropAnim, setShowDropAnim] = useState(false);
  const [pressedIndex, setPressedIndex] = useState(null);
  const { user } = React.useContext(AuthContext);
  const [dealOfTheDay, setDealOfTheDay] = useState(null);
  const [loadingDeal, setLoadingDeal] = useState(true);
  const [banners, setBanners] = useState([]);
  const [loadingBanner, setLoadingBanner] = useState(true);
  const isDealInCart = !!(dealOfTheDay && cartItems.some(item => item.product.id === dealOfTheDay.productId));
  // Add state for selected email
  const [selectedEmail, setSelectedEmail] = useState('');
  const emailOptions = [
    { label: 'support@lelekart.com', value: 'support@lelekart.com' },
    { label: 'help@lelekart.com', value: 'help@lelekart.com' },
  ];
  
  // Real-time profile username for header
  const [profileUsername, setProfileUsername] = useState(user?.username || '');
  useFocusEffect(
    React.useCallback(() => {
      // Only fetch profile info if user is logged in
      if (user) {
        fetch(`${API_BASE}/api/user`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data && data.username) setProfileUsername(data.username);
          })
          .catch(() => {
            // If API call fails, clear username
            setProfileUsername('');
          });
      } else {
        // Clear username when user is not logged in
        setProfileUsername('');
      }
      
      // Clear search when returning to home tab
      if (searching || showSearchSuggestions) {
        setSearch('');
        setSearching(false);
        setShowSearchSuggestions(false);
        setSearchResults([]);
      }
    }, [user])
  );

  useEffect(() => {
    fetchAllProducts();
    setTimeout(() => setShowDropAnim(true), 200);
  }, []);

  // Handle hardware back button
  useEffect(() => {
    const backAction = () => {
      if (searching || showSearchSuggestions) {
        setSearch('');
        setSearching(false);
        setShowSearchSuggestions(false);
        setSearchResults([]);
        return true; // Prevent default back action
      }
      return false; // Allow default back action
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [searching, showSearchSuggestions]);





  useEffect(() => {
    async function fetchBanners() {
      setLoadingBanner(true);
      try {
        const res = await fetch(`${API_BASE}/api/banners`);
        if (!res.ok) throw new Error('Failed to fetch banners');
        const data = await res.json();
        console.log('Banners API Response:', data);
        const activeBanners = Array.isArray(data) ? data.filter(b => b.active) : [];
        setBanners(activeBanners);
      } catch (e) {
        setBanners([]);
      } finally {
        setLoadingBanner(false);
      }
    }
    fetchBanners();
  }, []);

  const handleSearchChange = React.useCallback((text) => {
    setSearch(text);
    
    if (text.trim() === '') {
      setSearching(false);
      setSearchResults([]);
      setShowSearchSuggestions(true); // Show suggestions when search is empty
      return;
    }
    
    // Show real-time search suggestions after 2 characters
    if (text.trim().length >= 2) {
      const lowerQuery = text.trim().toLowerCase();
      const suggestions = products.filter(
        p => p.name && p.name.toLowerCase().includes(lowerQuery)
      ).slice(0, 10); // Limit to 10 suggestions
      
      setSearchResults(suggestions);
      setSearching(true);
      setShowSearchSuggestions(false); // Hide suggestions when showing results
    } else {
      setSearching(false);
      setSearchResults([]);
      setShowSearchSuggestions(true); // Show suggestions for short queries
    }
  }, [products]);

  // Handle search suggestion selection
  const handleSearchSuggestion = (suggestion) => {
    setSearch(suggestion);
    setShowSearchSuggestions(false);
    // Add to search history
    if (!searchHistory.includes(suggestion)) {
      setSearchHistory(prev => [suggestion, ...prev.slice(0, 9)]); // Keep last 10 searches
    }
    // Auto-trigger search
    setTimeout(() => {
      handleSearchPress();
    }, 300);
  };

  // Clear search history
  const clearSearchHistory = () => {
    setSearchHistory([]);
  };

  useEffect(() => {
    async function fetchFooterLinks() {
      setFooterLoading(true);
      setFooterError(false);
      try {
        const res = await fetch(`${API_BASE}/api/footer-content`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        const grouped = { about: [], help: [], consumer_policy: [] };
        data.forEach(item => {
          if (item.isActive && grouped[item.section]) {
            grouped[item.section].push(item);
          }
        });
        Object.keys(grouped).forEach(section => {
          grouped[section].sort((a, b) => a.order - b.order);
        });
        setFooterLinks(grouped);
      } catch (e) {
        setFooterError(true);
      } finally {
        setFooterLoading(false);
      }
    }
    fetchFooterLinks();
  }, []);

  useEffect(() => {
    async function fetchDeal() {
      setLoadingDeal(true);
      try {
        const res = await fetch(`${API_BASE}/api/deal-of-the-day`);
        if (!res.ok) throw new Error('Failed to fetch deal');
        const data = await res.json();
        setDealOfTheDay(data);
      } catch (e) {
        setDealOfTheDay(null);
      } finally {
        setLoadingDeal(false);
      }
    }
    fetchDeal();
  }, []);



  // Add a list of possible categories (can be expanded as needed)
  const CATEGORY_LIST = [
    'Mobiles', 'Electronics', 'Appliances', 'Beauty', 'Fashion', 'Home', 'Toys', 'Sports', 'Books', 'Grocery', 'Jewellery', 'Footwear', 'Watches', 'Bags', 'Furniture', 'Stationery', 'Automotive', 'Health', 'Baby', 'Pet'
  ];

  // Helper to pick a random category
  function getRandomCategory() {
    return CATEGORY_LIST[Math.floor(Math.random() * CATEGORY_LIST.length)];
  }

  // Remove categoryIndex, cycleStartIndex, and categories state if not used elsewhere

  async function fetchAllProducts() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/products?page=1&limit=300`);
      const data = await res.json();
      const products = Array.isArray(data.products) ? data.products : [];
      
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
      setHasMore(false); // No further fetches for price sections
    } catch (error) {
      setError(error.message || 'Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  const handleViewMore = () => {
    setAllProductsLimit(allProductsLimit + 4);
  };

  const getImageUrl = (item) => {
    // First try imageUrl
    if (item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.trim() !== '') {
      return item.imageUrl;
    }
    
    // Then try images array
    if (Array.isArray(item.images)) {
      // Find the first valid, non-empty string
      const validImage = item.images.find(
        img => typeof img === 'string' && img.trim() !== ''
      );
      if (validImage) {
        // If it's a relative path, prepend API_BASE
        if (validImage.startsWith('http')) {
          return validImage;
        } else if (validImage.startsWith('/')) {
          return `${API_BASE}${validImage}`;
        }
        return validImage;
      }
    }
    
    // Try parsing images if it's a JSON string
    if (item.images && typeof item.images === 'string') {
      try {
        const parsedImages = JSON.parse(item.images);
        if (Array.isArray(parsedImages) && parsedImages.length > 0) {
          const firstImage = parsedImages[0];
          if (typeof firstImage === 'string' && firstImage.trim() !== '') {
            if (firstImage.startsWith('http')) {
              return firstImage;
            } else if (firstImage.startsWith('/')) {
              return `${API_BASE}${firstImage}`;
            }
            return firstImage;
          }
        }
      } catch (e) {
        console.log('Failed to parse images JSON:', e);
      }
    }
    
    // Fallback to placeholder
    return 'https://placehold.co/160x160?text=No+Image';
  };

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollTop(offsetY > 200);
  };

  const scrollToTop = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  };

  const getProductQuantity = (productId) => {
    const cartItem = cartItems.find(item => item.product.id === productId);
    return cartItem ? cartItem.quantity : 0;
  };

  const handleAddToCart = (product, quantity = 1) => {
    const currentQty = getProductQuantity(product.id);
    addToCart(product, quantity);
    if (currentQty === 0 && quantity > 0) {
      Alert.alert('Success', 'Product added successfully');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAllProducts();
    setIsRefreshing(false);
  };

  const handleDealAddToCart = async () => {
    if (!dealOfTheDay?.productId) return;
    try {
      const res = await fetch(`${API_BASE}/api/products/${dealOfTheDay.productId}`);
      if (!res.ok) throw new Error('Failed to fetch product');
      const product = await res.json();
      
      // Normalize seller name for deal product
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
          product.sellerName = possibleSellerName;
        }
      }
      
      addToCart(product, 1);
      Alert.alert('Success', 'Deal of the Day added to cart!');
    } catch (e) {
      Alert.alert('Error', 'Could not add to cart. Please try again.');
    }
  };

  const handleGoToCart = () => {
    navigation.navigate('MainTabs', { screen: 'Cart' });
  };

  const handleDealViewProduct = () => {
    if (dealOfTheDay?.productId) {
      navigation.navigate('ProductDetail', { productId: dealOfTheDay.productId });
    }
  };

  const renderListHeader = () => (
    <>
      {/* Banner Section - Hide during search */}
      {!searching && !showSearchSuggestions && (
        <View style={{ height: 180, marginTop: 10, marginHorizontal: 16, alignItems: 'center' }}>
          {loadingBanner ? (
            <Text style={{ color: '#666', fontSize: 16, textAlign: 'center', marginTop: 70 }}>Loading banners...</Text>
          ) : banners.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ width: '100%' }}
              contentContainerStyle={{ paddingHorizontal: 0 }}
            >
              {banners.map((item, index) => (
                <View key={index} style={[styles.webBannerContainer, index === 0 && { marginLeft: 0 }]}>
                  <View style={styles.webBannerLeft}>
                    {item.badgeText ? (
                      <View style={styles.webBannerBadge}>
                        <Text style={styles.webBannerBadgeText}>{item.badgeText}</Text>
                      </View>
                    ) : null}
                    <Text style={styles.webBannerTitle}>{item.title}</Text>
                    {item.subtitle ? (
                      <Text style={styles.webBannerSubtitle}>{item.subtitle}</Text>
                    ) : null}
                    {(item.title && item.title.toLowerCase().includes('raw honey bee')) ? (
                      <Text style={styles.webBannerDescription}>Pure, natural honey directly from the hive. No additives, no preservatives. Taste the difference!</Text>
                    ) : null}
                    {item.buttonText ? (
                      <TouchableOpacity
                        style={styles.webBannerButton}
                        activeOpacity={0.8}
                        onPress={() => {
                          // Follow reference behavior: link to product if productId provided, else to category (and optional subcategory)
                          if (item.productId) {
                            navigation.navigate('ProductDetail', { productId: item.productId });
                            return;
                          }
                          if (item.category) {
                            // Navigate directly to the product list for this category
                            navigation.navigate('ProductList', { category: item.category });
                            return;
                          }
                          // Fallback: try using subtitle hints for known categories
                          const hint = (item.subtitle || item.title || '').toLowerCase();
                          const known = ['electronics','fashion','home','appliances','mobiles','beauty','toys','grocery'];
                          const matched = known.find(k => hint.includes(k));
                          if (matched) {
                            const categoryName = matched.charAt(0).toUpperCase() + matched.slice(1);
                            navigation.navigate('ProductList', { category: categoryName });
                          }
                        }}
                      >
                        <Text style={styles.webBannerButtonText}>{item.buttonText}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  <View style={styles.webBannerRight}>
                    <Image source={{ uri: item.imageUrl }} style={styles.webBannerImage} />
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.banner}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80' }} style={styles.bannerImage} />
            </View>
          )}
        </View>
      )}
      {/* Deal of the Day Section - Hide during search */}
      {!searching && !showSearchSuggestions && (
        <DealOfTheDay deal={dealOfTheDay} loading={loadingDeal} onAddToCart={handleDealAddToCart} onGoToCart={handleGoToCart} onViewProduct={handleDealViewProduct} inCart={isDealInCart} />
      )}
      {/* Featured Products Section - Hide during search */}
      {(!searching && !showSearchSuggestions) && <>
        <Text style={styles.sectionTitle}>Featured Products</Text>
        <View style={styles.productsSectionBg}>
          {loading ? (
            <Text style={{ textAlign: 'center', marginTop: 20 }}>Loading products...</Text>
          ) : error ? (
            <Text style={{ textAlign: 'center', color: 'red', marginTop: 20 }}>{error}</Text>
          ) : (
            <FlatList
              data={products.slice(0, 6)}
              keyExtractor={item => String(item.id)}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={150}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
              renderItem={({ item }) => {
                // Calculate fake original price and discount percent
                const realPrice = Number(item.price);
                let originalPrice = Math.ceil(realPrice * 2 / 100) * 100;
                if (originalPrice <= realPrice) originalPrice = realPrice + 100;
                const discountPercent = Math.round(((originalPrice - realPrice) / originalPrice) * 100);
                return (
                  <View style={{ position: 'relative' }}>
                    {/* Discount Banner */}
                    <View style={styles.discountBanner}>
                      <Text style={styles.discountBannerText}>{discountPercent}% OFF</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.featuredProductCard}
                      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                    >
                      <Image
                        source={{ uri: getImageUrl(item) }}
                        style={styles.featuredProductImage}
                        resizeMode="contain"
                        onError={(e) => {
                          console.log('Featured image failed to load:', getImageUrl(item));
                        }}
                      />
                      <TouchableOpacity
                        style={styles.wishlistButton}
                        onPress={() => toggleWishlist(item)}
                      >
                        <Icon
                          name={isInWishlist(item.id) ? 'heart' : 'heart-outline'}
                          size={24}
                          color={isInWishlist(item.id) ? '#e91e63' : '#888'}
                        />
                      </TouchableOpacity>
                      <Text style={styles.featuredProductName} numberOfLines={2}>{item.name}</Text>
                      {/* Seller Name */}
                      {(item.sellerName || item.seller) && (
                        <Text style={styles.featuredSellerName} numberOfLines={1}>
                          by {item.sellerName || item.seller}
                        </Text>
                      )}
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                        <Text style={styles.originalPrice}>₹{originalPrice}</Text>
                        <Text style={styles.featuredProductPrice}>  ₹{realPrice}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          )}
        </View>
        {/* Price Sections */}
        <View style={{ marginTop: 12 }}>
          {priceSections.map(({ label, max, data }) => {
            if (data.length === 0) return null;
            return (
              <View key={label} style={{ marginBottom: 18 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginBottom: 4 }}>
                  <Text style={styles.sectionTitle}>{label}</Text>
                  <TouchableOpacity onPress={() => setPriceModal({ visible: true, max, label })}>
                    <Text style={{ color: '#2874f0', fontWeight: 'bold', fontSize: 15 }}>View All</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={data.slice(0, 4)}
                  keyExtractor={item => String(item.id)}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4 }}
                  renderItem={({ item }) => {
                    const realPrice = Number(item.price);
                    let originalPrice = Math.ceil(realPrice * 2 / 100) * 100;
                    if (originalPrice <= realPrice) originalPrice = realPrice + 100;
                    const discountPercent = Math.round(((originalPrice - realPrice) / originalPrice) * 100);
                    return (
                      <View style={{ position: 'relative', marginRight: 12 }}>
                        <View style={styles.discountBanner}>
                          <Text style={styles.discountBannerText}>{discountPercent}% OFF</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.featuredProductCard}
                          onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                        >
                          <Image
                            source={{ uri: getImageUrl(item) }}
                            style={styles.featuredProductImage}
                            resizeMode="contain"
                          />
                          <TouchableOpacity
                            style={styles.wishlistButton}
                            onPress={() => toggleWishlist(item)}
                          >
                            <Icon
                              name={isInWishlist(item.id) ? 'heart' : 'heart-outline'}
                              size={24}
                              color={isInWishlist(item.id) ? '#e91e63' : '#888'}
                            />
                          </TouchableOpacity>
                          <Text style={styles.featuredProductName} numberOfLines={2}>{item.name}</Text>
                          {/* Seller Name */}
                          {(item.sellerName || item.seller) && (
                            <Text style={styles.featuredSellerName} numberOfLines={1}>
                              by {item.sellerName || item.seller}
                            </Text>
                          )}
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                            <Text style={styles.originalPrice}>₹{originalPrice}</Text>
                            <Text style={styles.featuredProductPrice}>  ₹{realPrice}</Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    );
                  }}
                />
              </View>
            );
          })}
        </View>
      </>}
      {searching ? (
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.sectionTitle}>Search Results</Text>
          <Text style={{ color: '#666', fontSize: 14, textAlign: 'center', marginTop: 4 }}>
            Showing results for "{search}"
          </Text>
        </View>
      ) : showSearchSuggestions ? (
        <View style={{ marginBottom: 16 }}>
          {/* Search History */}
          {searchHistory.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                <TouchableOpacity onPress={clearSearchHistory}>
                  <Text style={{ color: '#2874f0', fontSize: 14 }}>Clear</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {searchHistory.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.searchSuggestionChip}
                    onPress={() => handleSearchSuggestion(item)}
                  >
                    <Icon name="history" size={16} color="#666" style={{ marginRight: 4 }} />
                    <Text style={styles.searchSuggestionText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

        </View>
      ) : (
        <Text style={styles.sectionTitle}>All Products</Text>
      )}
    </>
  );

  const handleEmailSelect = (email) => {
    setSelectedEmail(email);
    if (email) {
      Linking.openURL(`mailto:${email}?subject=Lelekart%20Support`);
    }
  };

  const renderListFooter = () => (
    <>
      <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 4 }}>
        <TouchableOpacity
          style={styles.viewMoreBtn}
          onPress={handleViewMore}
          disabled={isFetchingMore}
        >
          <Text style={styles.viewMoreText}>{isFetchingMore ? 'Loading...' : 'View More'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.footerBar}>
        <Text style={styles.footerSectionTitle}>Mail Us:</Text>
        <Text style={styles.footerMailText}>
          Lelekart Internet Private Limited,{"\n"}
          Buildings Alyssa, Begonia & Clove Embassy Tech Village,{"\n"}
          Outer Ring Road, Devarabeesanahalli Village,{"\n"}
          Bengaluru, 560103,{"\n"}
          Karnataka, India{"\n"}
          {"\n"}
          Email:
          {"\n    "}
          <Text
            style={{ color: '#2874f0', textDecorationLine: 'underline', marginTop: 6 }}
            onPress={() => Linking.openURL('mailto:support@lelekart.com?subject=Lelekart%20Support')}
          >
            support@lelekart.com
          </Text>
        </Text>
        
        {/* Become a Seller Link */}
        <View style={styles.footerSellerSection}>
          <TouchableOpacity
            onPress={() => Linking.openURL('https://www.lelekart.com/become-a-seller')}
            style={styles.footerSellerButton}
          >
            <Text style={styles.footerSellerText}>Become a Seller</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.footerCopyright}>
          © {new Date().getFullYear()} Lelekart.com. All rights reserved.
        </Text>
      </View>
    </>
  );

  const renderEmptyComponent = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 18, color: '#555', textAlign: 'center' }}>
        No products found. Try adjusting your search or filters.
      </Text>
    </View>
  );

  const dropAnim = useRef([]).current;
  const dropOpacity = useRef([]).current;
  useEffect(() => {
    if (showDropAnim && products.length > 0) {
      dropAnim.length = products.length;
      dropOpacity.length = products.length;
      for (let i = 0; i < products.length; i++) {
        if (!dropAnim[i]) dropAnim[i] = new Animated.Value(-160);
        if (!dropOpacity[i]) dropOpacity[i] = new Animated.Value(0);
        dropAnim[i].setValue(-160);
        dropOpacity[i].setValue(0);
        Animated.parallel([
          Animated.spring(dropAnim[i], {
            toValue: 0,
            useNativeDriver: true,
            friction: 6,
            tension: 70,
          }),
          Animated.timing(dropOpacity[i], {
            toValue: 1,
            duration: 700,
            delay: i * 120,
            useNativeDriver: true,
          })
        ]).start();
      }
    }
  }, [showDropAnim, products]);

  const heartAnim = useRef([]).current;
  useEffect(() => {
    wishlistItems.forEach((item, idx) => {
      if (!heartAnim[item.productId]) heartAnim[item.productId] = new Animated.Value(1);
    });
  }, [wishlistItems]);
  function animateHeart(productId) {
    if (!heartAnim[productId]) return;
    Animated.sequence([
      Animated.timing(heartAnim[productId], { toValue: 1.4, duration: 120, useNativeDriver: true }),
      Animated.timing(heartAnim[productId], { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  }

  const renderProductCard = ({ item, index }) => {
    // Calculate fake original price (e.g., 2x real price, rounded up to nearest 100)
    const realPrice = Number(item.price);
    let originalPrice = Math.ceil(realPrice * 2 / 100) * 100;
    if (originalPrice <= realPrice) originalPrice = realPrice + 100;
    const discountPercent = Math.round(((originalPrice - realPrice) / originalPrice) * 100);
    return (
      <Animated.View
        style={[
          styles.productCard,
          pressedIndex === index && styles.productCardActive,
          {
            transform: [
              { translateY: showDropAnim ? (dropAnim[index] || new Animated.Value(0)) : 0 },
              { scale: pressedIndex === index ? 1.06 : 1 },
            ],
            opacity: showDropAnim ? (dropOpacity[index] || 1) : 1,
            shadowColor: pressedIndex === index ? '#2874f0' : '#b6b1a9',
            shadowOpacity: pressedIndex === index ? 0.22 : 0.10,
          },
        ]}
      >
        {/* Discount Banner */}
        <View style={styles.discountBanner}>
          <Text style={styles.discountBannerText}>{discountPercent}% OFF</Text>
        </View>
        <TouchableOpacity
          style={styles.productCardInner}
          onPress={() => navigation.navigate('ProductDetail', { product: item })}
          onPressIn={() => setPressedIndex(index)}
          onPressOut={() => setPressedIndex(null)}
          activeOpacity={0.85}
        >
                                <Image 
                        source={{ uri: getImageUrl(item) }} 
                        style={styles.productImage} 
                        resizeMode="contain"
                        onError={(e) => {
                          console.log('Image failed to load:', getImageUrl(item));
                        }}
                      />
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          {/* Seller Name */}
          {(item.sellerName || item.seller) && (
            <Text style={styles.sellerName} numberOfLines={1}>
              by {item.sellerName || item.seller}
            </Text>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
            <Text style={styles.originalPrice}>₹{originalPrice}</Text>
            <Text style={styles.productPrice}>  ₹{realPrice}</Text>
          </View>
          <TouchableOpacity
            style={styles.wishlistButton}
            onPress={() => {
              toggleWishlist(item);
              animateHeart(item.id);
            }}
          >
            <Animated.View style={{ transform: [{ scale: heartAnim[item.id] || 1 }] }}>
              <Icon
                name={isInWishlist(item.id) ? 'heart' : 'heart-outline'}
                size={24}
                color={isInWishlist(item.id) ? '#e91e63' : '#888'}
              />
            </Animated.View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const handleWishlistPress = () => navigation.navigate('Account', { screen: 'Wishlist' });
  const handleCameraPress = () => Alert.alert('Coming Soon', 'This feature is coming soon.');
  const handleProfilePress = () => navigation.navigate('Account', { screen: 'ProfileDetails' });

  const handleSearchPress = async () => {
    if (!search.trim()) {
      // If search is empty, return to home view
      setSearching(false);
      setSearchResults([]);
      setShowSearchSuggestions(false);
      return;
    }
    
    Keyboard.dismiss();
    setSearching(true);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(search)}`);
      const data = await res.json();
      const lowerQuery = search.trim().toLowerCase();
      const productsArr = (data || []).filter(
        p => p.name && p.name.toLowerCase().includes(lowerQuery)
      );
      // Normalize images field to always be an array
      const normalizedProducts = productsArr.map(p => {
        let images = p.images;
        if (typeof images === 'string') {
          try {
            images = JSON.parse(images);
          } catch {
            images = [];
          }
        }
        return { ...p, images: Array.isArray(images) ? images : [] };
      });
      setSearchResults(normalizedProducts);
    } catch (err) {
      setError('Failed to search products');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };



  // Order products: Beauty (any category containing 'beauty') first, then others
  const beautyProducts = products.filter(p => (p.category || '').toLowerCase().includes('beauty'));
  const otherProducts = products.filter(p => !(p.category || '').toLowerCase().includes('beauty'));
  const orderedProducts = [...beautyProducts, ...otherProducts];

  // Exclude all jewellery-related products for All Products section
  const nonJewelleryProducts = products.filter(
    p => !(p.category || '').toLowerCase().trim().includes('jewel')
  );

  // State for price modal
  const [priceModal, setPriceModal] = useState({ visible: false, max: null, label: '' });

  // Build unique price sections (no repeats) - place this at the top of HomeTab, not inside JSX
  const allProducts = products;
  const under199 = allProducts.filter(p => Number(p.price) <= 199);
  const under299 = allProducts.filter(p => Number(p.price) > 199 && Number(p.price) <= 299 && !under199.includes(p));
  const under399 = allProducts.filter(p => Number(p.price) > 299 && Number(p.price) <= 399 && !under199.includes(p) && !under299.includes(p));
  const under499 = allProducts.filter(p => Number(p.price) > 399 && Number(p.price) <= 499 && !under199.includes(p) && !under299.includes(p) && !under399.includes(p));
  const priceSections = [
    { label: 'Under ₹199', max: 199, data: under199 },
    { label: 'Under ₹299', max: 299, data: under299 },
    { label: 'Under ₹399', max: 399, data: under399 },
    { label: 'Under ₹499', max: 499, data: under499 },
  ];

  return (
    <View style={styles.bgWrap}>
      <Image source={BG_IMAGE} style={styles.bgImage} resizeMode="cover" />
      <FlatList
        ref={flatListRef}
        data={searching ? searchResults : nonJewelleryProducts.slice(6, allProductsLimit)}
        keyExtractor={item => String(item.id)}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingBottom: 0, paddingTop: 8 }}
        renderItem={renderProductCard}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        extraData={searching}
        ListHeaderComponent={
          <>
            <MemoizedHomeTabHeader
              onWishlistPress={handleWishlistPress}
              onCameraPress={handleCameraPress}
              user={user}
              onProfilePress={handleProfilePress}
              search={search}
              setSearch={setSearch}
              onSearchPress={handleSearchPress}
              profileUsername={profileUsername}
              products={products}
              handleSearchChange={handleSearchChange}
              showSearchSuggestions={showSearchSuggestions}
              setShowSearchSuggestions={setShowSearchSuggestions}
              setShowFullScreenSearch={setShowFullScreenSearch}
            />
            {renderListHeader()}
          </>
        }
        ListFooterComponent={searching ? null : renderListFooter}
        ListEmptyComponent={renderEmptyComponent}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
      />
      {showScrollTop && (
        <TouchableOpacity style={styles.scrollTopBtn} onPress={scrollToTop}>
          <Icon name="arrow-up" size={28} color="#fff" />
        </TouchableOpacity>
      )}
      {/* Price Modal */}
      <Modal
        visible={priceModal.visible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setPriceModal({ visible: false, max: null, label: '' })}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{priceModal.label}</Text>
            <TouchableOpacity onPress={() => setPriceModal({ visible: false, max: null, label: '' })}>
              <Text style={{ color: '#e91e63', fontWeight: 'bold', fontSize: 18 }}>Close</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={(() => {
              if (!priceModal.max) return [];
              if (priceModal.max === 199) return under199;
              if (priceModal.max === 299) return under299;
              if (priceModal.max === 399) return under399;
              if (priceModal.max === 499) return under499;
              return [];
            })()}
            keyExtractor={item => String(item.id)}
            numColumns={2}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => {
              const realPrice = Number(item.price);
              let originalPrice = Math.ceil(realPrice * 2 / 100) * 100;
              if (originalPrice <= realPrice) originalPrice = realPrice + 100;
              const discountPercent = Math.round(((originalPrice - realPrice) / originalPrice) * 100);
              return (
                <View style={{ position: 'relative', width: CARD_SIZE, margin: 8 }}>
                  <View style={styles.discountBanner}>
                    <Text style={styles.discountBannerText}>{discountPercent}% OFF</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.productCard}
                    onPress={() => {
                      setPriceModal({ visible: false, max: null, label: '' });
                      navigation.navigate('ProductDetail', { productId: item.id });
                    }}
                  >
                    <Image
                      source={{ uri: getImageUrl(item) }}
                      style={styles.productImage}
                      resizeMode="contain"
                    />
                    <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                    {/* Seller Name */}
                    {(item.sellerName || item.seller) && (
                      <Text style={styles.sellerName} numberOfLines={1}>
                        by {item.sellerName || item.seller}
                      </Text>
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                      <Text style={styles.originalPrice}>₹{originalPrice}</Text>
                      <Text style={styles.productPrice}>  ₹{realPrice}</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            }}
            ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40, color: '#888' }}>No products found in this range.</Text>}
          />
        </SafeAreaView>
      </Modal>
      
      {/* Voice Search Modal - Removed */}
      
      {/* Full Screen Search Modal */}
      <FullScreenSearch
        visible={showFullScreenSearch}
        onClose={() => setShowFullScreenSearch(false)}
        onProductSelect={(product) => {
          navigation.navigate('ProductDetail', { product });
        }}
        products={products}
      />
    </View>
  );
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const styles = StyleSheet.create({
  headerSafeArea: { backgroundColor: 'transparent', marginTop: 38 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginBottom: 8,
  },
  headerLeftColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  logoImage: {
    width: 38,
    height: 38,
    marginBottom: 4,
    resizeMode: 'contain',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-start',
    marginTop: 36,
  },
  profileAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginBottom: 6,
    resizeMode: 'cover',
  },
  logoImageLarge: {
    width: 54,
    height: 54,
    marginBottom: 6,
    resizeMode: 'contain',
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3d3a36',
    fontFamily: 'serif',
  },
  headerIconBtn: {
    padding: 6,
    borderRadius: 20,
    marginLeft: 8,
    alignSelf: 'center',
    marginTop: 36,
  },
  backButton: {
    padding: 6,
    borderRadius: 20,
    marginRight: 8,
  },


  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerLogo: {
    width: 120,
    height: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    color: '#222',
  },
  allProductCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    width: '47%',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
    position: 'relative',
  },
  allProductImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
  },
  wishlistButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 2,
    elevation: 2,
  },
  allProductName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#222',
    marginBottom: 4,
    textAlign: 'center',
    minHeight: 36,
  },
  allProductPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e91e63',
    marginBottom: 8,
  },
  allAddToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginTop: 4,
  },
  allAddToCartText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 14,
  },
  viewMoreBtn: {
    backgroundColor: '#e91e63',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  viewMoreText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  scrollTopBtn: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    backgroundColor: '#e91e63',
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    zIndex: 10,
  },
  banner: {
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginHorizontal: 0,
    marginVertical: 0,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 12,
  },
  // bannerOverlay removed
  bannerText: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    zIndex: 1,
  },
  productsSectionBg: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  featuredProductCard: {
    width: 150,
    marginRight: 10,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  featuredProductImage: {
    width: '100%',
    height: 150,
    borderRadius: 12,
  },
  featuredProductName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#222',
    marginTop: 8,
    textAlign: 'center',
  },
  featuredProductPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e91e63',
    marginTop: 4,
  },
  footerBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginTop: 0,
  },
  footerSectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  footerSection: {
    flex: 1,
    marginRight: 12,
  },
  footerSectionTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#e91e63',
    marginBottom: 4,
  },
  footerLink: {
    color: '#2874f0',
    fontSize: 13,
    marginBottom: 2,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  socialIcon: {
    marginRight: 6,
  },
  footerMailUs: {
    marginTop: 8,
    marginBottom: 4,
  },
  footerMailText: {
    fontSize: 12,
    color: '#444',
    lineHeight: 16,
  },
  footerCopyright: {
    textAlign: 'center',
    color: '#aaa',
    fontSize: 12,
    marginTop: 8,
  },
  footerSellerSection: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  footerSellerButton: {
    backgroundColor: '#6B3F1D',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  footerSellerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bgWrap: {
    flex: 1,
    backgroundColor: '#f7f4ef',
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    zIndex: -1,
  },
  productCard: {
    width: CARD_SIZE,
    height: CARD_SIZE * 1.15,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e1db',
    shadowColor: '#b6b1a9',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    marginTop: 0,
    marginRight: 8,
    marginLeft: 0,
    overflow: 'hidden',
  },
  productCardActive: {
    backgroundColor: '#e0d6c6',
    shadowColor: '#2874f0',
    shadowOpacity: 0.22,
    elevation: 4,
  },
  animatedCard: {
    alignItems: 'center',
    width: '100%',
  },
  productCardInner: {
    alignItems: 'center',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  productImage: {
    width: CARD_SIZE * 0.5,
    height: CARD_SIZE * 0.5,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3d3a36',
    textAlign: 'center',
    fontFamily: 'serif',
    letterSpacing: 0.1,
    marginBottom: 2,
    paddingHorizontal: 4,
  },
  sellerName: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
    paddingHorizontal: 4,
    fontStyle: 'italic',
  },
  featuredSellerName: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginBottom: 2,
    paddingHorizontal: 4,
    fontStyle: 'italic',
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2874f0',
    textAlign: 'center',
    fontFamily: 'serif',
    marginTop: 2,
  },
  wishlistButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
  },
  featuredProductCard: {
    width: CARD_SIZE * 0.8,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e1db',
    shadowColor: '#b6b1a9',
    shadowOpacity: 0.10,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    marginBottom: 4,
    paddingVertical: 10,
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  featuredProductImage: {
    width: CARD_SIZE * 0.5,
    height: CARD_SIZE * 0.5,
    borderRadius: 10,
    backgroundColor: '#f3ede6',
    marginBottom: 6,
  },
  featuredProductName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3d3a36',
    textAlign: 'center',
    fontFamily: 'serif',
    letterSpacing: 0.1,
    marginBottom: 1,
    paddingHorizontal: 4,
  },
  featuredProductPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2874f0',
    textAlign: 'center',
    fontFamily: 'serif',
    marginTop: 1,
  },
  logoHeaderWrap: {
    alignItems: 'center',
    marginBottom: 2,
    marginTop: 2,
    width: '100%',
  },
  logoImageHeader: {
    width: 90,
    height: 100,
    marginTop: 1,
    resizeMode: 'contain',
  },
  webBannerContainer: {
    flexDirection: 'row',
    height: 160,
    width: Dimensions.get('window').width - 32,
    backgroundColor: CHOCOLATE,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    paddingHorizontal: 0,
    marginVertical: 0,
    marginRight: 16,
  },
  webBannerLeft: {
    flex: 1.2,
    height: '100%',
    justifyContent: 'center',
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 12,
    backgroundColor: CHOCOLATE,
  },
  webBannerBadge: {
    backgroundColor: CHOCOLATE_ACCENT,
    alignSelf: 'flex-start',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 10,
  },
  webBannerBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  webBannerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 4,
    lineHeight: 24,
    flexWrap: 'wrap',
  },
  webBannerSubtitle: {
    color: '#f3e5d0',
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 18,
    flexWrap: 'wrap',
  },
  webBannerDescription: {
    color: '#f3e5d0',
    fontSize: 12,
    marginBottom: 6,
    lineHeight: 16,
    flexWrap: 'wrap',
  },
  webBannerButton: {
    backgroundColor: CHOCOLATE_ACCENT,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  webBannerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  webBannerRight: {
    flex: 1.5,
    height: '100%',
    backgroundColor: CHOCOLATE_LIGHT,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
  },
  webBannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  discountBanner: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#e91e63',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    zIndex: 5,
  },
  discountBannerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  originalPrice: {
    textDecorationLine: 'line-through',
    color: '#888',
    fontSize: 13,
    marginRight: 6,
    fontWeight: '500',
  },
  searchSuggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginVertical: 4,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#eee',
  },
  searchSuggestionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 6,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: '#666',
  },
  voiceIcon: {
    marginRight: 8,
  },
  cameraIcon: {
    marginLeft: 8,
  },
}); 