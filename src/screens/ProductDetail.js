import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, SafeAreaView, Alert, FlatList, Dimensions, Modal, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useRoute, useNavigation } from '@react-navigation/native';
import { API_BASE } from '../lib/api';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const { width } = Dimensions.get('window');

export default function ProductDetail() {
  const { addToCart, cartItems } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const navigation = useNavigation();
  const route = useRoute();
  const { product, productId, rewardDiscount, walletDiscount } = route.params || {};
  const [prod, setProd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qty, setQty] = useState(1);
  const [inCart, setInCart] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageRefreshKey, setImageRefreshKey] = useState(0);

  // Add ref for FlatList
  const flatListRef = useRef(null);
  
  // Zoom modal state
  const [zoomModalVisible, setZoomModalVisible] = useState(false);
  const [zoomedImageIndex, setZoomedImageIndex] = useState(0);
  const [isNotified, setIsNotified] = useState(false);

  // Variant state management
  const [variants, setVariants] = useState([]);
  const [availableColors, setAvailableColors] = useState([]);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [showColorError, setShowColorError] = useState(false);
  const [showSizeError, setShowSizeError] = useState(false);

  // Reviews and similar products state
  const [reviews, setReviews] = useState([]);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showAllSimilar, setShowAllSimilar] = useState(false);

  // Write review state
  const [writeReviewModalVisible, setWriteReviewModalVisible] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const { user } = useContext(AuthContext);

  // Calculate tentative delivery date
  const getTentativeDeliveryDate = () => {
    const today = new Date();
    const deliveryDate = new Date(today);
    
    // Random delivery time between 2-5 days
    const deliveryDays = Math.floor(Math.random() * 4) + 2; // 2 to 5 days
    deliveryDate.setDate(today.getDate() + deliveryDays);
    
    const options = { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    };
    
    return deliveryDate.toLocaleDateString('en-US', options);
  };

  // Get delivery message based on delivery time
  const getDeliveryMessage = () => {
    if (getCurrentStock() <= 0) return '';
    return "Delivery in 3-5 days | Cash on delivery available";
  };

  // Parse comma-separated string into array of values
  const parseCommaSeparatedValues = (value) => {
    if (!value) return [];
    return value.split(/,\s*/).filter((v) => v.trim() !== "");
  };

  // Check if a given color is in a comma-separated color string
  const colorMatches = (variantColor, selectedColor) => {
    if (!variantColor || !selectedColor) return false;
    const variantColors = parseCommaSeparatedValues(variantColor);
    return variantColors.includes(selectedColor);
  };

  // Check if a given size is in a comma-separated size string
  const sizeMatches = (variantSize, selectedSize) => {
    if (!variantSize || !selectedSize) return false;
    const variantSizes = parseCommaSeparatedValues(variantSize);
    return variantSizes.includes(selectedSize);
  };

  // Process variants to extract available colors and sizes
  const processVariants = (variants) => {
    console.log('=== PROCESSING VARIANTS ===');
    console.log('Input variants:', variants);
    console.log('Variants type:', typeof variants);
    console.log('Variants length:', variants ? variants.length : 'undefined');

    if (!variants || variants.length === 0) {
      console.log('No variants available for processing');
      setAvailableColors([]);
      setAvailableSizes([]);
      return;
    }

    // Extract all colors from variants
    let allColors = [];
    variants.forEach((v, index) => {
      console.log(`Processing variant ${index}:`, v);
      if (v.color && v.color.trim() !== "") {
        const colors = parseCommaSeparatedValues(v.color);
        allColors = [...allColors, ...colors];
        console.log(`Variant ${index} colors:`, colors);
      }
    });

    // Extract all sizes from variants
    let allSizes = [];
    variants.forEach((v, index) => {
      if (v.size && v.size.trim() !== "") {
        const sizes = parseCommaSeparatedValues(v.size);
        allSizes = [...allSizes, ...sizes];
        console.log(`Variant ${index} sizes:`, sizes);
      }
    });

    // Deduplicate colors and sizes
    const uniqueColors = Array.from(new Set(allColors));
    const uniqueSizes = Array.from(new Set(allSizes));

    console.log('=== PROCESSING RESULTS ===');
    console.log('All colors found:', allColors);
    console.log('All sizes found:', allSizes);
    console.log('Unique colors:', uniqueColors);
    console.log('Unique sizes:', uniqueSizes);

    setAvailableColors(uniqueColors);
    setAvailableSizes(uniqueSizes);

    // Auto-select if only one option
    if (uniqueColors.length === 1 && !selectedColor) {
      console.log('Auto-selecting single color:', uniqueColors[0]);
      setSelectedColor(uniqueColors[0]);
    }
    if (uniqueSizes.length === 1 && !selectedSize) {
      console.log('Auto-selecting single size:', uniqueSizes[0]);
      setSelectedSize(uniqueSizes[0]);
    }
    
    console.log('=== PROCESSING COMPLETE ===');
  };

  // Helpers to check availability of a specific size/color given the other selection
  const isSizeAvailable = (size) => {
    if (!variants || variants.length === 0) return true;
    return variants.some((v) => {
      const sizeOk = sizeMatches(v.size, size);
      const colorOk = !selectedColor || colorMatches(v.color, selectedColor);
      const inStock = (v.stock ?? 0) > 0;
      return sizeOk && colorOk && inStock;
    });
  };

  const isColorAvailable = (color) => {
    if (!variants || variants.length === 0) return true;
    return variants.some((v) => {
      const colorOk = colorMatches(v.color, color);
      const sizeOk = !selectedSize || sizeMatches(v.size, selectedSize);
      const inStock = (v.stock ?? 0) > 0;
      return colorOk && sizeOk && inStock;
    });
  };

  // Find matching variant based on selected color and size
  const findMatchingVariant = (color, size) => {
    if (!variants || variants.length === 0) {
      console.log('No variants available');
      return null;
    }

    console.log('Finding variant for color:', color, 'size:', size);
    console.log('Available variants:', variants);

    // First try to find exact match with both color and size
    let matchingVariant = variants.find((variant) => {
      const colorMatch = color && colorMatches(variant.color, color);
      const sizeMatch = size && sizeMatches(variant.size, size);
      const inStock = variant.stock > 0;
      
      console.log(`Variant ${variant.id}: colorMatch=${colorMatch}, sizeMatch=${sizeMatch}, inStock=${inStock}`);
      
      return colorMatch && sizeMatch && inStock;
    });

    // If no exact match, try to find by color only
    if (!matchingVariant && color) {
      console.log('No exact match found, trying color-only match...');
      matchingVariant = variants.find((variant) => {
        const colorMatch = colorMatches(variant.color, color);
        const inStock = variant.stock > 0;
        
        console.log(`Variant ${variant.id}: colorMatch=${colorMatch}, inStock=${inStock}`);
        
        return colorMatch && inStock;
      });
    }

    // If still no match, try to find by size only
    if (!matchingVariant && size) {
      console.log('No color match found, trying size-only match...');
      matchingVariant = variants.find((variant) => {
        const sizeMatch = sizeMatches(variant.size, size);
        const inStock = variant.stock > 0;
        
        console.log(`Variant ${variant.id}: sizeMatch=${sizeMatch}, inStock=${inStock}`);
        
        return sizeMatch && inStock;
      });
    }

    console.log('Final matching variant:', matchingVariant);
    return matchingVariant;
  };

  // Get images for current selection (variant images or fallback to product images)
  const getCurrentImages = () => {
    console.log('=== GETTING CURRENT IMAGES ===');
    console.log('Selected Variant:', selectedVariant);
    console.log('Selected Color:', selectedColor);
    console.log('Selected Size:', selectedSize);
    
    let images = [];
    
    // First priority: Use selected variant images
    if (selectedVariant && selectedVariant.images && Array.isArray(selectedVariant.images) && selectedVariant.images.length > 0) {
      console.log('✅ Using selected variant images:', selectedVariant.images);
      images = selectedVariant.images;
    }
    // Second priority: Try to find any variant with matching color that has images
    else if (selectedColor && variants && variants.length > 0) {
      const colorVariant = variants.find(variant => {
        const colorMatch = colorMatches(variant.color, selectedColor);
        const hasImages = variant.images && Array.isArray(variant.images) && variant.images.length > 0;
        return colorMatch && hasImages;
      });
      
      if (colorVariant) {
        console.log('🎨 Using color-matched variant images:', colorVariant.images);
        images = colorVariant.images;
      }
    }
    // Third priority: Fallback to product images
    else if (prod?.images && Array.isArray(prod.images) && prod.images.length > 0) {
      console.log('📦 Using product images:', prod.images);
      images = prod.images;
    }
    // Fourth priority: Try to parse product imageUrl if it's a JSON array
    else if (prod?.imageUrl) {
      try {
        const parsedImages = JSON.parse(prod.imageUrl);
        if (Array.isArray(parsedImages) && parsedImages.length > 0) {
          console.log('🔗 Using parsed imageUrl:', parsedImages);
          images = parsedImages;
        } else if (typeof prod.imageUrl === 'string' && prod.imageUrl.includes('http')) {
          console.log('🖼️ Using single imageUrl:', prod.imageUrl);
          images = [prod.imageUrl];
        }
      } catch (e) {
        // If parsing fails, treat as single image
        if (typeof prod.imageUrl === 'string' && prod.imageUrl.includes('http')) {
          console.log('🖼️ Using single imageUrl (parse failed):', prod.imageUrl);
          images = [prod.imageUrl];
        }
      }
    }
    // Final fallback
    else {
      console.log('🔄 Using fallback image');
      images = ['https://placehold.co/400x400?text=No+Image'];
    }
    
    // Filter out invalid URLs and ensure minimum 4 images
    const validImages = images.filter(img => 
      img && 
      typeof img === 'string' && 
      img.includes('http') && 
      !img.includes('placeholder.com') &&
      !img.includes('via.placeholder')
    );
    
    // Ensure at least 4 images by duplicating the first valid image
    const finalImages = [...validImages];
    if (finalImages.length === 0) {
      finalImages.push('https://placehold.co/400x400?text=No+Image');
    }
    
    // Duplicate images to ensure at least 4
    while (finalImages.length < 4) {
      finalImages.push(finalImages[0]);
    }
    
    console.log('Final images array (ensuring 4):', finalImages);
    console.log('Image count:', finalImages.length);
    console.log('First image URI:', finalImages[0]);
    return finalImages;
  };

  // Update selected variant when color or size changes
  useEffect(() => {
    console.log('=== VARIANT SELECTION UPDATE ===');
    console.log('Selected Color:', selectedColor);
    console.log('Selected Size:', selectedSize);
    console.log('Available Variants:', variants);
    
    const matchingVariant = findMatchingVariant(selectedColor, selectedSize);
    console.log('Matching Variant:', matchingVariant);
    
    setSelectedVariant(matchingVariant);
    
    if (matchingVariant && qty > matchingVariant.stock) {
      setQty(1);
    }
    
    // Reset image index when variant changes
    setCurrentImageIndex(0);
    
    // Force image refresh - always trigger when color/size changes
    setImageRefreshKey(prev => prev + 1);
    
    // Force a re-render of the image component
    setTimeout(() => {
      setImageRefreshKey(prev => prev + 1);
    }, 100);
    
    console.log('=== VARIANT SELECTION COMPLETE ===');
  }, [selectedColor, selectedSize, variants]);

  // Check if product is in cart
  useEffect(() => {
    if (prod) {
      const isProductInCart = cartItems.some(item => {
        const sameProduct = item.productId === prod.id;
        const sameVariant = JSON.stringify(item.variant) === JSON.stringify({
          selectedVariant,
          selectedColor,
          selectedSize
        });
        return sameProduct && sameVariant;
      });
      setInCart(isProductInCart);
    }
  }, [cartItems, prod, selectedVariant, selectedColor, selectedSize]);

  // Fetch product data
  useEffect(() => {
    if (productId) {
      const fetchProduct = async () => {
        try {
          setLoading(true);
          const res = await fetch(`${API_BASE}/api/products/${productId}?variants=true`);
          if (!res.ok) throw new Error('Failed to fetch product');
          const data = await res.json();
          // Ensure seller display fields are present for UI
          if (data && !data.sellerName && (data.sellerUsername || data.seller?.username || data.seller?.name)) {
            data.sellerName = data.seller?.name || data.sellerUsername || data.seller?.username;
          }
          setProd(data);
          if (data.variants && Array.isArray(data.variants)) {
            setVariants(data.variants);
            processVariants(data.variants);
          }
          setLoading(false);
        } catch (err) {
          setError(err.message || 'Failed to fetch product');
          setLoading(false);
        }
      };
      
      fetchProduct();
    } else if (product) {
      console.log('Using passed product data:', product);
      // Normalize seller display fields for passed-in product object
      if (product && !product.sellerName && (product.sellerUsername || product.seller?.username || product.seller?.name)) {
        product = { ...product, sellerName: product.seller?.name || product.sellerUsername || product.seller?.username };
      }
      setProd(product);
      if (product.variants && Array.isArray(product.variants)) {
        setVariants(product.variants);
        processVariants(product.variants);
      }
      setLoading(false);
    } else {
      setError('No product information provided');
      setLoading(false);
    }
  }, [product, productId]);

  // Fetch reviews and similar products when product is available
  useEffect(() => {
    if (prod?.id) {
      fetchReviews();
      fetchSimilarProducts();
    }
  }, [prod]);

  // Fetch product reviews
  const fetchReviews = async () => {
    if (!prod?.id) return;
    setReviewsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/products/${prod.id}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {
      console.log('Failed to fetch reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Fetch similar products
  const fetchSimilarProducts = async () => {
    if (!prod?.id) return;
    setSimilarLoading(true);
    try {
      // Use the main products API to get all products, then filter by category
      const res = await fetch(`${API_BASE}/api/products`);
      if (res.ok) {
        const data = await res.json();
        const allProducts = data.products || [];
        
        // Filter products by the same category, excluding the current product
        const category = prod?.category || 'honey';
        const similarProducts = allProducts.filter(product => 
          product.category === category && product.id !== prod.id
        );
        
        console.log('Similar products found:', similarProducts.length);
        setSimilarProducts(similarProducts.slice(0, 6)); // Show max 6 similar products
      } else {
        console.log('Failed to fetch products, status:', res.status);
      }
    } catch (err) {
      console.log('Failed to fetch similar products:', err);
    } finally {
      setSimilarLoading(false);
    }
  };

  // Write review functions
  const handleWriteReview = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to write a review.');
      return;
    }
    setWriteReviewModalVisible(true);
  };

  const submitReview = async () => {
    if (!reviewComment.trim()) {
      Alert.alert('Review Required', 'Please write a review comment.');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await fetch(`${API_BASE}/api/products/${prod.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          // Backend expects fields from insertReviewSchema: rating and review(text)
          rating: Number(reviewRating),
          review: reviewComment.trim()
        }),
      });

      if (res.ok) {
        Alert.alert('Success', 'Review submitted successfully!');
        setWriteReviewModalVisible(false);
        setReviewRating(5);
        setReviewComment('');
        // Refresh reviews
        fetchReviews();
      } else {
        let msg = 'Failed to submit review';
        try {
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            const data = await res.json();
            msg = data?.error || data?.message || msg;
          } else {
            msg = await res.text();
          }
        } catch {}
        // Common cases: 401 not logged in, 403 seller/admin, 400 validation
        if (res.status === 401) msg = 'Please login to write a review';
        if (res.status === 403) msg = 'Only buyers can write reviews';
        throw new Error(msg);
      }
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Helper to strip all HTML tags from description
  function stripHtmlTags(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  }

  // Helper to render HTML description
  function renderHtmlDescription(html) {
    if (!html) return null;
    
    const plainText = stripHtmlTags(html);
    return (
      <View style={styles.descriptionContainer}>
        <Text style={styles.descriptionText}>{plainText}</Text>
      </View>
    );
  }

  // Helper to strip all tags and get plain text
  function stripAllTags(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  }

  // Get current price based on selected variant
  const getCurrentPrice = () => {
    if (selectedVariant && selectedVariant.price) {
      return selectedVariant.price;
    }
    return prod?.price || 0;
  };

  // Get current stock based on selected variant
  const getCurrentStock = () => {
    if (selectedVariant && selectedVariant.stock !== undefined) {
      return selectedVariant.stock;
    }
    return prod?.stock || 0;
  };

  // Handle add to cart
  const handleAddToCart = () => {
    if (!prod) return;
    const selectionRequired = (variants && variants.length > 0) && (availableSizes.length > 0 || availableColors.length > 0);
    if (selectionRequired && !selectedVariant) {
      if (availableSizes.length > 0 && !selectedSize) setShowSizeError(true);
      if (availableColors.length > 0 && !selectedColor) setShowColorError(true);
      Alert.alert('Selection Required', 'Please select available options before adding to cart');
      return;
    }
    
    const productToAdd = {
      ...prod,
      selectedColor,
      selectedSize
    };
    
    addToCart(productToAdd, qty, selectedVariant);
    setInCart(true);
    Alert.alert('Success', 'Product added to cart!');
  };

  // Handle buy now
  const handleBuyNow = () => {
    if (!prod) return;
    
    const productToAdd = {
      ...prod,
      selectedColor,
      selectedSize
    };
    
    addToCart(productToAdd, qty, selectedVariant);
    navigation.navigate('Checkout');
  };

  // Handle notify me
  const handleNotifyMe = () => {
    if (isNotified) return;
    setIsNotified(true);
    Alert.alert('Notified', 'You will be notified when this product is back in stock.');
  };

  // Render star rating
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Icon 
          key={i} 
          name={i <= rating ? "star" : "star-outline"} 
          size={16} 
          color={i <= rating ? "#ffc107" : "#ddd"} 
        />
      );
    }
    return stars;
  };

  // Handle loading state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f7fa' }}>
        <Text style={{ fontSize: 18, color: '#666' }}>Loading...</Text>
      </View>
    );
  }

  // Handle error state
  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f7fa' }}>
        <Text style={{ fontSize: 18, color: '#666', marginBottom: 20 }}>{error}</Text>
        <TouchableOpacity
          style={{ backgroundColor: '#2874f0', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}
          onPress={() => {
            setLoading(true);
            setError(null);
            // Retry fetching
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Handle no product state
  if (!prod) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f7fa' }}>
        <Text style={{ fontSize: 18, color: '#666' }}>Product not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
        <SafeAreaView style={styles.headerSafeArea}>
          {/* Header with back button and wishlist */}
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-left" size={24} color="#333" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.wishlistButton}
              onPress={() => {
                // Pass the product with the correct stock information
                const productForWishlist = {
                  ...prod,
                  stock: prod?.stock || 0 // Use the main product stock, not variant stock
                };
                console.log('Adding to wishlist with stock info:', {
                  productId: prod?.id,
                  productStock: prod?.stock,
                  variantStock: selectedVariant?.stock,
                  finalStock: productForWishlist.stock
                });
                toggleWishlist(productForWishlist);
                Alert.alert(
                  'Wishlist', 
                  isInWishlist(prod?.id) ? 'Removed from wishlist' : 'Added to wishlist'
                );
              }}
            >
              <Icon 
                name={isInWishlist(prod?.id) ? "heart" : "heart-outline"} 
                size={24} 
                color={isInWishlist(prod?.id) ? "#e91e63" : "#333"} 
              />
            </TouchableOpacity>
          </View>
          
          {/* Enhanced Image Carousel */}
          <View style={styles.imageCarouselContainer}>
          <FlatList
              data={getCurrentImages()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={e => setCurrentImageIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
              renderItem={({ item, index }) => (
                <View style={styles.imageContainer}>
                  <Image 
                    source={{ uri: item }} 
                    style={styles.productImage} 
                    resizeMode="contain"
                    onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
                  />
                  {/* Image counter */}
                  <View style={styles.imageCounter}>
                    <Text style={styles.imageCounterText}>{index + 1} / {getCurrentImages().length}</Text>
                  </View>
                  {/* Zoom indicator */}
                  <TouchableOpacity 
                    style={styles.zoomIndicator} 
                    onPress={() => { 
                      console.log('Opening zoom modal for image:', index);
                      console.log('Image URI:', item);
                      console.log('Current images array:', getCurrentImages());
                      setZoomedImageIndex(index); 
                      setZoomModalVisible(true); 
                    }}
                  >
                    <Icon name="magnify-plus" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
            )}
            keyExtractor={(_, i) => i.toString()}
              style={styles.imageCarousel}
              key={`${selectedColor}-${selectedSize}-${selectedVariant?.id || 'default'}-${imageRefreshKey}`}
              ref={flatListRef}
              getItemLayout={(data, index) => ({
                length: width,
                offset: width * index,
                index,
              })}
              removeClippedSubviews={false}
          />
            
            {/* Enhanced Carousel Dots */}
            <View style={styles.carouselDots}>
              {getCurrentImages().map((_, i) => (
                <TouchableOpacity 
                  key={`dot-${selectedColor}-${selectedSize}-${i}`} 
                  style={[styles.dot, currentImageIndex === i && styles.activeDot]}
                  onPress={() => {
                    // Scroll to specific image with error handling
                    try {
                      flatListRef.current?.scrollToIndex({ 
                        index: i, 
                        animated: true,
                        viewPosition: 0.5
                      });
                      setCurrentImageIndex(i);
                    } catch (error) {
                      console.log('Error scrolling to image:', error);
                      // Fallback: just update the index
                      setCurrentImageIndex(i);
                    }
                  }}
                />
              ))}
            </View>
            
            {/* Image Navigation Arrows */}
            {getCurrentImages().length > 1 && (
              <>
                <TouchableOpacity 
                  style={[styles.navArrow, styles.navArrowLeft]}
                  onPress={() => {
                    const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : getCurrentImages().length - 1;
                    setCurrentImageIndex(newIndex);
                    try {
                      flatListRef.current?.scrollToIndex({ 
                        index: newIndex, 
                        animated: true,
                        viewPosition: 0.5
                      });
                    } catch (error) {
                      console.log('Error scrolling to previous image:', error);
                    }
                  }}
                >
                  <Icon name="chevron-left" size={24} color="#fff" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.navArrow, styles.navArrowRight]}
                  onPress={() => {
                    const newIndex = currentImageIndex < getCurrentImages().length - 1 ? currentImageIndex + 1 : 0;
                    setCurrentImageIndex(newIndex);
                    try {
                      flatListRef.current?.scrollToIndex({ 
                        index: newIndex, 
                        animated: true,
                        viewPosition: 0.5
                      });
                    } catch (error) {
                      console.log('Error scrolling to next image:', error);
                    }
                  }}
                >
                  <Icon name="chevron-right" size={24} color="#fff" />
                </TouchableOpacity>
              </>
            )}
          </View>
          
          {/* Variant indicator */}
          {selectedVariant && selectedVariant.images && selectedVariant.images.length > 0 && (
            <View style={styles.variantIndicator}>
              <Icon name="image-multiple" size={14} color="#2e7d32" style={{ marginRight: 4 }} />
              <Text style={styles.variantIndicatorText}>
                {selectedColor && selectedSize ? `${selectedColor} / ${selectedSize}` : 
                 selectedColor ? selectedColor : selectedSize ? selectedSize : 'Variant'} Images
              </Text>
            </View>
          )}
          
          {/* Debug info for variant images */}
          {__DEV__ && (
            <View style={styles.debugInfo}>
              <Text style={styles.debugText}>
                Debug: Color={selectedColor || 'None'}, Size={selectedSize || 'None'}
              </Text>
              <Text style={styles.debugText}>
                Variant ID: {selectedVariant?.id || 'None'}
              </Text>
              <Text style={styles.debugText}>
                Images: {getCurrentImages().length} (Variant: {selectedVariant?.images?.length || 0})
              </Text>
              <Text style={styles.debugText}>
                Image Source: {selectedVariant?.images?.length > 0 ? 'Variant' : 'Product'}
              </Text>
              <Text style={styles.debugText}>
                Refresh Key: {imageRefreshKey}
              </Text>
              <Text style={styles.debugText}>
                Current Images: {getCurrentImages().map((img, i) => `${i}: ${img.substring(0, 50)}...`).join(', ')}
              </Text>
              {/* Debug zoom button */}
              <TouchableOpacity 
                style={styles.debugZoomBtn}
                onPress={() => {
                  console.log('Debug: Testing zoom modal');
                  console.log('Current images:', getCurrentImages());
                  setZoomedImageIndex(0);
                  setZoomModalVisible(true);
                }}
              >
                <Text style={styles.debugZoomBtnText}>Test Zoom Modal</Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
        <View style={styles.contentContainer}>
          <Text style={styles.productName}>{prod?.name}</Text>
          
          {/* Seller Name */}
          {prod?.sellerName || prod?.seller ? (
            <TouchableOpacity 
              style={{ marginBottom: 6 }}
              onPress={() => {
                const sellerName = prod?.sellerName || prod?.seller;
                const sellerId = prod?.sellerId;
                navigation.navigate('SellerProducts', { 
                  sellerName, 
                  sellerId 
                });
              }}
            >
              <Text style={{ 
                fontWeight: 'bold', 
                fontSize: 16, 
                color: '#6B3F1D',
                textDecorationLine: 'underline'
              }}>
                Seller: {prod?.sellerName || prod?.seller}
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* Size Selection */}
          {availableSizes.length > 0 && (
            <View style={styles.variantSection}>
              <Text style={styles.variantTitle}>Size</Text>
              <Text style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>
                Debug: {availableSizes.length} sizes available
              </Text>
              <View style={styles.sizeContainer}>
                {availableSizes.map((size) => {
                  const available = isSizeAvailable(size);
                  return (
                    <TouchableOpacity
                      key={size}
                      style={[
                        styles.sizeOption,
                        selectedSize === size && styles.selectedSizeOption,
                        !available && { opacity: 0.5 }
                      ]}
                      disabled={!available}
                      onPress={() => { setSelectedSize(size); setShowSizeError(false); }}
                    >
                      <Text style={[
                        styles.sizeName,
                        selectedSize === size && styles.selectedSizeName
                      ]}>
                        {size}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {showSizeError && (
                <Text style={styles.errorText}>Please select a size</Text>
              )}
            </View>
          )}

          {/* Color Selection */}
          {availableColors.length > 0 && (
            <View style={styles.variantSection}>
              <Text style={styles.variantTitle}>Color</Text>
              <Text style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>
                Debug: {availableColors.length} colors available
              </Text>
              <View style={styles.colorContainer}>
                {availableColors.map((color) => {
                  const available = isColorAvailable(color);
                  return (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        selectedColor === color && styles.selectedColorOption,
                        !available && { opacity: 0.5 }
                      ]}
                      disabled={!available}
                      onPress={() => { setSelectedColor(color); setShowColorError(false); }}
                    >
                      <Text style={[
                        styles.colorName,
                        selectedColor === color && styles.selectedColorName
                      ]}>
                        {color}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {showColorError && (
                <Text style={styles.errorText}>Please select a color</Text>
              )}
            </View>
          )}

          {/* Show reward/wallet discount if present */}
          {(rewardDiscount > 0 || walletDiscount > 0) && (
            <View style={{ marginBottom: 6 }}>
              {rewardDiscount > 0 && (
                <Text style={{ color: '#388e3c', fontWeight: 'bold' }}>Reward Discount Applied: -₹{rewardDiscount.toFixed(2)}</Text>
              )}
              {walletDiscount > 0 && (
                <Text style={{ color: '#388e3c', fontWeight: 'bold' }}>Wallet Used: -₹{walletDiscount.toFixed(2)}</Text>
              )}
            </View>
          )}

          <View style={styles.priceRow}>
            {/* Show discounted price if discount applied */}
            {(rewardDiscount > 0 || walletDiscount > 0) ? (
              <>
                <Text style={[styles.productPrice, { color: '#388e3c', fontWeight: 'bold' }]}>₹{(getCurrentPrice() - (Number(rewardDiscount || 0) + Number(walletDiscount || 0))).toFixed(2)}</Text>
                <Text style={[styles.productPrice, { textDecorationLine: 'line-through', color: '#888', marginLeft: 10 }]}>₹{getCurrentPrice()}</Text>
              </>
            ) : (
              <Text style={styles.productPrice}>₹{getCurrentPrice()}</Text>
            )}
            {prod?.discount && (
              <View style={styles.offerBadge}><Text style={styles.offerText}>{prod?.discount}% OFF</Text></View>
            )}
            {/* Show variant price indicator */}
            {selectedVariant && selectedVariant.price !== prod?.price && (
              <View style={[styles.offerBadge, { backgroundColor: '#4caf50', marginLeft: 8 }]}>
                <Text style={styles.offerText}>Variant Price</Text>
              </View>
            )}
          </View>
          
          {/* Stock information */}
          <Text style={[styles.stockInfo, getCurrentStock() <= 0 && styles.outOfStockText]}>
            {getCurrentStock() > 0 ? (
              `Stock: ${getCurrentStock()} units available`
            ) : (
              'Out of Stock'
            )}
          </Text>
          
          {/* Quantity Control */}
          <View style={styles.quantitySection}>
            <Text style={styles.quantityLabel}>Quantity:</Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityBtn}
                onPress={() => setQty(Math.max(1, qty - 1))}
                disabled={qty <= 1}
              >
                <Icon name="minus" size={20} color={qty <= 1 ? "#ccc" : "#2874f0"} />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{qty}</Text>
              <TouchableOpacity
                style={styles.quantityBtn}
                onPress={() => setQty(Math.min(getCurrentStock(), qty + 1))}
                disabled={qty >= getCurrentStock()}
              >
                <Icon name="plus" size={20} color={qty >= getCurrentStock() ? "#ccc" : "#2874f0"} />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.ratingRow}>
            <View style={styles.ratingBox}><Text style={styles.ratingText}>{prod?.rating || '4.3'}</Text><Icon name="star" size={14} color="#fff" /></View>
            <Text style={styles.ratingCount}>{prod?.ratingCount || '1,234 ratings'}</Text>
          </View>
          {getCurrentStock() > 0 ? (
            <View style={styles.deliveryContainer}>
              <Icon name="truck-delivery" size={16} color="#388e3c" style={{ marginRight: 6 }} />
              <Text style={styles.delivery}>{getDeliveryMessage()}</Text>
            </View>
          ) : null}
          
          {/* Description */}
          {renderHtmlDescription(prod?.description)}
          
          <Text style={styles.highlightsTitle}>Highlights</Text>
          <View style={styles.highlightsList}>
            {(prod?.highlights || ['Genuine product', 'Easy returns', 'Secure payment']).map((h, i) => (
              <View key={i} style={styles.highlightItem}>
                <Icon name="check-circle" size={16} color="#43a047" style={{ marginRight: 6 }} />
                <Text style={styles.highlightText}>{h}</Text>
              </View>
            ))}
          </View>

          {/* Customer Reviews Section */}
          <View style={styles.reviewsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Customer Reviews</Text>
              <View style={styles.reviewActions}>
                <TouchableOpacity style={styles.writeReviewBtn} onPress={handleWriteReview}>
                  <Icon name="pencil" size={16} color="#fff" />
                  <Text style={styles.writeReviewBtnText}>Write Review</Text>
                </TouchableOpacity>
                {reviews.length > 0 && (
                  <TouchableOpacity onPress={() => setShowAllReviews(!showAllReviews)}>
                    <Text style={styles.viewAllText}>
                      {showAllReviews ? 'Show Less' : `View All (${reviews.length})`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            
            {reviewsLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading reviews...</Text>
              </View>
            ) : reviews.length > 0 ? (
              <View style={styles.reviewsContainer}>
                {(showAllReviews ? reviews : reviews.slice(0, 3)).map((review, index) => (
                  <View key={review.id || index} style={styles.reviewItem}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewerInfo}>
                        <Icon name="account-circle" size={24} color="#666" />
                        <Text style={styles.reviewerName}>
                          {review.userName || review.user?.name || review.user?.username || 'Anonymous'}
                        </Text>
                      </View>
                      <View style={styles.reviewRating}>
                        {renderStars(review.rating)}
                      </View>
                    </View>
                    <Text style={styles.reviewComment}>{review.comment || 'No comment provided'}</Text>
                    <Text style={styles.reviewDate}>
                      {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Unknown date'}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noReviewsContainer}>
                <Icon name="star-outline" size={48} color="#ddd" />
                <Text style={styles.noReviewsText}>No reviews yet</Text>
                <Text style={styles.noReviewsSubtext}>Be the first to review this product!</Text>
              </View>
            )}
          </View>

          {/* Similar Products Section */}
          <View style={styles.similarSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Similar Products</Text>
            </View>
            
            {similarLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading similar products...</Text>
              </View>
            ) : similarProducts.length > 0 ? (
              <FlatList
                data={showAllSimilar ? similarProducts : similarProducts.slice(0, 3)}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.similarProductItem}
                    onPress={() => navigation.push('ProductDetail', { product: item })}
                  >
                    <Image 
                      source={{ uri: item.imageUrl || item.image_url || 'https://placehold.co/100x100?text=No+Image' }} 
                      style={styles.similarProductImage} 
                      resizeMode="cover"
                    />
                    <Text style={styles.similarProductName} numberOfLines={2}>
                      {item.name || 'Product Name'}
                    </Text>
                    <Text style={styles.similarProductPrice}>
                      ₹{item.price || item.mrp || '0'}
                    </Text>
                    <View style={styles.similarProductRating}>
                      {renderStars(item.rating || 0)}
                      <Text style={styles.similarProductRatingText}>
                        {item.ratingCount || 0}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.similarProductsList}
              />
            ) : (
              <View style={styles.noSimilarContainer}>
                <Icon name="package-variant" size={48} color="#ddd" />
                <Text style={styles.noSimilarText}>No similar products found</Text>
                <Text style={styles.noSimilarSubtext}>Check back later for more products in this category</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      
      {/* Write Review Modal */}
      <Modal
        visible={writeReviewModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setWriteReviewModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Write a Review</Text>
              <TouchableOpacity onPress={() => setWriteReviewModalVisible(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>Rate this product</Text>
            <View style={styles.ratingSelector}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setReviewRating(star)}
                  style={styles.starButton}
                >
                  <Icon
                    name={star <= reviewRating ? "star" : "star-outline"}
                    size={32}
                    color={star <= reviewRating ? "#ffc107" : "#ddd"}
                  />
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.modalSubtitle}>Write your review</Text>
            <TextInput
              style={styles.reviewInput}
              placeholder="Share your experience with this product..."
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setWriteReviewModalVisible(false)}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.submitBtn, submittingReview && styles.disabledBtn]}
                onPress={submitReview}
                disabled={submittingReview}
              >
                <Text style={styles.modalBtnText}>
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.actionButtons}>
          {/* Add to Cart / Go to Cart */}
          {prod?.stock > 0 ? (
            <TouchableOpacity
              style={[styles.addToCartBtn, { backgroundColor: inCart ? '#2874f0' : '#4caf50' }]}
              onPress={() => {
                if (inCart) {
                  navigation.navigate('MainTabs', { screen: 'Cart' });
                } else {
                  handleAddToCart();
                }
              }}
            >
              <Icon name={inCart ? 'cart' : 'cart-plus'} size={20} color="#fff" />
              <Text style={styles.addToCartBtnText}>{inCart ? 'Go to Cart' : 'Add to Cart'}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.addToCartBtn, { backgroundColor: isNotified ? '#9e9e9e' : '#ff9800' }]}
              onPress={handleNotifyMe}
              disabled={isNotified}
            >
              <Icon name={isNotified ? 'check' : 'bell'} size={20} color="#fff" />
              <Text style={styles.addToCartBtnText}>{isNotified ? 'Notified' : 'Notify Me'}</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.actionBtn, styles.buyNowBtn, getCurrentStock() <= 0 && styles.disabledBtn]}
            onPress={handleBuyNow}
            disabled={getCurrentStock() <= 0}
          >
            <Icon name="flash" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>
              {getCurrentStock() <= 0 ? 'Out of Stock' : 'Buy Now'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Simple Zoom Modal */}
      <Modal
        visible={zoomModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setZoomModalVisible(false)}
      >
        <View style={styles.zoomModalBackdrop}>
          <View style={styles.zoomModalContent}>
            {/* Close Button */}
            <TouchableOpacity onPress={() => setZoomModalVisible(false)} style={styles.closeZoomButton}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
            
            {/* Simple Zoomed Image */}
            <Image
              source={{ uri: getCurrentImages()[zoomedImageIndex] }}
              style={styles.zoomedImage}
              resizeMode="contain"
              onError={(error) => {
                console.log('Zoom image load error:', error);
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerSafeArea: { backgroundColor: '#fff' },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wishlistButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Enhanced Image Carousel Styles
  imageCarouselContainer: {
    position: 'relative',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  imageCarousel: {
    maxHeight: 350,
    backgroundColor: '#fff',
  },
  imageContainer: {
    position: 'relative',
    width: width,
    height: 350,
  },
  productImage: { 
    width, 
    height: 350, 
    backgroundColor: '#f8f9fa' 
  },
  imageCounter: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  zoomIndicator: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrow: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  navArrowLeft: {
    left: 15,
  },
  navArrowRight: {
    right: 15,
  },
  carouselDots: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginTop: 10,
    paddingVertical: 10,
  },
  dot: { 
    width: 10, 
    height: 10, 
    borderRadius: 5, 
    backgroundColor: '#ccc', 
    margin: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeDot: { 
    backgroundColor: '#2874f0',
    borderColor: '#2874f0',
  },
  contentContainer: { padding: 20, backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18, marginTop: -18 },
  productName: { fontSize: 22, fontWeight: 'bold', color: '#222', marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  productPrice: { fontSize: 22, color: '#2874f0', fontWeight: 'bold', marginRight: 12 },
  offerBadge: { backgroundColor: '#e53935', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  offerText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#43a047', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginRight: 8 },
  ratingText: { color: '#fff', fontWeight: 'bold', fontSize: 13, marginRight: 2 },
  ratingCount: { color: '#888', fontSize: 13 },
  deliveryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  delivery: { 
    color: '#388e3c', 
    fontWeight: 'bold',
    fontSize: 14,
  },
  productDesc: { fontSize: 15, color: '#444', marginBottom: 16 },
  highlightsTitle: { fontSize: 16, fontWeight: 'bold', color: '#222', marginBottom: 6 },
  highlightsList: { marginBottom: 16 },
  highlightItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  highlightText: { color: '#444', fontSize: 14 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  qtyBtn: { backgroundColor: '#eee', borderRadius: 4, paddingHorizontal: 12, paddingVertical: 4 },
  qtyBtnText: { fontSize: 18, color: '#2874f0', fontWeight: 'bold' },
  stickyBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#eee', position: 'absolute', bottom: 0, left: 0, right: 0 },
  addToCartBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4caf50',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 10,
  },
  addToCartBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  buyNowBtn: {
    backgroundColor: '#ff9800',
  },
  // Variant section styles
  variantSection: {
    marginBottom: 16,
  },
  variantTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sizeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sizeOption: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  selectedSizeOption: {
    borderColor: '#2874f0',
    backgroundColor: '#2874f0',
  },
  sizeName: {
    fontSize: 14,
    color: '#333',
  },
  selectedSizeName: {
    color: '#fff',
    fontWeight: 'bold',
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorOption: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  selectedColorOption: {
    borderColor: '#2874f0',
    backgroundColor: '#2874f0',
  },
  colorName: {
    fontSize: 14,
    color: '#333',
  },
  selectedColorName: {
    color: '#fff',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#e53935',
    fontSize: 12,
    marginTop: 4,
  },
  stockInfo: { 
    fontSize: 14, 
    color: '#666', 
    marginBottom: 8,
    fontStyle: 'italic'
  },
  outOfStockText: {
    color: '#f44336',
    fontWeight: 'bold'
  },
  disabledBtn: {
    backgroundColor: '#ccc',
    opacity: 0.6
  },

  // New styles for bottom bar
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2874f0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  descriptionContainer: {
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  quantityBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2874f0',
    marginHorizontal: 10,
  },

  // New styles for reviews and similar products
  reviewsSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  viewAllText: {
    color: '#2874f0',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  reviewsContainer: {
    marginTop: 10,
  },
  reviewItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewerName: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#888',
    alignSelf: 'flex-end',
  },
  noReviewsContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noReviewsText: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
  },
  noReviewsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  similarSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 10,
  },
  similarProductsList: {
    paddingHorizontal: 5, // Add some horizontal padding for the list
  },
  similarProductItem: {
    width: width * 0.4, // Adjust width for horizontal scroll
    marginHorizontal: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  similarProductImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
  },
  similarProductName: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 5,
  },
  similarProductPrice: {
    fontSize: 16,
    color: '#2874f0',
    fontWeight: 'bold',
    marginBottom: 4,
    paddingHorizontal: 5,
  },
  similarProductRating: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  similarProductRatingText: {
    fontSize: 12,
    color: '#888',
    marginLeft: 5,
  },
  noSimilarContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noSimilarText: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
  },
  noSimilarSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  reviewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  writeReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2874f0',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 5,
  },
  writeReviewBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // New styles for modal
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '90%',
    padding: 20,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  ratingSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  starButton: {
    padding: 10,
  },
  reviewInput: {
    width: '100%',
    height: 100,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#333',
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelBtn: {
    backgroundColor: '#e0e0e0',
  },
  submitBtn: {
    backgroundColor: '#2874f0',
  },
  modalBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  variantIndicator: {
    backgroundColor: '#e8f5e8',
    borderWidth: 1,
    borderColor: '#4caf50',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 16,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  variantIndicatorText: {
    color: '#2e7d32',
    fontSize: 12,
    fontWeight: '600',
  },
  debugInfo: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    marginHorizontal: 16,
    marginTop: 4,
    borderRadius: 4,
  },
  debugText: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'monospace',
  },
  // New styles for zoom modal
  zoomModalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  zoomModalContent: {
    backgroundColor: '#000',
    borderRadius: 10,
    width: '90%',
    height: '80%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  closeZoomButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  zoomedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
}); 