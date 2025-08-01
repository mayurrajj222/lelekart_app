# Voice Search Implementation Guide

## Required Dependencies

Add these to your `package.json`:

```json
{
  "dependencies": {
    "@react-native-voice/voice": "^3.2.4"
  }
}
```

## Installation Steps

1. **Install the voice recognition library:**
   ```bash
   npm install @react-native-voice/voice
   # or
   yarn add @react-native-voice/voice
   ```

2. **For iOS, install pods:**
   ```bash
   cd ios && pod install && cd ..
   ```

3. **Android Permissions:**
   Add these permissions to `android/app/src/main/AndroidManifest.xml`:
   ```xml
   <uses-permission android:name="android.permission.RECORD_AUDIO" />
   <uses-permission android:name="android.permission.INTERNET" />
   ```

4. **iOS Permissions:**
   Add this to `ios/YourApp/Info.plist`:
   ```xml
   <key>NSMicrophoneUsageDescription</key>
   <string>This app needs access to microphone for voice search functionality.</string>
   <key>NSSpeechRecognitionUsageDescription</key>
   <string>This app needs access to speech recognition for voice search functionality.</string>
   ```

## How to Use

### Option 1: Replace your existing search box

Replace your current search implementation with the `EnhancedSearchBox` component:

```jsx
import EnhancedSearchBox from '../components/EnhancedSearchBox';

// In your component:
const [searchText, setSearchText] = useState('');

const handleSearch = () => {
  // Your search logic here
  console.log('Searching for:', searchText);
};

return (
  <EnhancedSearchBox
    value={searchText}
    onChangeText={setSearchText}
    onSubmit={handleSearch}
    placeholder="What do you want to shop for today?"
  />
);
```

### Option 2: Add voice button to existing search

If you want to keep your existing search box and just add a voice button:

```jsx
import VoiceSearch from '../components/VoiceSearch';

// In your existing search component:
const [isListening, setIsListening] = useState(false);

const handleVoiceResult = (recognizedText) => {
  setSearchText(recognizedText);
  // Trigger your search
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
    <VoiceSearch
      onVoiceResult={handleVoiceResult}
      isListening={isListening}
      setIsListening={setIsListening}
    />
    <TouchableOpacity style={styles.headerIconBtn} onPress={onCameraPress}>
      <Icon name="camera-outline" size={22} color="#b6b1a9" />
    </TouchableOpacity>
  </View>
);
```

## Features

- **Voice Recognition**: Uses device's built-in speech recognition
- **Visual Feedback**: Microphone icon changes color when listening
- **Error Handling**: Shows alerts for permission or recognition errors
- **Auto Search**: Optionally triggers search immediately after voice input
- **Cross Platform**: Works on both iOS and Android

## Troubleshooting

1. **Permission Issues**: Make sure microphone permissions are granted
2. **iOS Issues**: Ensure you're using a real device (simulator doesn't support voice)
3. **Android Issues**: Check that the app has microphone permissions in settings

## Customization

You can customize the voice search component by modifying:
- Icon colors and sizes
- Button styling
- Recognition language (currently set to 'en-US')
- Error messages and alerts 