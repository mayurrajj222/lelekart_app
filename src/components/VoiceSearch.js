import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, Alert, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Voice from '@react-native-voice/voice';

const VoiceSearch = ({ onVoiceResult, isListening, setIsListening, style }) => {
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    // Initialize voice recognition
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechPartialResults = onSpeechPartialResults;

    return () => {
      // Cleanup
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const onSpeechStart = () => {
    console.log('Voice recognition started');
  };

  const onSpeechEnd = () => {
    setIsListening(false);
    console.log('Voice recognition ended');
  };

  const onSpeechError = (error) => {
    console.log('Voice recognition error:', error);
    setError(error.message);
    setIsListening(false);
    Alert.alert('Voice Recognition Error', 'Please try speaking again or use text search.');
  };

  const onSpeechResults = (event) => {
    const results = event.value;
    setResults(results);
    if (results && results.length > 0) {
      const recognizedText = results[0];
      console.log('Recognized text:', recognizedText);
      onVoiceResult(recognizedText);
    }
    setIsListening(false);
  };

  const onSpeechPartialResults = (event) => {
    const results = event.value;
    setResults(results);
  };

  const startVoiceRecognition = async () => {
    try {
      setError('');
      setIsListening(true);
      await Voice.start('en-US');
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setError('Failed to start voice recognition');
      setIsListening(false);
      Alert.alert('Error', 'Voice recognition is not available. Please check your microphone permissions.');
    }
  };

  const stopVoiceRecognition = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    }
  };

  const handleVoicePress = () => {
    if (isListening) {
      stopVoiceRecognition();
    } else {
      startVoiceRecognition();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.voiceButton, style]}
      onPress={handleVoicePress}
      activeOpacity={0.7}
    >
      <Icon
        name={isListening ? "microphone" : "microphone-outline"}
        size={22}
        color={isListening ? "#e53935" : "#2874f0"}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  voiceButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
    minHeight: 40,
  },
});

export default VoiceSearch; 