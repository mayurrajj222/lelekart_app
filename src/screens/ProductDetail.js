import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, SafeAreaView, Alert, FlatList, Dimensions, Modal, TextInput, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useRoute, useNavigation } from '@react-navigation/native';
import { API_BASE } from '../lib/api';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function ProductDetail() {
  const { addToCart, cartItems } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();
  const route = useRoute();
  const { product, productId, rewardDiscount, walletDiscount, preselectedVariant } = route.params || {};
  const [prod, setProd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
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
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isNotified, setIsNotified] = useState(false);
  const [notificationRequested, setNotificationRequested] = useState(false);

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

  // If opened from cart, honor the variant that was in the cart to avoid incorrect "Notify me"
  useEffect(() => {
    if (preselectedVariant && preselectedVariant.id) {
      setSelectedVariant(preselectedVariant);
      // Best-effort set color/size if available to keep UI in sync
      if (preselectedVariant.color) setSelectedColor(preselectedVariant.color);
      if (preselectedVariant.size) setSelectedSize(preselectedVariant.size);
    }
  }, [preselectedVariant]);

  // Calculate tentative delivery date
  const getTentativeDeliveryDate = () => {
    const today = new Date();
    const deliveryDate = new Date(today);

    // Fixed delivery time of 3-5 days (use 4 days as default)
    const deliveryDays = 4; // Fixed 4 days delivery
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

  // Parse comma-separated string into array of values (from reference)
  const parseCommaSeparatedValues = (value) => {
    if (!value) return [];
    return value.split(/,\s*/).filter(v => v.trim() !== '');
  };

  // Check if a given color is in a comma-separated color string (from reference)
  const colorMatches = (variantColor, selectedColor) => {
    if (!variantColor || !selectedColor) return false;
    const variantColors = parseCommaSeparatedValues(variantColor);
    return variantColors.includes(selectedColor);
  };

  // Check if a given size is in a comma-separated size string (from reference)
  const sizeMatches = (variantSize, selectedSize) => {
    if (!variantSize || !selectedSize) return false;
    const variantSizes = parseCommaSeparatedValues(variantSize);
    return variantSizes.includes(selectedSize);
  };

  // Sort sizes in logical order (from reference)
  const sortSizesInOrder = (sizes) => {
    const sizeOrder = {
      'XXS': 0, 'XS': 1, 'S': 2, 'M': 3, 'L': 4, 'XL': 5, 'XXL': 6, '2XL': 6,
      'XXXL': 7, '3XL': 7, 'XXXXL': 8, '4XL': 8, '5XL': 9, '6XL': 10, '7XL': 11, '8XL': 12, '9XL': 13, '10XL': 14
    };

    return [...sizes].sort((a, b) => {
      // Check if these are number sizes (like 38, 40, 42)
      const aNum = parseInt(a, 10);
      const bNum = parseInt(b, 10);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }

      // For standard sizes like S, M, L, XL, etc.
      const aUpperCase = a.toUpperCase();
      const bUpperCase = b.toUpperCase();
      const aIndex = sizeOrder[aUpperCase] !== undefined ? sizeOrder[aUpperCase] : 999;
      const bIndex = sizeOrder[bUpperCase] !== undefined ? sizeOrder[bUpperCase] : 999;
      return aIndex - bIndex;
    });
  };

  // Proper variant processing based on reference implementation
  const processVariants = useCallback(() => {
    console.log('=== PROCESSING VARIANTS ===');
    console.log('Product variants:', prod?.variants);
    console.log('Variants state:', variants);
    console.log('Variants length:', variants?.length || prod?.variants?.length);

    // Check if we have variants
    const variantsToProcess = variants && variants.length > 0 ? variants : prod?.variants;
    if (!variantsToProcess || variantsToProcess.length === 0) {
      console.log('No variants found');
      setAvailableColors([]);
      setAvailableSizes([]);
      onValidSelectionChange(true); // No variants means valid by default
      return;
    }

    // Check for common alternative field names
    const hasColorVariants = variantsToProcess.some(
      v => (v.color || v.colour || v.colorName || v.color_name) &&
        typeof (v.color || v.colour || v.colorName || v.color_name) === 'string' &&
        (v.color || v.colour || v.colorName || v.color_name).trim() !== ''
    );

    const hasSizeOnlyVariants = !hasColorVariants && variantsToProcess.some(
      v => (v.size || v.sizeName || v.size_name) &&
        typeof (v.size || v.sizeName || v.size_name) === 'string' &&
        (v.size || v.sizeName || v.size_name).trim() !== ''
    );

    console.log('=== VARIANT ANALYSIS ===');
    console.log('Total variants:', prod.variants.length);
    console.log('Has color variants:', hasColorVariants);
    console.log('Has size-only variants:', hasSizeOnlyVariants);

    // Log first few variants to see their structure
    prod.variants.slice(0, 3).forEach((v, i) => {
      console.log(`Variant ${i + 1}:`, {
        id: v.id,
        color: v.color,
        colorType: typeof v.color,
        colorLength: v.color ? v.color.length : 0,
        size: v.size,
        sizeType: typeof v.size,
        sizeLength: v.size ? v.size.length : 0,
        stock: v.stock
      });
    });

    if (hasColorVariants) {
      // Normal case: has color values
      let allColors = [];
      let allSizes = [];

      console.log('Processing variants with colors...');
      variantsToProcess
        .filter(v => (v.color || v.colour || v.colorName || v.color_name) &&
          typeof (v.color || v.colour || v.colorName || v.color_name) === 'string' &&
          (v.color || v.colour || v.colorName || v.color_name).trim() !== '' &&
          typeof v.stock === 'number' && v.stock > 0) // Only include variants with stock
        .forEach(v => {
          const colorValue = v.color || v.colour || v.colorName || v.color_name;
          console.log('Processing variant color:', colorValue);
          const colors = parseCommaSeparatedValues(colorValue);
          console.log('Parsed colors:', colors);
          allColors = [...allColors, ...colors];

          // Also collect sizes if they exist
          const sizeValue = v.size || v.sizeName || v.size_name;
          if (sizeValue && typeof sizeValue === 'string' && sizeValue.trim() !== '') {
            console.log('Processing variant size:', sizeValue);
            const sizes = parseCommaSeparatedValues(sizeValue);
            console.log('Parsed sizes:', sizes);
            allSizes = [...allSizes, ...sizes];
          }
        });

      // Deduplicate colors and filter out colors with no stock
      const uniqueColors = Array.from(new Set(allColors)).filter(color => {
        // Check if this color has any variants with stock
        const colorStock = variantsToProcess
          .filter(v => colorMatches(v?.color, color) && typeof v?.stock === 'number' && v.stock > 0)
          .reduce((total, v) => total + (v?.stock || 0), 0);
        return colorStock > 0;
      });
      console.log('Found colors:', allColors);
      console.log('Unique colors with stock:', uniqueColors);
      setAvailableColors(uniqueColors);

      // If only one color, auto-select it
      if (uniqueColors.length === 1) {
        setSelectedColor(uniqueColors[0]);
      } else {
        // If there are multiple colors, require user selection
        setShowColorError(uniqueColors.length > 0);
      }

      // Process sizes if they exist
      if (allSizes.length > 0) {
        const uniqueSizes = Array.from(new Set(allSizes));
        const sortedSizes = sortSizesInOrder(uniqueSizes);
        console.log('Found sizes:', allSizes);
        console.log('Unique sizes:', uniqueSizes);
        console.log('Sorted sizes:', sortedSizes);
        setAvailableSizes(sortedSizes);

        if (sortedSizes.length === 1) {
          setSelectedSize(sortedSizes[0]);
        }
      }

      // Check if this product has variants but selections aren't made
      if (uniqueColors.length > 0) {
        onValidSelectionChange(false); // Start with invalid selection
      } else {
        onValidSelectionChange(true); // No variants means valid by default
      }
    } else if (hasSizeOnlyVariants) {
      // Special case: only has size values, no colors
      setSelectedColor('Default');
      setAvailableColors(['Default']);

      // Extract all sizes and handle comma-separated values
      let allSizes = [];

      variantsToProcess
        .filter(v => (v.size || v.sizeName || v.size_name) &&
          typeof (v.size || v.sizeName || v.size_name) === 'string' &&
          (v.size || v.sizeName || v.size_name).trim() !== '' &&
          (v.stock || 0) > 0)
        .forEach(v => {
          const sizeValue = v.size || v.sizeName || v.size_name;
          const sizes = parseCommaSeparatedValues(sizeValue);
          allSizes = [...allSizes, ...sizes];
        });

      // Deduplicate sizes
      const uniqueSizes = Array.from(new Set(allSizes));

      // Sort sizes in logical sequence
      const sortedSizes = sortSizesInOrder(uniqueSizes);
      setAvailableSizes(sortedSizes);

      if (uniqueSizes.length > 0) {
        setShowSizeError(true);
        onValidSelectionChange(false);
      } else {
        onValidSelectionChange(true);
      }
    } else {
      // No variants with color or size - try fallback extraction
      console.log('No standard color/size fields found, trying fallback extraction...');

      let fallbackColors = [];
      let fallbackSizes = [];

      // Try to extract from variant names or other fields
      variantsToProcess.forEach(v => {
        // Check variant name for color/size info
        if (v.name || v.variantName || v.title) {
          const variantText = (v.name || v.variantName || v.title).toLowerCase();

          // Common color keywords
          const colorKeywords = ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'black', 'white', 'brown', 'gray', 'grey'];
          colorKeywords.forEach(color => {
            if (variantText.includes(color) && !fallbackColors.includes(color)) {
              fallbackColors.push(color);
            }
          });

          // Common size keywords
          const sizeKeywords = ['xs', 's', 'm', 'l', 'xl', 'xxl', 'small', 'medium', 'large'];
          sizeKeywords.forEach(size => {
            if (variantText.includes(size) && !fallbackSizes.includes(size)) {
              fallbackSizes.push(size);
            }
          });
        }
      });

      console.log('Fallback colors found:', fallbackColors);
      console.log('Fallback sizes found:', fallbackSizes);

      if (fallbackColors.length > 0 || fallbackSizes.length > 0) {
        setAvailableColors(fallbackColors);
        setAvailableSizes(fallbackSizes);
        onValidSelectionChange(false);
      } else {
        setAvailableColors([]);
        setAvailableSizes([]);
        onValidSelectionChange(true);
      }
    }

    console.log('=== VARIANT PROCESSING COMPLETE ===');
    console.log('Final available colors:', availableColors);
    console.log('Final available sizes:', availableSizes);
  }, [prod?.variants, variants, onValidSelectionChange]);

  // Helper function to check if selection is valid
  const onValidSelectionChange = useCallback((isValid) => {
    // You can add additional logic here if needed
  }, []);

  // Update available sizes when a color is selected
  useEffect(() => {
    if (!prod?.variants || prod.variants.length === 0) return;

    if (selectedColor) {
      setShowColorError(false);

      // Find available sizes for the selected color
      let allSizes = [];

      // Special case for "Default" color (when only size variants exist)
      const filterFn = selectedColor === 'Default'
        ? (v) => typeof v.stock === 'number' && v.stock > 0
        : (v) => {
          const colorMatch = v.color && parseCommaSeparatedValues(v.color).some(c =>
            c.trim().toLowerCase() === selectedColor.trim().toLowerCase()
          );
          return colorMatch && typeof v.stock === 'number' && v.stock > 0;
        };

      const matchingVariants = prod.variants.filter(filterFn);

      // Collect all sizes from these matching variants
      matchingVariants.forEach(v => {
        if (v.size) {
          const sizes = parseCommaSeparatedValues(v.size);
          allSizes = [...allSizes, ...sizes];
        }
      });

      // Deduplicate sizes
      const uniqueSizes = Array.from(new Set(allSizes));

      // Sort sizes in logical sequence
      const sortedSizes = sortSizesInOrder(uniqueSizes);
      setAvailableSizes(sortedSizes);

      // Reset size selection if current size is not available
      if (selectedSize && !uniqueSizes.includes(selectedSize)) {
        setSelectedSize(null);
      }

      // If only one size, auto-select it
      if (uniqueSizes.length === 1) {
        setSelectedSize(uniqueSizes[0]);
        setShowSizeError(false);
      } else {
        setShowSizeError(uniqueSizes.length > 0 && !selectedSize);
      }
    } else {
      setAvailableSizes([]);
      setSelectedSize(null);
      setShowColorError(availableColors.length > 0);
    }
  }, [selectedColor, prod?.variants, availableColors, selectedSize]);

  // Find matching variant based on selected color and size
  const findMatchingVariant = (color, size) => {
    if (!variants || variants.length === 0) {
      return null;
    }

    // Safety check for variants array
    if (!Array.isArray(variants)) {
      return null;
    }

    // First try to find exact match with both color and size
    let matchingVariant = variants.find((variant) => {
      if (!variant || typeof variant !== 'object') {
        return false;
      }

      const colorMatch = color && colorMatches(variant?.color, color);
      const sizeMatch = size && sizeMatches(variant?.size, size);
      const inStock = (variant?.stock || 0) > 0;

      return colorMatch && sizeMatch && inStock;
    });

    // If no exact match, try to find by color only
    if (!matchingVariant && color) {
      matchingVariant = variants.find((variant) => {
        if (!variant || typeof variant !== 'object') {
          return false;
        }

        const colorMatch = colorMatches(variant?.color, color);
        const inStock = (variant?.stock || 0) > 0;

        return colorMatch && inStock;
      });
    }

    // If still no match, try to find by size only
    if (!matchingVariant && size) {
      matchingVariant = variants.find((variant) => {
        if (!variant || typeof variant !== 'object') {
          return false;
        }

        const sizeMatch = sizeMatches(variant?.size, size);
        const inStock = (variant?.stock || 0) > 0;

        return sizeMatch && inStock;
      });
    }

    return matchingVariant;
  };

  // Helper function to process and validate image URLs
  const processImageUrls = (imageData) => {
    if (!imageData) return [];
    
    let urls = [];
    
    if (Array.isArray(imageData)) {
      urls = imageData;
    } else if (typeof imageData === 'string') {
      try {
        // Try to parse as JSON array first
        const parsed = JSON.parse(imageData);
        urls = Array.isArray(parsed) ? parsed : [imageData];
      } catch (e) {
        // If not JSON, treat as single URL
        urls = [imageData];
      }
    }
    
    // Filter and validate URLs
    return urls.filter(url => {
      if (!url || typeof url !== 'string') return false;
      
      // Must be a valid HTTP/HTTPS URL
      const isValidUrl = url.startsWith('http://') || url.startsWith('https://');
      const isNotPlaceholder = !url.includes('placeholder.com') && !url.includes('via.placeholder');
      
      return isValidUrl && isNotPlaceholder && url.length > 10;
    });
  };

  // Get images for current selection (variant images or fallback to product images)
  const getCurrentImages = () => {
    let images = [];
    
    console.log('getCurrentImages called with:', {
      selectedVariant: selectedVariant?.id,
      selectedColor,
      selectedSize,
      variantImages: selectedVariant?.images,
      productImages: prod?.images,
      productImageUrl: prod?.imageUrl
    });

    // First priority: Use selected variant images
    if (selectedVariant && selectedVariant.images) {
      images = processImageUrls(selectedVariant.images);
      if (images.length > 0) {
        console.log('Using selected variant images:', images);
      }
    }
    
    // Second priority: Try to find any variant with matching color that has images
    if (images.length === 0 && selectedColor && variants && variants.length > 0) {
      const colorVariant = variants.find(variant => {
        const colorMatch = colorMatches(variant.color, selectedColor);
        const processedImages = processImageUrls(variant.images);
        return colorMatch && processedImages.length > 0;
      });

      if (colorVariant) {
        images = processImageUrls(colorVariant.images);
        console.log('Using color variant images:', images);
      }
    }
    
    // Third priority: Fallback to product images
    if (images.length === 0 && prod?.images) {
      images = processImageUrls(prod.images);
      console.log('Using product images:', images);
    }
    
    // Fourth priority: Try product imageUrl
    if (images.length === 0 && prod?.imageUrl) {
      images = processImageUrls(prod.imageUrl);
      console.log('Using product imageUrl:', images);
    }
    
    // Final fallback
    if (images.length === 0) {
      images = ['https://placehold.co/400x400?text=No+Image'];
      console.log('Using placeholder image');
    }

    // Images are already processed and validated by processImageUrls
    console.log('Final images before duplication:', images);

    // Ensure at least 4 images by duplicating the first valid image
    const finalImages = [...images];
    if (finalImages.length === 0) {
      finalImages.push('https://placehold.co/400x400?text=No+Image');
    }

    // Duplicate images to ensure at least 4
    while (finalImages.length < 4) {
      finalImages.push(finalImages[0]);
    }

    console.log('Final images returned:', finalImages);
    return finalImages;
  };

  // Update selected variant when color or size changes
  useEffect(() => {
    // Safety check for variants
    if (!variants || !Array.isArray(variants)) {
      return;
    }

    const matchingVariant = findMatchingVariant(selectedColor, selectedSize);

    setSelectedVariant(matchingVariant);

    if (matchingVariant && qty > (matchingVariant?.stock || 0)) {
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
  }, [selectedColor, selectedSize, variants]);

  // Check if product is in cart (for button display logic)
  useEffect(() => {
    if (prod) {
      // For variant products, always show "Add to Cart" to allow multiple variants or quantity increase
      // For non-variant products, check if exact product is in cart
      if (availableColors.length > 0 || availableSizes.length > 0) {
        // Has variants - always show "Add to Cart" to allow adding different variants or increasing quantity
        setInCart(false);
      } else {
        // No variants - check if this exact product is in cart
        const isProductInCart = cartItems.some(item => {
          return item.productId === prod.id && !item.variant;
        });
        setInCart(isProductInCart);
      }
    }
  }, [cartItems, prod, availableColors, availableSizes]);

  // Load notification state when product or user changes
  useEffect(() => {
    if (prod) {
      loadNotificationState();
    }
  }, [prod, user]);

  // Handle notification after user logs in
  useEffect(() => {
    const handlePostLoginNotification = async () => {
      if (user && notificationRequested && !isNotified) {
        // User logged in after requesting notification
        setIsNotified(true);
        await saveNotificationState();
        Alert.alert('Notification Set', 'You will be notified when this product is back in stock.');
      }
    };

    handlePostLoginNotification();
  }, [user, notificationRequested]);

  // Check stock status and clear notification if product is back in stock
  useEffect(() => {
    if (prod) {
      checkStockAndClearNotification();
    }
  }, [prod, selectedVariant, isNotified, notificationRequested]);

  // Fetch product data
  useEffect(() => {
    if (productId) {
      const fetchProduct = async () => {
        try {
          setLoading(true);

          const res = await fetch(`${API_BASE}/api/products/${productId}?variants=true`);

          if (!res.ok) throw new Error('Failed to fetch product');
          const data = await res.json();

          // Test: Try different variant endpoints if the main one fails
          if (!data.variants || data.variants.length === 0) {
            // Try without variants parameter
            try {
              const altRes = await fetch(`${API_BASE}/api/products/${productId}`);
              if (altRes.ok) {
                const altData = await altRes.json();
                if (altData.variants && altData.variants.length > 0) {
                  data.variants = altData.variants;
                }
              }
            } catch (altErr) {
              // Alternative endpoint failed
            }

            // Try variants endpoint directly
            try {
              const variantRes = await fetch(`${API_BASE}/api/products/${productId}/variants`);
              if (variantRes.ok) {
                const variantData = await variantRes.json();
                if (variantData && variantData.length > 0) {
                  data.variants = variantData;
                }
              }
            } catch (variantErr) {
              // Direct variants endpoint failed
            }
          }
          // Ensure seller display fields are present for UI
          if (data && !data.sellerName) {
            // Try multiple possible seller field names
            const possibleSellerName = data.sellerUsername || 
                                     data.seller?.username || 
                                     data.seller?.name || 
                                     data.seller_name ||
                                     data.sellerName ||
                                     data.seller_username ||
                                     data.store_name ||
                                     data.storeName ||
                                     data.shop_name ||
                                     data.shopName ||
                                     data.brand ||
                                     data.brandName ||
                                     data.vendor ||
                                     data.vendorName;
            
            if (possibleSellerName) {
              data.sellerName = possibleSellerName;
            }
          }
          
          console.log('API Response data:', data);
          console.log('Seller info debug:', {
            sellerName: data.sellerName,
            seller: data.seller,
            sellerUsername: data.sellerUsername,
            seller_name: data.seller_name,
            seller_username: data.seller_username,
            store_name: data.store_name,
            storeName: data.storeName,
            shop_name: data.shop_name,
            shopName: data.shopName,
            brand: data.brand,
            brandName: data.brandName,
            vendor: data.vendor,
            vendorName: data.vendorName
          });
          console.log('Variants in API response:', data.variants);
          
          // Debug variant images for non-logged users
          if (data.variants && data.variants.length > 0) {
            data.variants.forEach((variant, index) => {
              console.log(`Variant ${index}:`, {
                id: variant.id,
                color: variant.color,
                size: variant.size,
                images: variant.images,
                imageCount: variant.images ? variant.images.length : 0
              });
            });
          }
          
          setProd(data);

          if (data.variants && Array.isArray(data.variants)) {
            console.log('Setting variants from API:', data.variants);
            setVariants(data.variants);
            // Don't call processVariants here - let the useEffect handle it
          } else if (data.product && data.product.variants && Array.isArray(data.product.variants)) {
            console.log('Variants found in nested product object:', data.product.variants);
            setVariants(data.product.variants);
            // Don't call processVariants here - let the useEffect handle it
          } else if (data.data && data.data.variants && Array.isArray(data.data.variants)) {
            console.log('Variants found in nested data object:', data.data.variants);
            setVariants(data.data.variants);
            // Don't call processVariants here - let the useEffect handle it
          } else {
            console.log('No variants found in API response');
            console.log('Available keys in response:', Object.keys(data));

            // Check for alternative variant field names
            const possibleVariantFields = ['variants', 'options', 'choices', 'selections', 'combinations'];
            possibleVariantFields.forEach(field => {
              if (data[field] && Array.isArray(data[field])) {
                console.log(`Found variants in '${field}' field:`, data[field]);
                setVariants(data[field]);
                // Don't call processVariants here - let the useEffect handle it
              }
            });

            if (data.product) {
              console.log('Product object keys:', Object.keys(data.product));
              possibleVariantFields.forEach(field => {
                if (data.product[field] && Array.isArray(data.product[field])) {
                  console.log(`Found variants in product.${field}:`, data.product[field]);
                  setVariants(data.product[field]);
                  // Don't call processVariants here - let the useEffect handle it
                }
              });
            }
          }
          setLoading(false);
        } catch (err) {
          setError(err.message || 'Failed to fetch product');
          setLoading(false);
        }
      };

      fetchProduct();
    } else if (product) {
      // Normalize seller display fields for passed-in product object
      if (product && !product.sellerName) {
        const possibleSellerName = product.sellerUsername || 
                                 product.seller?.username || 
                                 product.seller?.name || 
                                 product.seller_name ||
                                 product.sellerName ||
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
          product = { ...product, sellerName: possibleSellerName };
        }
      }

      setProd(product);
      if (product.variants && Array.isArray(product.variants)) {
        setVariants(product.variants);
        // Don't call processVariants here - let the useEffect handle it
      }
      setLoading(false);
    } else {
      setError('No product information provided');
      setLoading(false);
    }
  }, [product, productId]);

  // Refresh function for pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (productId) {
        const res = await fetch(`${API_BASE}/api/products/${productId}?variants=true`);
        if (res.ok) {
          const data = await res.json();
          if (data && !data.sellerName) {
            const possibleSellerName = data.sellerUsername || 
                                     data.seller?.username || 
                                     data.seller?.name || 
                                     data.seller_name ||
                                     data.sellerName ||
                                     data.seller_username ||
                                     data.store_name ||
                                     data.storeName ||
                                     data.shop_name ||
                                     data.shopName ||
                                     data.brand ||
                                     data.brandName ||
                                     data.vendor ||
                                     data.vendorName;
            
            if (possibleSellerName) {
              data.sellerName = possibleSellerName;
            }
          }
          setProd(data);
          if (data.variants && Array.isArray(data.variants)) {
            setVariants(data.variants);
          }
        }
      }
      // Also refresh reviews and similar products
      if (prod) {
        fetchReviews();
        fetchSimilarProducts();
      }
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  }, [productId, prod]);

  // Process variants when product or variants change
  useEffect(() => {
    if (prod && Object.keys(prod).length > 0) {
      console.log('Processing variants for product:', prod.id);
      console.log('Product variants:', prod.variants);
      console.log('Variants state:', variants);
      processVariants();
      console.log('Available colors after processing:', availableColors);
      console.log('Available sizes after processing:', availableSizes);
    }
  }, [prod, variants, processVariants]);

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
      // Failed to fetch reviews
    } finally {
      setReviewsLoading(false);
    }
  };

  // Fetch similar products using the same endpoint as website
  const fetchSimilarProducts = async () => {
    if (!prod?.id) return;
    setSimilarLoading(true);

    try {
      // First try the dedicated similar products endpoint (like website)
      const res = await fetch(`${API_BASE}/api/recommendations/similar/${prod.id}`);

      if (res.ok) {
        const data = await res.json();

        if (data && Array.isArray(data) && data.length > 0) {
          setSimilarProducts(data.slice(0, 6));
          return;
        }
      }

      // Fallback: Manual search like before
      const rawSeller = (prod?.seller?.username
        || prod?.sellerName
        || prod?.seller_username
        || prod?.seller?.name
        || prod?.seller_name
        || prod?.store_name
        || prod?.storeName
        || prod?.shop_name
        || prod?.shopName
        || prod?.brand
        || prod?.brandName
        || prod?.vendor
        || prod?.vendorName
        || prod?.seller
        || '').toString();
      const currentSeller = rawSeller.trim().toLowerCase();

      const useCategoryFallback = currentSeller.length === 0;

      // Fetch products
      let allProducts = [];
      for (let page = 1; page <= 5; page++) {
        const res = await fetch(`${API_BASE}/api/products?page=${page}&limit=20`);
        if (!res.ok) {
          break;
        }
        const data = await res.json();
        const pageProducts = Array.isArray(data?.products) ? data.products : [];
        allProducts = allProducts.concat(pageProducts);
        if (pageProducts.length === 0) break;
      }

      // Choose strategy: seller first, else category
      let next = [];
      if (!useCategoryFallback) {
        next = allProducts.filter(p => {
          const pSeller = (p?.seller?.username
            || p?.sellerName
            || p?.seller_username
            || p?.seller?.name
            || p?.seller_name
            || p?.store_name
            || p?.storeName
            || p?.shop_name
            || p?.shopName
            || p?.brand
            || p?.brandName
            || p?.vendor
            || p?.vendorName
            || p?.seller
            || '').toString().trim().toLowerCase();
          const match = pSeller === currentSeller && p?.id !== prod.id;
          return match;
        });
      }

      if (next.length === 0) {
        const category = (prod?.category || '').toString();
        next = allProducts.filter(p => p?.category === category && p?.id !== prod.id);
      }

      // If still no results, try broader search
      if (next.length === 0) {
        next = allProducts.filter(p => p?.id !== prod.id).slice(0, 6);
      }

      setSimilarProducts(next.slice(0, 6));
    } catch (err) {
      // Failed to fetch similar products
      setSimilarProducts([]);
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
        } catch { }
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

  // Handle add to cart (like website implementation)
  const handleAddToCart = async () => {
    if (!prod) return;

    // Check if variants are required but not selected
    if (availableColors.length > 0 && !selectedColor) {
      setShowColorError(true);
      Alert.alert('Selection Required', 'Please select a color');
      return;
    }

    if (availableSizes.length > 0 && !selectedSize) {
      setShowSizeError(true);
      Alert.alert('Selection Required', 'Please select a size');
      return;
    }

    // Find the selected variant using proper matching functions
    let selectedVariant = null;
    if (prod?.variants && prod.variants.length > 0) {
      if (selectedColor && selectedSize) {
        // Both color and size selected - find exact match
        selectedVariant = prod.variants.find(v =>
          colorMatches(v.color, selectedColor) && sizeMatches(v.size, selectedSize)
        );
      } else if (selectedColor && !selectedSize) {
        // Only color selected - find first variant with that color
        selectedVariant = prod.variants.find(v => colorMatches(v.color, selectedColor));
      } else if (!selectedColor && selectedSize) {
        // Only size selected - find first variant with that size
        selectedVariant = prod.variants.find(v => sizeMatches(v.size, selectedSize));
      }
    }

    if (!selectedVariant && (availableColors.length > 0 || availableSizes.length > 0)) {
      Alert.alert('Selection Required', 'Please select all required options');
      return;
    }

    // Check stock availability
    if (selectedVariant && selectedVariant.stock <= 0) {
      Alert.alert('Out of Stock', 'This variant is currently out of stock');
      return;
    }

    // Prepare the variant object if one is selected
    const variantForCart = selectedVariant ? {
      id: selectedVariant.id,
      color: selectedColor,
      size: selectedSize,
      price: selectedVariant.price,
      mrp: selectedVariant.mrp,
      stock: selectedVariant.stock,
      sku: selectedVariant.sku,
      images: selectedVariant.images || [],
      name: `${selectedColor || ''}${selectedColor && selectedSize ? ' - ' : ''}${selectedSize || ''}`.trim()
    } : null;

    // Debug: Log what we're passing to addToCart
    console.log('=== PRODUCT DETAIL ADD TO CART ===');
    console.log('Product name:', prod?.name);
    console.log('Selected color:', selectedColor);
    console.log('Selected size:', selectedSize);
    console.log('Selected variant:', selectedVariant);
    console.log('Selected variant images:', selectedVariant?.images);
    console.log('Product imageUrl:', prod?.imageUrl);
    console.log('Product images:', prod?.images);
    console.log('Product image:', prod?.image);
    console.log('Product mainImage:', prod?.mainImage);
    console.log('Variant for cart:', variantForCart);
    console.log('Variant for cart images:', variantForCart?.images);
    
    // Add to cart (works for both logged and guest users)
    // Pass product, quantity, and variant separately as expected by CartContext
    try {
      await addToCart(prod, qty, variantForCart, false); // Don't show alert from CartContext
      setInCart(true);
      Alert.alert('Success', 'Product added to cart!');
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to add product to cart');
    }
  };

  // Handle buy now
  const handleBuyNow = async () => {
    if (!prod) return;

    // Check if user is logged in
    if (!user) {
      Alert.alert(
        'Login Required',
        'Please login to proceed with your purchase.',
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

    // Check if variants are required but not selected
    if (availableColors.length > 0 && !selectedColor) {
      setShowColorError(true);
      Alert.alert('Selection Required', 'Please select a color');
      return;
    }

    if (availableSizes.length > 0 && !selectedSize) {
      setShowSizeError(true);
      Alert.alert('Selection Required', 'Please select a size');
      return;
    }

    // Find the selected variant using proper matching functions
    let selectedVariant = null;
    if (prod?.variants && prod.variants.length > 0) {
      if (selectedColor && selectedSize) {
        // Both color and size selected - find exact match
        selectedVariant = prod.variants.find(v =>
          colorMatches(v.color, selectedColor) && sizeMatches(v.size, selectedSize)
        );
      } else if (selectedColor && !selectedSize) {
        // Only color selected - find first variant with that color
        selectedVariant = prod.variants.find(v => colorMatches(v.color, selectedColor));
      } else if (!selectedColor && selectedSize) {
        // Only size selected - find first variant with that size
        selectedVariant = prod.variants.find(v => sizeMatches(v.size, selectedSize));
      }
    }

    if (!selectedVariant && (availableColors.length > 0 || availableSizes.length > 0)) {
      Alert.alert('Selection Required', 'Please select all required options before buying');
      return;
    }

    // Check stock availability
    if (selectedVariant && selectedVariant.stock <= 0) {
      Alert.alert('Out of Stock', 'This variant is currently out of stock');
      return;
    }

    // Prepare the variant object if one is selected
    const variantForCart = selectedVariant ? {
      id: selectedVariant.id,
      color: selectedColor,
      size: selectedSize,
      price: selectedVariant.price,
      mrp: selectedVariant.mrp,
      stock: selectedVariant.stock,
      sku: selectedVariant.sku,
      images: selectedVariant.images || [],
      name: `${selectedColor || ''}${selectedColor && selectedSize ? ' - ' : ''}${selectedSize || ''}`.trim()
    } : null;

    // For Buy Now, navigate to OrderSummaryScreen with the single product
    // This bypasses the cart entirely and handles only the current product
    navigation.navigate('OrderSummary', {
      buyNowProduct: prod,
      buyNowQty: qty,
      selectedVariant: variantForCart
    });
  };

  // Load notification state from storage
  const loadNotificationState = async () => {
    try {
      const productId = prod?.id || productId;
      if (!productId) return;
      
      // Check if user has requested notification for this product
      const notificationKey = `notify_${productId}`;
      const userNotificationKey = user ? `notify_${productId}_${user.id}` : `notify_${productId}_guest`;
      
      const [generalNotification, userNotification] = await Promise.all([
        AsyncStorage.getItem(notificationKey),
        AsyncStorage.getItem(userNotificationKey)
      ]);
      
      const hasNotification = generalNotification === 'true' || userNotification === 'true';
      setIsNotified(hasNotification);
      setNotificationRequested(hasNotification);
    } catch (error) {
      console.log('Error loading notification state:', error);
    }
  };

  // Save notification state to storage
  const saveNotificationState = async () => {
    try {
      const currentProductId = prod?.id || productId;
      if (!currentProductId) return;
      
      const notificationKey = `notify_${currentProductId}`;
      const userNotificationKey = user ? `notify_${currentProductId}_${user.id}` : `notify_${currentProductId}_guest`;
      
      // Save both general and user-specific notification
      await Promise.all([
        AsyncStorage.setItem(notificationKey, 'true'),
        AsyncStorage.setItem(userNotificationKey, 'true')
      ]);
      
      // Also save notification details for potential API sync
      const notificationData = {
        productId: currentProductId,
        productName: prod?.name,
        userId: user?.id || 'guest',
        userEmail: user?.email || null,
        timestamp: new Date().toISOString(),
        isLoggedIn: !!user
      };
      
      await AsyncStorage.setItem(`notify_data_${currentProductId}`, JSON.stringify(notificationData));
    } catch (error) {
      console.log('Error saving notification state:', error);
    }
  };

  // Check if product is back in stock and clear notification if needed
  const checkStockAndClearNotification = async () => {
    try {
      const currentProductId = prod?.id || productId;
      if (!currentProductId) return;
      
      const currentStock = getCurrentStock();
      
      // If product is back in stock and user was notified, clear the notification
      if (currentStock > 0 && (isNotified || notificationRequested)) {
        const notificationKey = `notify_${currentProductId}`;
        const userNotificationKey = user ? `notify_${currentProductId}_${user.id}` : `notify_${currentProductId}_guest`;
        
        await Promise.all([
          AsyncStorage.removeItem(notificationKey),
          AsyncStorage.removeItem(userNotificationKey),
          AsyncStorage.removeItem(`notify_data_${currentProductId}`)
        ]);
        
        setIsNotified(false);
        setNotificationRequested(false);
      }
    } catch (error) {
      console.log('Error checking stock and clearing notification:', error);
    }
  };

  // Handle notify me
  const handleNotifyMe = async () => {
    if (isNotified || notificationRequested) return;
    
    // Check if user is logged in
    if (!user) {
      Alert.alert(
        'Out of Stock - Login Required',
        'While clicked on Notify me you need to login first',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Login', 
            onPress: () => {
              // Save notification request for after login
              setNotificationRequested(true);
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
    
    // Set notification state
    setIsNotified(true);
    setNotificationRequested(true);
    
    // Save to storage
    await saveNotificationState();
    
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
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2874f0']}
            tintColor="#2874f0"
          />
        }
      >
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
                    onError={(error) => {
                      console.log('Image failed to load:', item, error);
                    }}
                    onLoad={() => {
                      console.log('Image loaded successfully:', item);
                    }}
                    resizeMode="contain"
                    onError={(e) => {/* Image load error */ }}
                  />
                  {/* Image counter */}
                  <View style={styles.imageCounter}>
                    <Text style={styles.imageCounterText}>{index + 1} / {getCurrentImages().length}</Text>
                  </View>
                  {/* Zoom indicator */}
                  <TouchableOpacity
                    style={styles.zoomIndicator}
                    onPress={() => {
                      setZoomedImageIndex(index);
                      setZoomLevel(1); // Reset zoom level when opening
                      setZoomModalVisible(true);
                    }}
                  >
                    <Icon name="magnify-plus" size={20} color="#fff" />
                  </TouchableOpacity>

                  {/* Quick zoom preview */}
                  <View style={styles.quickZoomPreview}>
                    <Text style={styles.quickZoomText}>Tap to zoom</Text>
                  </View>
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
                      // Error scrolling to previous image
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
                      // Error scrolling to next image
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


        </SafeAreaView>
        <View style={styles.contentContainer}>
          <Text style={styles.productName}>{prod?.name}</Text>

          {/* Variant Indicator */}
          {(availableColors.length > 0 || availableSizes.length > 0) && (
            <View style={styles.variantIndicator}>
              <Icon name="package-variant" size={16} color="#2e7d32" style={{ marginRight: 6 }} />
              <Text style={styles.variantIndicatorText}>
                {availableColors.length > 0 && availableSizes.length > 0 ?
                  `${availableColors.length} Colors • ${availableSizes.length} Sizes Available` :
                  availableColors.length > 0 ?
                    `${availableColors.length} Colors Available` :
                    `${availableSizes.length} Sizes Available`
                }
              </Text>
            </View>
          )}

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



          {/* Debug Variant Info - Remove in production */}
          {__DEV__ && (
            <View style={styles.debugVariantInfo}>
              <Text style={styles.debugVariantText}>
                Debug: Product has {prod?.variants?.length || 0} variants
              </Text>
              <Text style={styles.debugVariantText}>
                Available Colors: {availableColors.join(', ') || 'None'}
              </Text>
              <Text style={styles.debugVariantText}>
                Available Sizes: {availableSizes.join(', ') || 'None'}
              </Text>
              <Text style={styles.debugVariantText}>
                Selected Color: {selectedColor || 'None'}
              </Text>
              <Text style={styles.debugVariantText}>
                Selected Size: {selectedSize || 'None'}
              </Text>

              {/* Test Variant Processing Button */}
              <TouchableOpacity
                style={styles.debugButton}
                onPress={() => {
                  console.log('=== MANUAL VARIANT TEST ===');
                  console.log('Raw variants data:', prod?.variants);
                  if (prod?.variants && prod.variants.length > 0) {
                    console.log('First variant structure:', prod.variants[0]);
                    console.log('First variant keys:', Object.keys(prod.variants[0]));
                  }
                  processVariants();
                }}
              >
                <Text style={styles.debugButtonText}>Test Variant Processing</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Size Selection - Enhanced like website */}
          {availableSizes.length > 0 && (
            <View style={styles.variantSection}>
              <Text style={styles.variantTitle}>Size</Text>
              <View style={styles.sizeContainer}>
                {availableSizes.map((size) => {
                  // Check if this size is available with the current color selection
                  const isSizeAvailable = !!prod?.variants?.find(v => {
                    if (selectedColor === 'Default') {
                      return sizeMatches(v?.size, size) && typeof v?.stock === 'number' && v.stock > 0;
                    } else {
                      return colorMatches(v?.color, selectedColor) && sizeMatches(v?.size, size) && typeof v?.stock === 'number' && v.stock > 0;
                    }
                  });

                  // Get the actual stock for this size/color combination
                  const variantWithSize = prod?.variants?.find(v => {
                    if (selectedColor === 'Default') {
                      return sizeMatches(v?.size, size);
                    } else {
                      return colorMatches(v?.color, selectedColor) && sizeMatches(v?.size, size);
                    }
                  });

                  const sizeStock = variantWithSize?.stock || 0;
                  const isLowStock = sizeStock > 0 && sizeStock <= 5;

                  return (
                    <TouchableOpacity
                      key={size}
                      style={[
                        styles.sizeOption,
                        selectedSize === size && styles.selectedSizeOption,
                        !isSizeAvailable && { opacity: 0.5 }
                      ]}
                      disabled={!isSizeAvailable}
                      onPress={() => { setSelectedSize(size); setShowSizeError(false); }}
                    >
                      <View style={styles.sizeOptionContent}>
                        <Text style={[
                          styles.sizeName,
                          selectedSize === size && styles.selectedSizeName
                        ]}>
                          {size}
                        </Text>
                        {isLowStock && (
                          <View style={styles.lowStockIndicator} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {showSizeError && (
                <Text style={styles.errorText}>Please select a size</Text>
              )}

              {/* Size Guide Link */}
              <TouchableOpacity style={styles.sizeGuideLink}>
                <Text style={styles.sizeGuideText}>Size Guide</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Color Selection - Enhanced like website */}
          {availableColors.length > 0 && (
            <View style={styles.variantSection}>
              <View style={styles.variantHeader}>
                <Text style={styles.variantTitle}>Color</Text>
                {showColorError && (
                  <View style={styles.errorContainer}>
                    <Icon name="alert" size={16} color="#e53935" />
                    <Text style={styles.errorText}>Please select a color</Text>
                  </View>
                )}
              </View>

              <View style={styles.colorContainer}>
                {availableColors
                  .filter((color) => {
                    // Get variant stock for this color
                    const colorStock = prod?.variants
                      ?.filter(v => colorMatches(v?.color, color) && typeof v?.stock === 'number' && v.stock > 0)
                      ?.reduce((total, v) => total + (v?.stock || 0), 0) || 0;
                    
                    // Only show colors that have stock
                    return colorStock > 0;
                  })
                  .map((color) => {
                    return (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorOption,
                          selectedColor === color && styles.selectedColorOption
                        ]}
                        onPress={() => {
                          setSelectedColor(color);
                          setShowColorError(false);
                          // Reset size when color changes
                          setSelectedSize(null);
                        }}
                      >
                        <View style={styles.colorOptionContent}>
                          <Text style={[
                            styles.colorName,
                            selectedColor === color && styles.selectedColorName
                          ]}>
                            {color}
                          </Text>

                          {/* Selected checkmark */}
                          {selectedColor === color && (
                            <View style={styles.selectedCheckmark}>
                              <Icon name="check" size={12} color="#fff" />
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
              </View>
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



          {/* Enhanced Stock Information - like website */}
          <View style={styles.stockSection}>
            {selectedVariant && typeof selectedVariant.stock === 'number' ? (
              <View style={styles.stockInfoContainer}>
                <View style={[
                  styles.stockIndicator,
                  selectedVariant.stock > 0 ?
                    (selectedVariant.stock <= 5 ? styles.lowStockIndicator : styles.inStockIndicator) :
                    styles.outOfStockIndicator
                ]} />
                <Text style={[
                  styles.stockInfo,
                  selectedVariant.stock > 0 ?
                    (selectedVariant.stock <= 5 ? styles.lowStockText : styles.inStockText) :
                    styles.outOfStockText
                ]}>
                  {selectedVariant.stock > 0 ? (
                    selectedVariant.stock <= 5 ?
                      `Only ${selectedVariant.stock} left in stock` :
                      'In stock'
                  ) : (
                    'Out of stock'
                  )}
                </Text>
                {selectedVariant.sku && (
                  <Text style={styles.skuText}>SKU: {selectedVariant.sku}</Text>
                )}
              </View>
            ) : null}

            {/* Shipping info */}
            {selectedVariant && selectedVariant.stock > 0 && (
              <Text style={styles.shippingInfo}>Usually ships within 1-2 business days</Text>
            )}
          </View>

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

          {/* Expected Delivery Date */}
          {getCurrentStock() > 0 && (
            <View style={styles.deliveryContainer}>
              <Icon name="calendar-clock" size={16} color="#ff9800" style={{ marginRight: 6 }} />
              <Text style={styles.delivery}>Expected delivery: {getTentativeDeliveryDate()}</Text>
            </View>
          )}

          {/* Warranty Information */}
          {prod?.warranty && prod.warranty.trim() !== '' && (
            <View style={styles.warrantyContainer}>
              <Icon name="shield-check" size={16} color="#2196f3" style={{ marginRight: 6 }} />
              <Text style={styles.warrantyText}>Warranty: {prod.warranty}</Text>
            </View>
          )}

          {/* Return Policy - Only show if seller has set a return policy */}
          {prod?.returnPolicy && prod.returnPolicy.trim() !== '' && (
            <View style={styles.returnPolicyContainer}>
              <Icon name="refresh" size={16} color="#388e3c" style={{ marginRight: 6 }} />
              <Text style={styles.returnPolicyText}>{prod.returnPolicy}</Text>
            </View>
          )}

          {/* Shipping Policy */}
          {prod?.shippingPolicy && prod.shippingPolicy.trim() !== '' && (
            <View style={styles.shippingPolicyContainer}>
              <Icon name="truck" size={16} color="#9c27b0" style={{ marginRight: 6 }} />
              <Text style={styles.shippingPolicyText}>Shipping: {prod.shippingPolicy}</Text>
            </View>
          )}

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
              {reviews.length > 0 && (
                <TouchableOpacity onPress={() => setShowAllReviews(!showAllReviews)}>
                  <Text style={styles.viewAllText}>
                    {showAllReviews ? 'Show Less' : `View All (${reviews.length})`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Write Review Button - ensure consistent margins */}
            <TouchableOpacity style={styles.writeReviewBtn} onPress={handleWriteReview}>
              <Icon name="pencil" size={16} color="#fff" />
              <Text style={styles.writeReviewBtnText}>Write Review</Text>
            </TouchableOpacity>

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

            {/* Always show review encouragement message */}
            <View style={styles.reviewEncouragement}>
              <Text style={styles.reviewEncouragementText}>
                Share your experience with this product! Your review helps other customers make informed decisions.
              </Text>
            </View>
          </View>

          {/* Similar Products Section */}
          <View style={[styles.similarSection, { paddingBottom: 100 }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Similar Products</Text>
              {similarProducts.length > 0 && (
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => {
                    try {
                      setShowAllSimilar(!showAllSimilar);
                    } catch (error) {
                      console.error('Error toggling similar products view:', error);
                    }
                  }}
                >
                  <Text style={styles.viewAllText}>
                    {showAllSimilar ? 'Show Less' : 'View All'}
                  </Text>
                  {!showAllSimilar && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>{similarProducts.length}</Text>
                    </View>
                  )}
                  <Icon
                    name={showAllSimilar ? "chevron-up" : "chevron-right"}
                    size={16}
                    color="#2874f0"
                    style={styles.viewAllIcon}
                  />
                </TouchableOpacity>
              )}
            </View>

            {similarLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading similar products...</Text>
              </View>
            ) : (Array.isArray(similarProducts) && similarProducts.length > 0) ? (
              <>
                <Text style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
                  Found {similarProducts.length} similar products
                </Text>
                {showAllSimilar ? (
                  // List view - use regular View to avoid nested VirtualizedList error
                  <View style={styles.similarProductsListView}>
                    {similarProducts.map((item, index) => (
                      <TouchableOpacity
                        key={`similar-list-${item.id || index}`}
                        style={styles.similarProductItemList}
                        onPress={() => {
                          try {
                            navigation.push('ProductDetail', { product: item });
                          } catch (error) {
                            console.error('Navigation error:', error);
                            navigation.navigate('ProductDetail', { product: item });
                          }
                        }}
                      >
                        <Image
                          source={{ uri: item.imageUrl || item.image_url || 'https://placehold.co/100x100?text=No+Image' }}
                          style={styles.similarProductImageList}
                          resizeMode="cover"
                          onError={(e) => {
                            console.log('Similar product image failed to load:', item.imageUrl || item.image_url);
                          }}
                        />
                        <View style={styles.similarProductInfoList}>
                          <Text style={[styles.similarProductName, styles.similarProductNameList]} numberOfLines={2}>
                            {item.name || 'Product Name'}
                          </Text>
                          <Text style={[styles.similarProductPrice, styles.similarProductPriceList]}>
                            ₹{item.price || item.mrp || '0'}
                          </Text>
                          <View style={styles.similarProductRating}>
                            {renderStars(item.rating || 0)}
                            <Text style={styles.similarProductRatingText}>
                              {item.ratingCount || 0}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  // Horizontal scroll view - use FlatList for horizontal scrolling
                  <FlatList
                    data={similarProducts.slice(0, 4)}
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item, index) => `similar-horizontal-${item.id || index}`}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.similarProductItem}
                        onPress={() => {
                          try {
                            navigation.push('ProductDetail', { product: item });
                          } catch (error) {
                            console.error('Navigation error:', error);
                            navigation.navigate('ProductDetail', { product: item });
                          }
                        }}
                      >
                        <Image
                          source={{ uri: item.imageUrl || item.image_url || 'https://placehold.co/100x100?text=No+Image' }}
                          style={styles.similarProductImage}
                          resizeMode="cover"
                          onError={(e) => {
                            console.log('Similar product image failed to load:', item.imageUrl || item.image_url);
                          }}
                        />
                        <View style={styles.similarProductInfo}>
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
                        </View>
                      </TouchableOpacity>
                    )}
                    contentContainerStyle={[styles.similarProductsList, { paddingBottom: 20 }]}
                    style={{ paddingHorizontal: 16 }}
                  />
                )}
              </>
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
        {/* Guest User Message */}
        {!user && (
          <View style={styles.guestUserMessage}>
            <Icon name="information" size={16} color="#2874f0" />
            <Text style={styles.guestUserMessageText}>
              You can add items to cart without logging in. Login to save your cart and complete purchases.
            </Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          {/* Add to Cart / Go to Cart */}
          {getCurrentStock() > 0 ? (
            <View style={styles.cartButtonContainer}>
              <TouchableOpacity
                style={[styles.addToCartBtn, { backgroundColor: '#4caf50' }]}
                onPress={handleAddToCart}
              >
                <Icon name="cart-plus" size={20} color="#fff" />
                <Text style={styles.addToCartBtnText}>Add to Cart</Text>
              </TouchableOpacity>

              {/* Show Go to Cart button if any variant of this product is in cart */}
              {cartItems.some(item => item.productId === prod.id) && (
                <TouchableOpacity
                  style={[styles.addToCartBtn, { backgroundColor: '#2874f0', marginLeft: 8, flex: 0.6 }]}
                  onPress={() => navigation.navigate('MainTabs', { screen: 'Cart' })}
                >
                  <Icon name="cart" size={20} color="#fff" />
                  <Text style={styles.addToCartBtnText}>Go to Cart</Text>
                </TouchableOpacity>
              )}

              {/* Guest user info for cart */}
              {!user && !inCart && (
                <TouchableOpacity
                  style={styles.cartInfoButton}
                  onPress={() => {
                    Alert.alert(
                      'Guest Cart',
                      'You can add items to cart without logging in. Your cart will be saved locally and merged with your account when you login.',
                      [{ text: 'Got it!', style: 'default' }]
                    );
                  }}
                >
                  <Icon name="information" size={16} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.addToCartBtn, { backgroundColor: (isNotified || notificationRequested) ? '#9e9e9e' : '#ff9800' }]}
              onPress={handleNotifyMe}
              disabled={isNotified || notificationRequested}
            >
              <Icon name={(isNotified || notificationRequested) ? 'check' : 'bell'} size={20} color="#fff" />
              <Text style={styles.addToCartBtnText}>
                {(isNotified || notificationRequested) ? 'Notified' : 'Notify Me'}
              </Text>
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

      {/* Advanced Zoom Modal with Pinch-to-Zoom */}
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

            {/* Zoom Instructions */}
            <View style={styles.zoomInstructions}>
              <Text style={styles.zoomInstructionsText}>
                Tap image to toggle zoom • Use +/- buttons • Drag to pan
              </Text>
            </View>

            {/* Zoom Controls */}
            <View style={styles.zoomControls}>
              <TouchableOpacity
                style={styles.zoomControlBtn}
                onPress={() => setZoomLevel(Math.max(1, zoomLevel - 0.5))}
              >
                <Icon name="minus" size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.zoomLevelText}>{zoomLevel.toFixed(1)}x</Text>
              <TouchableOpacity
                style={styles.zoomControlBtn}
                onPress={() => setZoomLevel(Math.min(5, zoomLevel + 0.5))}
              >
                <Icon name="plus" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.zoomControlBtn}
                onPress={() => setZoomLevel(1)}
              >
                <Text style={styles.resetZoomText}>Reset</Text>
              </TouchableOpacity>
            </View>

            {/* Large Zoom Level Indicator */}
            <View style={[
              styles.largeZoomIndicator,
              { opacity: zoomLevel > 1 ? 1 : 0 }
            ]}>
              <Text style={styles.largeZoomText}>{zoomLevel.toFixed(1)}x</Text>
            </View>

            {/* Advanced Zoomed Image with Pan */}
            <ScrollView
              style={styles.zoomScrollView}
              contentContainerStyle={styles.zoomScrollContent}
              maximumZoomScale={5}
              minimumZoomScale={1}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              bounces={false}
              bouncesZoom={false}
              onMomentumScrollEnd={() => { }}
              scrollEventThrottle={16}
            >
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => {
                  // Double tap to toggle between 1x and 2x zoom
                  if (zoomLevel === 1) {
                    setZoomLevel(2);
                  } else if (zoomLevel === 2) {
                    setZoomLevel(1);
                  } else {
                    setZoomLevel(1);
                  }
                }}
                style={styles.zoomImageTouchable}
              >
                <Image
                  source={{ uri: getCurrentImages()[zoomedImageIndex] }}
                  style={[
                    styles.zoomedImage,
                    {
                      transform: [{ scale: zoomLevel }],
                      width: width * 0.9,
                      height: 500 * zoomLevel
                    }
                  ]}
                  resizeMode="contain"
                  onError={(error) => {
                    // Zoom image load error
                  }}
                />
              </TouchableOpacity>
            </ScrollView>

            {/* Image Navigation in Zoom Mode */}
            {getCurrentImages().length > 1 && (
              <View style={styles.zoomImageNavigation}>
                <TouchableOpacity
                  style={styles.zoomNavBtn}
                  onPress={() => {
                    const newIndex = zoomedImageIndex > 0 ? zoomedImageIndex - 1 : getCurrentImages().length - 1;
                    setZoomedImageIndex(newIndex);
                    setZoomLevel(1); // Reset zoom when changing image
                  }}
                >
                  <Icon name="chevron-left" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.zoomImageCounter}>
                  {zoomedImageIndex + 1} / {getCurrentImages().length}
                </Text>
                <TouchableOpacity
                  style={styles.zoomNavBtn}
                  onPress={() => {
                    const newIndex = zoomedImageIndex < getCurrentImages().length - 1 ? zoomedImageIndex + 1 : 0;
                    setZoomedImageIndex(newIndex);
                    setZoomLevel(1); // Reset zoom when changing image
                  }}
                >
                  <Icon name="chevron-right" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerSafeArea: { backgroundColor: 'transparent' },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
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
    maxHeight: 560,
    backgroundColor: '#fff',
  },
  imageContainer: {
    position: 'relative',
    width: width,
    height: 560,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  productImage: {
    width: width * 0.98,
    height: 520,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
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
  quickZoomPreview: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  quickZoomText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
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
  cartButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4caf50',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginHorizontal: 8,
    minWidth: 140,
  },
  addToCartBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cartInfoButton: {
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
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
  variantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  colorOption: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    position: 'relative',
    minWidth: 80,
    alignItems: 'center',
    marginHorizontal: 6,
    marginVertical: 8,
  },
  selectedColorOption: {
    borderColor: '#2874f0',
    backgroundColor: '#2874f0',
  },
  outOfStockColorOption: {
    opacity: 0.6,
    backgroundColor: '#f5f5f5',
  },
  colorOptionContent: {
    alignItems: 'center',
    position: 'relative',
  },
  colorName: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  selectedColorName: {
    color: '#fff',
    fontWeight: 'bold',
  },
  outOfStockColorName: {
    color: '#999',
  },
  selectedCheckmark: {
    position: 'absolute',
    top: -8,
    left: -8,
    backgroundColor: '#2874f0',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },


  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  outOfStockText: {
    color: '#e53935',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
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
  sizeOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  lowStockIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    backgroundColor: '#f59e0b',
    borderRadius: 4,
  },
  sizeGuideLink: {
    marginTop: 8,
  },
  sizeGuideText: {
    fontSize: 12,
    color: '#2874f0',
    textDecorationLine: 'underline',
  },
  errorText: {
    color: '#e53935',
    fontSize: 12,
    marginTop: 4,
  },
  stockSection: {
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  stockInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stockIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  inStockIndicator: {
    backgroundColor: '#4caf50',
  },
  lowStockIndicator: {
    backgroundColor: '#f59e0b',
  },
  outOfStockIndicator: {
    backgroundColor: '#f44336',
  },
  stockInfo: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  inStockText: {
    color: '#4caf50',
    fontWeight: 'bold',
  },
  lowStockText: {
    color: '#f59e0b',
    fontWeight: 'bold',
  },
  outOfStockText: {
    color: '#f44336',
    fontWeight: 'bold'
  },
  skuText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 'auto',
  },

  selectOptionsText: {
    color: '#666',
    fontSize: 14,
  },
  shippingInfo: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },

  disabledBtn: {
    backgroundColor: '#ccc',
    opacity: 0.6
  },

  // New styles for bottom bar
  bottomBar: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  guestUserMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#2196f3',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 16,
    marginBottom: 8,
  },
  guestUserMessageText: {
    color: '#1976d2',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2874f0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    justifyContent: 'center',
    minWidth: 120,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  descriptionContainer: {
    marginBottom: 16,
    paddingHorizontal: 18,
  },
  descriptionText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
    textAlign: 'left',
    textAlignVertical: 'top',
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
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    flex: 1,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#2874f0',
    alignSelf: 'center',
    marginRight: 20,
    shadowColor: '#2874f0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  viewAllText: {
    color: '#2874f0',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 4,
  },
  viewAllIcon: {
    marginLeft: 2,
  },
  countBadge: {
    backgroundColor: '#2874f0',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    marginRight: 2,
  },
  countBadgeText: {
    color: '#fff',
    fontSize: 11,
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
    marginBottom: 20,
  },
  similarProductsList: {
    paddingVertical: 5,
  },
  similarProductsGrid: {
    paddingHorizontal: 4,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  similarProductsListView: {
    paddingHorizontal: 16,
  },
  similarProductItem: {
    width: width * 0.42,
    marginHorizontal: 6,
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  similarProductItemGrid: {
    width: (width - 40) / 2,
    marginHorizontal: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 4,
  },
  similarProductItemList: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 6,
    marginHorizontal: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  similarProductImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#f8f8f8',
    resizeMode: 'cover',
  },
  similarProductImageList: {
    width: 80,
    height: 80,
    backgroundColor: '#f8f8f8',
    resizeMode: 'cover',
    borderRadius: 8,
    marginRight: 12,
  },
  similarProductInfo: {
    flex: 1,
  },
  similarProductInfoList: {
    flex: 1,
    justifyContent: 'space-between',
  },
  similarProductName: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 8,
    lineHeight: 18,
  },
  similarProductPrice: {
    fontSize: 15,
    color: '#2874f0',
    fontWeight: 'bold',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  similarProductNameList: {
    fontSize: 14,
    marginTop: 0,
    marginBottom: 4,
    paddingHorizontal: 0,
    lineHeight: 20,
  },
  similarProductPriceList: {
    fontSize: 16,
    marginBottom: 4,
    paddingHorizontal: 0,
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
    alignSelf: 'flex-start',
    marginBottom: 16,
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

  debugVariantInfo: {
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffeaa7',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  debugVariantText: {
    fontSize: 11,
    color: '#856404',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  debugButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  returnPolicyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  returnPolicyText: {
    color: '#333333',
    fontSize: 14,
    fontWeight: '600',
  },
  warrantyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#bbdefb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  warrantyText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '600',
  },
  shippingPolicyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3e5f5',
    borderWidth: 1,
    borderColor: '#e1bee7',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  shippingPolicyText: {
    color: '#7b1fa2',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewEncouragement: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
  },
  reviewEncouragementText: {
    color: '#495057',
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // New styles for advanced zoom modal
  zoomModalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  zoomModalContent: {
    backgroundColor: '#000',
    borderRadius: 10,
    width: '95%',
    height: '90%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  closeZoomButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    padding: 8,
  },
  zoomInstructions: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  zoomInstructionsText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  zoomControls: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  zoomControlBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 8,
    marginHorizontal: 4,
  },
  zoomLevelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginHorizontal: 12,
    minWidth: 30,
    textAlign: 'center',
  },
  resetZoomText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  zoomScrollView: {
    flex: 1,
    width: '100%',
  },
  zoomScrollContent: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  zoomedImage: {
    borderRadius: 10,
  },
  zoomImageTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeZoomIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -30 }, { translateY: -25 }],
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 5,
  },
  largeZoomText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  zoomImageNavigation: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  zoomNavBtn: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    padding: 8,
    marginHorizontal: 8,
  },
  zoomImageCounter: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});