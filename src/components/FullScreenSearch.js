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
import VoiceSearch from './VoiceSearch';

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
  const [isListening, setIsListening] = useState(false);
  
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
      const query = searchQuery.toLowerCase().trim();
      
      // Enhanced search with multiple matching strategies
      const searchInProducts = (productList) => {
        const exactMatches = [];
        const partialMatches = [];
        const fuzzyMatches = [];
        const broadMatches = [];
        
        productList.forEach(product => {
          // Get all searchable text fields
          const name = (product.name || product.title || '').toLowerCase();
          const category = (product.category || '').toLowerCase();
          const description = (product.description || '').toLowerCase();
          const seller = (product.sellerName || product.seller?.name || '').toLowerCase();
          const brand = (product.brand || '').toLowerCase();
          const tags = (product.tags || '').toLowerCase();
          
          // Create a combined search string for broader matching
          const allText = `${name} ${category} ${description} ${seller} ${brand} ${tags}`.toLowerCase();
          
          // Exact name match (highest priority)
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
          // Broad text search - search in all combined text
          else if (allText.includes(query)) {
            broadMatches.push(product);
          }
          // Word-by-word matching with more flexible criteria
          else {
            const queryWords = query.split(/\s+/).filter(word => word.length > 1); // Reduced from 2 to 1
            const allWords = allText.split(/\s+/);
            
            // Check for partial word matches
            const hasWordMatch = queryWords.some(queryWord => 
              allWords.some(textWord => {
                // Exact word match
                if (textWord === queryWord) return true;
                // Word contains query word
                if (textWord.includes(queryWord)) return true;
                // Query word contains text word (for shorter words)
                if (queryWord.includes(textWord) && textWord.length > 2) return true;
                // Fuzzy matching for similar words (simple character overlap)
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
        
        // Combine results with priority order
        return [...exactMatches, ...partialMatches, ...fuzzyMatches, ...broadMatches];
      };

      // Search in local products first
      let localResults = searchInProducts(products);

      // Try multiple API search endpoints
      let apiResults = [];
      try {
        // Try the main search endpoint
        let response = await fetch(`${API_BASE}/api/lelekart-search?q=${encodeURIComponent(searchQuery)}&limit=20`);
        if (response.ok) {
          apiResults = await response.json();
        }
        
        // If no results, try alternative search endpoints
        if (!apiResults || apiResults.length === 0) {
          // Try products endpoint with search
          response = await fetch(`${API_BASE}/api/products?search=${encodeURIComponent(searchQuery)}&limit=20`);
          if (response.ok) {
            const data = await response.json();
            apiResults = Array.isArray(data) ? data : (data.products || data.data || []);
          }
        }
        
        // If still no results, try a broader search
        if (!apiResults || apiResults.length === 0) {
          // Try searching with individual words
          const words = searchQuery.split(' ').filter(word => word.length > 2);
          for (const word of words) {
            response = await fetch(`${API_BASE}/api/products?search=${encodeURIComponent(word)}&limit=10`);
            if (response.ok) {
              const data = await response.json();
              const wordResults = Array.isArray(data) ? data : (data.products || data.data || []);
              apiResults = [...apiResults, ...wordResults];
              if (apiResults.length >= 10) break; // Stop if we have enough results
            }
          }
        }
        
      } catch (error) {
        console.log('API search error:', error);
      }

      // Enhanced API results search
      const enhancedApiResults = searchInProducts(apiResults);

      // Merge results, avoiding duplicates
      const mergedResults = [...localResults];
      enhancedApiResults.forEach(apiProduct => {
        if (!mergedResults.find(localProduct => localProduct.id === apiProduct.id)) {
          mergedResults.push(apiProduct);
        }
      });

      // If still no results, show popular/random products as fallback
      if (mergedResults.length === 0) {
        const fallbackProducts = products
          .filter(product => product.name && product.price)
          .sort(() => Math.random() - 0.5) // Randomize
          .slice(0, 10); // Show 10 random products
        
        setSearchResults(fallbackProducts);
      } else {
        setSearchResults(mergedResults.slice(0, 20)); // Limit to 20 results
      }

    } catch (error) {
      console.log('Search error:', error);
      // Even on error, show some products as fallback
      const fallbackProducts = products
        .filter(product => product.name && product.price)
        .slice(0, 8);
      setSearchResults(fallbackProducts);
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

  const handleVoiceResult = (text) => {
    setSearchQuery(text);
    handleSearch();
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
            <VoiceSearch
              onVoiceResult={handleVoiceResult}
              isListening={isListening}
              setIsListening={setIsListening}
              style={styles.voiceButton}
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
              ) : (
                <>
                  {searchResults.length > 0 && (
                    <View style={styles.resultsHeader}>
                      <Text style={styles.resultsHeaderText}>
                        {searchResults.some(product => {
                          const name = (product.name || product.title || '').toLowerCase();
                          return name.includes(searchQuery.toLowerCase());
                        }) ? `Found ${searchResults.length} products` : 'Showing related products'}
                      </Text>
                    </View>
                  )}
                  <FlatList
                    data={searchResults}
                    renderItem={renderSearchResult}
                    keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                    showsVerticalScrollIndicator={false}
                  />
                </>
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
    color: '#000',
  },
  clearButton: {
    padding: 4,
  },
  voiceButton: {
    marginLeft: 8,
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
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  resultsHeaderText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
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
