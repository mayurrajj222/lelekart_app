import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, SafeAreaView, Alert, FlatList, Dimensions } from 'react-native';
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

  // Check if product is in cart with variant matching
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

  // Variant selection state (matching website logic)
  const [variants, setVariants] = useState([]);
  const [showColorError, setShowColorError] = useState(false);
  const [showSizeError, setShowSizeError] = useState(false);

  // Process variants to extract available colors and sizes (matching website logic)
  const getVariantOptions = () => {
    if (!prod || !prod.variants || !Array.isArray(prod.variants) || prod.variants.length === 0) {
      return { colors: [], sizes: [], variantMap: new Map() };
    }

    // Extract unique colors and sizes from variants
    const uniqueColors = Array.from(
      new Set(
        prod.variants
          .filter((v) => v.color && v.color.trim() !== "")
          .map((v) => v.color)
      )
    );

    const uniqueSizes = Array.from(
      new Set(
        prod.variants
          .filter((v) => v.size && v.size.trim() !== "")
          .map((v) => v.size)
      )
    );

    // Create a map for quick lookup of variants by color and size combination
    const variantMap = new Map();
    prod.variants.forEach((variant) => {
      const key = `${variant.color || ""}-${variant.size || ""}`;
      variantMap.set(key, variant);
    });

    return { colors: uniqueColors, sizes: uniqueSizes, variantMap };
  };

  // Get variant options
  const { colors: uniqueColors, sizes: uniqueSizes, variantMap } = getVariantOptions();

  // Function to find available sizes for a selected color
  const getAvailableSizesForColor = (color) => {
    if (!prod?.variants || !color) return uniqueSizes;

    return prod.variants
      .filter((v) => v.color === color && v.stock > 0)
      .map((v) => v.size)
      .filter(
        (size, index, self) =>
          size && size.trim() !== "" && self.indexOf(size) === index
      );
  };

  // Function to find available colors for a selected size
  const getAvailableColorsForSize = (size) => {
    if (!prod?.variants || !size) return uniqueColors;

    return prod.variants
      .filter((v) => v.size === size && v.stock > 0)
      .map((v) => v.color)
      .filter(
        (color, index, self) =>
          color && color.trim() !== "" && self.indexOf(color) === index
      );
  };

  // Calculate available sizes for the selected color
  const availableSizes = selectedColor
    ? getAvailableSizesForColor(selectedColor)
    : uniqueSizes;

  // Calculate available colors for the selected size
  const availableColors = selectedSize
    ? getAvailableColorsForSize(selectedSize)
    : uniqueColors;

  // Function to find the variant based on selected color and size
  const findMatchingVariant = (color, size) => {
    if (!prod || !prod.variants || !Array.isArray(prod.variants))
      return null;

    // If no color or size is selected, return null
    if (!color && !size) return null;

    // Try to find exact match for color and size
    if (color && size) {
      const key = `${color}-${size}`;
      return variantMap.get(key) || null;
    }

    // If only color is selected, find the first variant with that color that has stock
    if (color && !size) {
      return (
        prod.variants.find((v) => v.color === color && v.stock > 0) || null
      );
    }

    // If only size is selected, find the first variant with that size that has stock
    if (!color && size) {
      return (
        prod.variants.find((v) => v.size === size && v.stock > 0) || null
      );
    }

    return null;
  };

  // Initialize selected variant when product loads
  useEffect(() => {
    if (
      prod &&
      prod.variants &&
      Array.isArray(prod.variants) &&
      prod.variants.length > 0
    ) {
      // If there are variants, select the first one by default
      const firstVariant = prod.variants[0];
      setSelectedVariant(firstVariant);
      setSelectedColor(firstVariant.color || null);
      setSelectedSize(firstVariant.size || null);
    }
  }, [prod]);

  // Update selected variant when color or size changes
  useEffect(() => {
    const matchedVariant = findMatchingVariant(selectedColor, selectedSize);
    if (matchedVariant) {
      setSelectedVariant(matchedVariant);

      // Reset quantity if it's higher than the available stock
      if (qty > matchedVariant.stock) {
        setQty(1);
      }
    } else if (selectedColor || selectedSize) {
      // If we have a selection but no matching variant, reset the selected variant
      setSelectedVariant(null);
    }
  }, [selectedColor, selectedSize, qty]);

  useEffect(() => {
    if (productId) {
      setLoading(true);
      setError(null);
      console.log('Fetching product with ID:', productId);
      
      // Try multiple API endpoints for better reliability
      const apiEndpoints = [
        `${API_BASE}/api/products/${productId}?variants=true`,
        `${API_BASE}/api/products/${productId}`,
        `https://www.lelekart.com/api/products/${productId}?variants=true`,
        `https://www.lelekart.com/api/products/${productId}`
      ];
      
      const tryFetchProduct = async (endpointIndex = 0) => {
        if (endpointIndex >= apiEndpoints.length) {
          console.error('All API endpoints failed');
          setError('Failed to load product. Please check your internet connection.');
          setLoading(false);
          return;
        }
        
        const currentEndpoint = apiEndpoints[endpointIndex];
        console.log(`Trying endpoint ${endpointIndex + 1}:`, currentEndpoint);
        
        try {
          const response = await fetch(currentEndpoint);
          console.log(`Response status:`, response.status);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          const data = await response.json();
          console.log('Product data received:', data);
          setProd(data);
          
          if (data.variants && Array.isArray(data.variants) && data.variants.length > 0) {
            console.log('Variants found:', data.variants.length);
            setVariants(data.variants);
          } else {
            console.log('No variants found in product data');
          }
          
          setLoading(false);
        } catch (error) {
          console.error(`Failed to fetch from ${currentEndpoint}:`, error);
          // Try next endpoint
          tryFetchProduct(endpointIndex + 1);
        }
      };
      
      tryFetchProduct();
    } else if (product) {
      console.log('Using passed product data:', product);
      setProd(product);
      if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
        setVariants(product.variants);
      }
      setLoading(false);
    } else {
      console.log('No productId or product provided');
      setError('No product information provided');
      setLoading(false);
    }
  }, [product, productId]);





  const { user } = useContext(AuthContext);
  
  // Helper to strip all HTML tags from description
  function stripHtmlTags(html) {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  }

  // Improved HTML parser for product description
  function renderHtmlDescription(html) {
    if (!html) return <Text style={styles.productDesc}>No description available.</Text>;
    // Replace <ul> and </ul> with markers
    let content = html.replace(/<ul>/gi, '[[[ul]]]')
                      .replace(/<\/ul>/gi, '[[[/ul]]]');
    // Split by <p> tags for paragraphs
    const paragraphs = content.split(/<p>|<\/p>/gi).filter(Boolean);
    let inList = false;
    let elements = [];
    let keyIdx = 0;
    paragraphs.forEach((para) => {
      if (!para.trim()) return;
      // Now handle lists inside paragraphs
      const parts = para.split(/<li>|<\/li>/gi).filter(Boolean);
      parts.forEach((part) => {
        if (part.includes('[[[ul]]]')) {
          inList = true;
          part = part.replace('[[[ul]]]', '');
          if (part.trim()) elements.push(<Text key={`desc-txt-${keyIdx++}`} style={styles.productDesc}>{stripAllTags(part.trim())}</Text>);
          elements.push(<View key={`ul-${keyIdx++}`} style={{ marginTop: 6 }} />);
          return;
        }
        if (part.includes('[[[/ul]]]')) {
          inList = false;
          part = part.replace('[[[/ul]]]', '');
          if (part.trim()) elements.push(<Text key={`desc-txt-${keyIdx++}`} style={styles.productDesc}>{stripAllTags(part.trim())}</Text>);
          return;
        }
        if (inList && part.trim()) {
          // Render as bullet point, support <strong>
          const strongMatch = part.match(/<strong>(.*?)<\/strong>/i);
          if (strongMatch) {
            elements.push(
              <View key={`li-${keyIdx++}`} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
                <Text style={{ fontSize: 16, marginRight: 6 }}>{'\u2022'}</Text>
                <Text style={[styles.productDesc, { fontWeight: 'bold' }]}>{stripAllTags(strongMatch[1])}</Text>
              </View>
            );
          } else {
            elements.push(
              <View key={`li-${keyIdx++}`} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
                <Text style={{ fontSize: 16, marginRight: 6 }}>{'\u2022'}</Text>
                <Text style={styles.productDesc}>{stripAllTags(part.trim())}</Text>
              </View>
            );
          }
        } else if (part.trim()) {
          // Render <strong> as bold in normal text
          const strongParts = part.split(/<strong>|<\/strong>/i);
          if (strongParts.length > 1) {
            strongParts.forEach((sp, i) => {
              if (i % 2 === 1) {
                elements.push(<Text key={`desc-strong-${keyIdx++}-${i}`} style={[styles.productDesc, { fontWeight: 'bold' }]}>{stripAllTags(sp)}</Text>);
              } else if (sp.trim()) {
                elements.push(<Text key={`desc-txt-${keyIdx++}-${i}`} style={styles.productDesc}>{stripAllTags(sp)}</Text>);
              }
            });
          } else {
            elements.push(<Text key={`desc-txt-${keyIdx++}`} style={styles.productDesc}>{stripAllTags(part.trim())}</Text>);
          }
        }
      });
      // Add a margin after each paragraph
      elements.push(<View key={`para-space-${keyIdx++}`} style={{ height: 6 }} />);
    });
    return <View style={{ marginBottom: 8 }}>{elements}</View>;
  }
  // Helper to strip all HTML tags
  function stripAllTags(html) {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  }

  // Get current price based on selected variant or main product
  const getCurrentPrice = () => {
    if (selectedVariant && selectedVariant.price) {
      return selectedVariant.price;
    }
    return prod?.price || 0;
  };

  // Get current stock based on selected variant or main product
  const getCurrentStock = () => {
    if (selectedVariant && selectedVariant.stock !== undefined) {
      return selectedVariant.stock;
    }
    return prod?.stock || 0;
  };

  // Handle loading state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f7fa' }}>
        <Text style={{ fontSize: 18, color: '#666' }}>Loading product...</Text>
      </View>
    );
  }

  // Handle error state
  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f7fa' }}>
        <Text style={{ fontSize: 18, color: '#e53935', marginBottom: 16 }}>{error}</Text>
        <TouchableOpacity 
          style={{ backgroundColor: '#2874f0', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}
          onPress={() => {
            setError(null);
            setLoading(true);
            // Retry fetching the product with multiple endpoints
            if (productId) {
              const apiEndpoints = [
                `${API_BASE}/api/products/${productId}?variants=true`,
                `${API_BASE}/api/products/${productId}`,
                `https://www.lelekart.com/api/products/${productId}?variants=true`,
                `https://www.lelekart.com/api/products/${productId}`
              ];
              
              const tryFetchProduct = async (endpointIndex = 0) => {
                if (endpointIndex >= apiEndpoints.length) {
                  setError('Failed to load product. Please check your internet connection.');
                  setLoading(false);
                  return;
                }
                
                try {
                  const response = await fetch(apiEndpoints[endpointIndex]);
                  if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                  }
                  
                  const data = await response.json();
                  setProd(data);
                  if (data.variants && Array.isArray(data.variants) && data.variants.length > 0) {
                    setVariants(data.variants);
                  }
                  setLoading(false);
                } catch (error) {
                  console.error(`Failed to fetch from ${apiEndpoints[endpointIndex]}:`, error);
                  // Try next endpoint
                  tryFetchProduct(endpointIndex + 1);
                }
              };
              
              tryFetchProduct();
            }
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
      <ScrollView style={{ flex: 1 }}>
        <SafeAreaView style={styles.headerSafeArea}>
          <FlatList
            data={prod?.images && Array.isArray(prod.images) ? prod.images : [prod?.imageUrl || 'https://placehold.co/200x200?text=No+Image']}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={e => setCurrentImageIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.productImage} resizeMode="contain" />
            )}
            keyExtractor={(_, i) => i.toString()}
            style={{ maxHeight: 320, backgroundColor: '#fff' }}
          />
          <View style={styles.carouselDots}>
            {prod?.images && Array.isArray(prod.images) ? prod.images.map((_, i) => (
              <View key={i} style={[styles.dot, currentImageIndex === i && styles.activeDot]} />
            )) : null}
          </View>
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
          
                     
          
          {/* Color Selection (matching website logic) */}
          {availableColors.length > 0 && (
            <View style={styles.variantSection}>
              <Text style={styles.variantTitle}>Color</Text>
              <View style={styles.colorContainer}>
                {availableColors.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      selectedColor === color && styles.selectedColorOption
                    ]}
                    onPress={() => setSelectedColor(color)}
                  >
                                         <View style={styles.colorImageContainer}>
                       <Image 
                         source={{ 
                           uri: variants.find(v => v.color === color)?.images?.[0] || 
                                 `https://placehold.co/80x80/FFD700/FFFFFF?text=${color}` 
                         }} 
                         style={styles.colorImage} 
                       />
                       {selectedColor === color && (
                         <View style={styles.selectedCheckmark}>
                           <Icon name="check" size={16} color="#fff" />
                         </View>
                       )}
                     </View>
                    <Text style={[
                      styles.colorName,
                      selectedColor === color && styles.selectedColorName
                    ]}>
                      {color}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {showColorError && (
                <Text style={styles.errorText}>Please select a color</Text>
              )}
            </View>
          )}

          {/* Size Selection (matching website logic) */}
          {availableSizes.length > 0 && (
            <View style={styles.variantSection}>
              <Text style={styles.variantTitle}>Size</Text>
              <View style={styles.sizeContainer}>
                {availableSizes.map((size) => {
                  // Find the matching variant for this size and selected color
                  const matchingVariant = findMatchingVariant(selectedColor, size);
                  return (
                    <TouchableOpacity
                      key={size}
                      style={[
                        styles.sizeOption,
                        selectedSize === size && styles.selectedSizeOption
                      ]}
                      onPress={() => setSelectedSize(size)}
                    >
                      <Text style={[
                        styles.sizeName,
                        selectedSize === size && styles.selectedSizeName
                      ]}>
                        {size}
                      </Text>
                      <Text style={[
                        styles.sizePrice,
                        selectedSize === size && styles.selectedSizePrice
                      ]}>
                        {matchingVariant ? `₹${matchingVariant.price}` : 'N/A'}
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
          <Text style={styles.stockInfo}>
            Stock: {getCurrentStock()} units available
          </Text>
          
          <View style={styles.ratingRow}>
            <View style={styles.ratingBox}><Text style={styles.ratingText}>{prod?.rating || '4.3'}</Text><Icon name="star" size={14} color="#fff" /></View>
            <Text style={styles.ratingCount}>{prod?.ratingCount || '1,234 ratings'}</Text>
          </View>
          <Text style={styles.delivery}>Free delivery by Tomorrow</Text>
          {/* Replace the description Text with the rendered HTML elements */}
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
          {/* Wishlist Button */}
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-end',
              marginBottom: 12,
              padding: 8,
              borderRadius: 20,
              backgroundColor: isInWishlist(prod?.id) ? '#ffe6ea' : '#e3e3e3',
            }}
            onPress={() => toggleWishlist(prod)}
          >
            <Icon name={isInWishlist(prod?.id) ? 'heart' : 'heart-outline'} size={24} color={isInWishlist(prod?.id) ? '#e53935' : '#888'} />
            <Text style={{ marginLeft: 8, color: isInWishlist(prod?.id) ? '#e53935' : '#888', fontWeight: 'bold' }}>
              {isInWishlist(prod?.id) ? 'Wishlisted' : 'Add to Wishlist'}
            </Text>
          </TouchableOpacity>
          <View style={styles.qtyRow}>
            <TouchableOpacity onPress={() => setQty(q => Math.max(1, q - 1))} style={styles.qtyBtn}><Text style={styles.qtyBtnText}>-</Text></TouchableOpacity>
            <Text style={{ marginHorizontal: 12, fontSize: 16 }}>{qty}</Text>
            <TouchableOpacity onPress={() => setQty(q => q + 1)} style={styles.qtyBtn}><Text style={styles.qtyBtnText}>+</Text></TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <View style={styles.stickyBar}>
        {inCart ? (
          <TouchableOpacity style={styles.addToCartBtn} onPress={() => navigation.navigate('MainTabs', { screen: 'Cart' })}>
            <Icon name="cart" size={20} color="#fff" />
            <Text style={styles.addToCartText}>Goto cart</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.addToCartBtn} onPress={() => {
            // Add to cart with variant information
            const productToAdd = {
              ...prod,
              selectedVariant: selectedVariant,
              selectedColor: selectedColor,
              selectedSize: selectedSize,
              price: getCurrentPrice(), // Use the current price from selected variant
              stock: getCurrentStock(), // Use the current stock from selected variant
              variant: { // Pass the variant object
                selectedVariant: selectedVariant,
                selectedColor: selectedColor,
                selectedSize: selectedSize
              }
            };
            addToCart(productToAdd, qty);
            Alert.alert('Product added successfully');
            setInCart(true);
          }}>
            <Icon name="cart-plus" size={20} color="#fff" />
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.buyNowBtn} onPress={() => {
          // Buy now with variant information
          const productToBuy = {
            ...prod,
            selectedVariant: selectedVariant,
            selectedColor: selectedColor,
            selectedSize: selectedSize,
            price: getCurrentPrice(), // Use the current price from selected variant
            stock: getCurrentStock(), // Use the current stock from selected variant
            variant: { // Pass the variant object
              selectedVariant: selectedVariant,
              selectedColor: selectedColor,
              selectedSize: selectedSize
            }
          };
          addToCart(productToBuy, qty);
          navigation.navigate('OrderSummary', { buyNowProduct: productToBuy, buyNowQty: qty });
        }}>
          <Icon name="lightning-bolt" size={20} color="#fff" />
          <Text style={styles.buyNowText}>Buy Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerSafeArea: { backgroundColor: '#fff' },
  productImage: { width, height: 320, backgroundColor: '#f0f0f0' },
  carouselDots: { flexDirection: 'row', justifyContent: 'center', marginTop: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ccc', margin: 3 },
  activeDot: { backgroundColor: '#2874f0' },
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
  delivery: { color: '#388e3c', fontWeight: 'bold', marginBottom: 10 },
  productDesc: { fontSize: 15, color: '#444', marginBottom: 16 },
  highlightsTitle: { fontSize: 16, fontWeight: 'bold', color: '#222', marginBottom: 6 },
  highlightsList: { marginBottom: 16 },
  highlightItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  highlightText: { color: '#444', fontSize: 14 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  qtyBtn: { backgroundColor: '#eee', borderRadius: 4, paddingHorizontal: 12, paddingVertical: 4 },
  qtyBtnText: { fontSize: 18, color: '#2874f0', fontWeight: 'bold' },
  stickyBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#eee', position: 'absolute', bottom: 0, left: 0, right: 0 },
  addToCartBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2874f0', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24, justifyContent: 'center' },
  addToCartText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  buyNowBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ff9800', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24, justifyContent: 'center' },
  buyNowText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  
  // Enhanced variant selection styles (matching website logic)
  variantSection: { marginBottom: 20 },
  variantTitle: { fontSize: 16, fontWeight: 'bold', color: '#222', marginBottom: 12 },
  
  // Color selection styles
  colorContainer: { flexDirection: 'row', gap: 12 },
  colorOption: { 
    alignItems: 'center',
    width: 100,
  },
  selectedColorOption: { 
    // Selected state styling
  },
  colorImageContainer: { 
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  colorImage: { 
    width: '100%', 
    height: '100%',
    borderRadius: 6,
  },
  selectedCheckmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#2874f0',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorName: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedColorName: {
    color: '#2874f0',
    fontWeight: 'bold',
  },
  
  // Size selection styles
  sizeContainer: { 
    flexDirection: 'row', 
    gap: 8,
    marginBottom: 8,
  },
  sizeOption: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8, 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    backgroundColor: '#fff',
    minWidth: 80,
    alignItems: 'center',
  },
  selectedSizeOption: { 
    borderColor: '#2874f0', 
    backgroundColor: '#2874f0' 
  },
  sizeName: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#222',
    textAlign: 'center',
    marginBottom: 2,
  },
  selectedSizeName: { 
    color: '#fff' 
  },
  sizePrice: { 
    fontSize: 12, 
    color: '#666',
  },
  selectedSizePrice: { 
    color: '#fff' 
  },
  
  // Error text style
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
}); 