import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  SafeAreaView,
  Modal,
  Dimensions,
  Alert,
  Image
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { API_BASE } from '../lib/api';

const { width, height } = Dimensions.get('window');

const FullScreenSearch = ({ 
  visible,
  onClose,
  onProductSelect,
  products = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [visible]);

  // Handle search query changes for suggestions
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      // Show suggestions based on local products
      const localSuggestions = products
        .filter(product => {
          const name = product.name || product.title || '';
          return name.toLowerCase().includes(searchQuery.toLowerCase());
        })
        .slice(0, 5);
      
      setSuggestions(localSuggestions);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, products]);

  const loadRecentSearches = () => {
    try {
      // In a real app, use AsyncStorage
      const stored = localStorage?.getItem?.('lelekart_recent_searches');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.log('No recent searches found');
    }
  };

  const saveRecentSearch = (searchTerm) => {
    try {
      const updated = [
        searchTerm, 
        ...recentSearches.filter(term => term !== searchTerm)
      ].slice(0, 5);
      
      setRecentSearches(updated);
      localStorage?.setItem?.('lelekart_recent_searches', JSON.stringify(updated));
    } catch (error) {
      console.log('Error saving recent search');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setShowResults(true);
    setShowSuggestions(false);
    saveRecentSearch(searchQuery.trim());

    try {
      // Search in local products first
      const localResults = products.filter(product => {
        const name = product.name || product.title || '';
        return name.toLowerCase().includes(searchQuery.toLowerCase());
      });

      setSearchResults(localResults);

      // Also try API search
      const response = await fetch(`${API_BASE}/api/lelekart-search?q=${encodeURIComponent(searchQuery)}&limit=20`);
      if (response.ok) {
        const apiResults = await response.json();
        // Merge API results with local results, avoiding duplicates
        const mergedResults = [...localResults];
        apiResults.forEach(apiProduct => {
          if (!mergedResults.find(localProduct => localProduct.id === apiProduct.id)) {
            mergedResults.push(apiProduct);
          }
        });
        setSearchResults(mergedResults);
      }
    } catch (error) {
      console.log('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionPress = (suggestion) => {
    setSearchQuery(suggestion);
    handleSearch();
  };

  const handleProductSelect = (product) => {
    onProductSelect && onProductSelect(product);
    onClose();
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
    setSearchResults([]);
    setShowResults(false);
    setShowSuggestions(false);
  };

  const renderSearchResult = ({ item }) => {
    // Get the best available image
    const getProductImage = () => {
      if (item.imageUrl && item.imageUrl.includes('http')) {
        return item.imageUrl;
      }
      if (item.images && Array.isArray(item.images) && item.images.length > 0) {
        return item.images[0];
      }
      if (item.image_url && item.image_url.includes('http')) {
        return item.image_url;
      }
      return 'https://placehold.co/80x80?text=No+Image';
    };

    return (
      <TouchableOpacity 
        style={styles.searchResultItem}
        onPress={() => handleProductSelect(item)}
      >
        <Image 
          source={{ uri: getProductImage() }} 
          style={styles.productImage}
          resizeMode="cover"
        />
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name || item.title}
          </Text>
          <Text style={styles.productPrice}>
            ₹{item.price || item.mrp || '0'}
          </Text>
          {item.category && (
            <Text style={styles.productCategory}>{item.category}</Text>
          )}
          {item.sellerName && (
            <Text style={styles.productSeller}>by {item.sellerName}</Text>
          )}
        </View>
        <Icon name="chevron-right" size={20} color="#666" />
      </TouchableOpacity>
    );
  };

  const renderRecentSearch = ({ item }) => (
    <TouchableOpacity 
      style={styles.recentSearchItem}
      onPress={() => handleSuggestionPress(item)}
    >
      <Icon name="history" size={20} color="#666" />
      <Text style={styles.recentSearchText}>{item}</Text>
    </TouchableOpacity>
  );

  const renderSuggestion = ({ item }) => {
    const getProductImage = () => {
      if (item.imageUrl && item.imageUrl.includes('http')) {
        return item.imageUrl;
      }
      if (item.images && Array.isArray(item.images) && item.images.length > 0) {
        return item.images[0];
      }
      if (item.image_url && item.image_url.includes('http')) {
        return item.image_url;
      }
      return 'https://placehold.co/60x60?text=No+Image';
    };

    return (
      <TouchableOpacity 
        style={styles.suggestionItem}
        onPress={() => handleProductSelect(item)}
      >
        <Image 
          source={{ uri: getProductImage() }} 
          style={styles.suggestionImage}
          resizeMode="cover"
        />
        <View style={styles.suggestionInfo}>
          <Text style={styles.suggestionName} numberOfLines={1}>
            {item.name || item.title}
          </Text>
          <Text style={styles.suggestionPrice}>
            ₹{item.price || item.mrp || '0'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          
          <View style={styles.searchContainer}>
            <Icon name="magnify" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Search for products..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <Icon name="close" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {showSuggestions && suggestions.length > 0 ? (
            // Search suggestions
            <View style={styles.suggestionsContainer}>
              <Text style={styles.sectionTitle}>Search Suggestions</Text>
              <FlatList
                data={suggestions}
                renderItem={renderSuggestion}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                showsVerticalScrollIndicator={false}
              />
            </View>
          ) : !showResults ? (
            // Recent searches and categories
            <View style={styles.suggestionsContainer}>
              {recentSearches.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Recent Searches</Text>
                  <FlatList
                    data={recentSearches}
                    renderItem={renderRecentSearch}
                    keyExtractor={(item, index) => `recent-${index}`}
                    scrollEnabled={false}
                  />
                </View>
              )}
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Popular Categories</Text>
                <View style={styles.categoriesGrid}>
                  {['Electronics', 'Fashion', 'Home', 'Beauty', 'Sports', 'Books'].map((category) => (
                    <TouchableOpacity 
                      key={category}
                      style={styles.categoryItem}
                      onPress={() => handleSuggestionPress(category)}
                    >
                      <Text style={styles.categoryText}>{category}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          ) : (
            // Search results
            <View style={styles.resultsContainer}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Searching...</Text>
                </View>
              ) : searchResults.length > 0 ? (
                <FlatList
                  data={searchResults}
                  renderItem={renderSearchResult}
                  keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <View style={styles.noResultsContainer}>
                  <Icon name="magnify" size={48} color="#ddd" />
                  <Text style={styles.noResultsText}>No products found</Text>
                  <Text style={styles.noResultsSubtext}>Try different keywords</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  suggestionsContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recentSearchText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: (width - 48) / 2,
    backgroundColor: '#f5f5f5',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  resultsContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f5f5f5',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2874f0',
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 12,
    color: '#666',
  },
  productSeller: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: '#f5f5f5',
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  suggestionPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2874f0',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default FullScreenSearch;
