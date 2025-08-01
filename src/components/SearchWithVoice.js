import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import VoiceSearch from './VoiceSearch';

// This component shows how to integrate voice search into your existing HomeTab search
const SearchWithVoice = ({ search, setSearch, onSearchPress, onCameraPress }) => {
  const [isListening, setIsListening] = useState(false);

  const handleVoiceResult = (recognizedText) => {
    console.log('Voice search result:', recognizedText);
    setSearch(recognizedText);
    
    // Optionally trigger search immediately after voice input
    if (onSearchPress) {
      onSearchPress();
    }
  };

  return (
    <View style={styles.searchBarRow}>
      <TouchableOpacity onPress={onSearchPress}>
        <Icon name="magnify" size={22} color="#b6b1a9" style={{ marginLeft: 12, marginRight: 6 }} />
      </TouchableOpacity>
      
      <TextInput
        style={styles.searchBar}
        placeholder="What do you want to shop for today?"
        placeholderTextColor="#b6b1a9"
        value={search}
        onChangeText={setSearch}
        returnKeyType="search"
        onSubmitEditing={onSearchPress}
      />
      
      {/* Voice Search Button */}
      <VoiceSearch
        onVoiceResult={handleVoiceResult}
        isListening={isListening}
        setIsListening={setIsListening}
        style={styles.voiceButton}
      />
      
      <TouchableOpacity style={styles.headerIconBtn} onPress={onCameraPress}>
        <Icon name="camera-outline" size={22} color="#b6b1a9" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchBar: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
  },
  headerIconBtn: {
    padding: 8,
  },
  voiceButton: {
    marginLeft: 8,
    marginRight: 8,
  },
});

export default SearchWithVoice; 