import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import VoiceSearch from './VoiceSearch';

const EnhancedSearchBox = ({ 
  placeholder = "What do you want to shop for today?",
  value,
  onChangeText,
  onSubmit,
  style,
  containerStyle
}) => {
  const [isListening, setIsListening] = useState(false);

  const handleVoiceResult = (recognizedText) => {
    console.log('Voice search result:', recognizedText);
    onChangeText(recognizedText);
    
    // Optionally trigger search immediately after voice input
    if (onSubmit) {
      onSubmit();
    }
  };

  const handleSearchPress = () => {
    if (onSubmit) {
      onSubmit();
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.searchBar, style]}>
        <TouchableOpacity onPress={handleSearchPress}>
          <Icon name="magnify" size={22} color="#b6b1a9" style={styles.searchIcon} />
        </TouchableOpacity>
        
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor="#b6b1a9"
          value={value}
          onChangeText={onChangeText}
          returnKeyType="search"
          onSubmitEditing={handleSearchPress}
        />
        
        <VoiceSearch
          onVoiceResult={handleVoiceResult}
          isListening={isListening}
          setIsListening={setIsListening}
          style={styles.voiceButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
  },
  voiceButton: {
    marginLeft: 8,
  },
});

export default EnhancedSearchBox; 