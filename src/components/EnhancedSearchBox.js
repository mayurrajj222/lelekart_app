import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { API_BASE } from '../lib/api';

const EnhancedSearchBox = ({ 
  value,
  onChangeText,
  onSubmit,
  style,
  containerStyle,
  products = [],
  onSuggestionsChange
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  
  const debounceRef = useRef(null);
  const RECENT_SEARCHES_KEY = 'lelekart_recent_searches';

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = () => {
    try {
      // For React Native, we'll use AsyncStorage or keep in memory for now
      // In a real app, you'd use AsyncStorage.getItem(RECENT_SEARCHES_KEY)
      const stored = localStorage?.getItem?.(RECENT_SEARCHES_KEY);
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
      ].slice(0, 5); // Keep only 5 recent searches
      
      setRecentSearches(updated);
      // In a real app: AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      localStorage?.setItem?.(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.log('Error saving recent search');
    }
  };

  const getProductDisplayName = (p) => {
    if (!p) return '';
    return p.title || p.name || p.productName || p.slug || p.label || '';
  };

  // Only show suggestions when search is pressed, not while typing
  const handleSearchPress = () => {
    if (value.trim()) {
      // Show suggestions only when search is pressed
      const query = value.trim().toLowerCase();
      const localMatches = Array.isArray(products)
        ? products
            .filter(p => {
              const name = getProductDisplayName(p);
              return name.toLowerCase().includes(query);
            })
            .slice(0, 4) // Limit to 4 suggestions
        : [];

      setSuggestions(localMatches);
      const shouldShow = localMatches.length > 0;
      setShowSuggestions(shouldShow);
      onSuggestionsChange && onSuggestionsChange(shouldShow);
      
      saveRecentSearch(value.trim());
      // Don't call onSubmit here - let user select from suggestions or press search again
    } else {
      // If search is empty, clear and return to home
      clearSearch();
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    // When suggestion is selected, navigate to that product
    if (onSubmit) {
      // Set the search text to the selected product name
      onChangeText && onChangeText(getProductDisplayName(suggestion));
      // Navigate to the product
      onSubmit();
    }
  };

  const clearSearch = () => {
    onChangeText && onChangeText('');
    setSuggestions([]);
    setShowSuggestions(false);
    onSuggestionsChange && onSuggestionsChange(false);
    // Trigger navigation back to home if we're in search mode
    if (onSubmit) {
      // Small delay to ensure state updates before navigation
      setTimeout(() => {
      onSubmit();
      }, 100);
    }
  };

  const renderSuggestionItem = ({ item, index }) => {
    if (typeof item === 'string') {
      // Recent search suggestion (string)
      return (
        <TouchableOpacity 
          style={styles.suggestionItem} 
          onPress={() => handleSelectSuggestion(item)}
        >
          <Icon name="history" size={16} color="#666" />
          <Text style={styles.suggestionText}>{item}</Text>
        </TouchableOpacity>
      );
    }

    // Product suggestion (object)
    const imageUrl = item.imageUrl || (Array.isArray(item.images) ? item.images[0] : null);
    const price = item.price || 0;
    const category = item.category || '';

    return (
      <TouchableOpacity 
        style={styles.productSuggestionItem} 
        onPress={() => handleSelectSuggestion(item)}
      >
        {imageUrl && (
          <View style={styles.productImageContainer}>
            <Text style={styles.productImagePlaceholder}>📦</Text>
          </View>
        )}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>
            {getProductDisplayName(item)}
          </Text>
          {category && (
            <Text style={styles.productCategory} numberOfLines={1}>
              in {category}
            </Text>
          )}
        </View>
        <Text style={styles.productPrice}>₹{price}</Text>
      </TouchableOpacity>
    );
  };

  const renderRecentSearches = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Icon name="history" size={16} color="#666" />
        <Text style={styles.sectionTitle}>Recent Searches</Text>
      </View>
      {recentSearches.map((term, index) => (
        <TouchableOpacity 
          key={`recent-${index}`}
          style={styles.suggestionItem} 
          onPress={() => handleSelectSuggestion(term)}
        >
          <Icon name="history" size={16} color="#666" />
          <Text style={styles.suggestionText}>{term}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.searchBar, style]}>
        <TouchableOpacity onPress={handleSearchPress} style={styles.searchIconContainer}>
          <Icon name="magnify" size={20} color="#b6b1a9" />
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for products, brands and more"
          placeholderTextColor="#b6b1a9"
          value={value}
          onChangeText={(text) => {
            onChangeText && onChangeText(text);
            // Don't show suggestions while typing - only when search button is pressed
            setShowSuggestions(false);
            onSuggestionsChange && onSuggestionsChange(false);
          }}
          returnKeyType="search"
          onSubmitEditing={handleSearchPress}
          onFocus={() => {
            // Show recent searches on focus if there's no text
            if (!value.trim()) {
              setSuggestions(recentSearches);
              setShowSuggestions(recentSearches.length > 0);
              onSuggestionsChange && onSuggestionsChange(recentSearches.length > 0);
            }
          }}
          onBlur={() => {
            // Small delay so onPress can register before hiding
            setTimeout(() => setShowSuggestions(false), 150);
          }}
        />
        
        {value && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Icon name="close" size={18} color="#b6b1a9" />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && (
        <View style={styles.suggestionsContainer}>
          {loading && (
            <View style={styles.loadingContainer}>
              <Icon name="progress-clock" size={20} color="#2874f0" />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          )}

          {!loading && suggestions.length > 0 && (
            <View>
              {/* Show recent searches if no search query */}
              {!value.trim() && recentSearches.length > 0 && renderRecentSearches()}
              
              {/* Show product suggestions if there's a search query */}
              {value.trim() && (
                <View style={styles.productsSection}>
                  <View style={styles.sectionHeader}>
                    <Icon name="package-variant" size={16} color="#666" />
                    <Text style={styles.sectionTitle}>Products</Text>
                  </View>
                  <FlatList
                    data={suggestions}
                    keyExtractor={(item, index) => `suggestion-${index}`}
                    renderItem={renderSuggestionItem}
                    keyboardShouldPersistTaps="handled"
                    scrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                    style={styles.suggestionsList}
        />
      </View>
              )}
            </View>
          )}

          {!loading && suggestions.length === 0 && value.trim().length > 0 && (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No products found</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3ede6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#b6b1a9',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  searchIconContainer: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#3d3a36',
    fontFamily: 'serif',
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 6,
    maxHeight: 300,
    zIndex: 9999,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  sectionContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f8f8',
  },
  sectionTitle: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    marginLeft: 12,
    fontSize: 15,
    color: '#333',
  },
  productSuggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  productImagePlaceholder: {
    fontSize: 20,
  },
  productInfo: {
    flex: 1,
    marginRight: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 12,
    color: '#666',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2874f0',
  },
  noResultsContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: '#666',
  },
  productsSection: {
    // Add specific styles for the products section if needed
  },
  suggestionsList: {
    // Add specific styles for the suggestions list if needed
  },
});

export default EnhancedSearchBox; 