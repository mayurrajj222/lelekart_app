import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Image, ActivityIndicator, TouchableOpacity, TextInput, Animated, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { API_BASE } from '../lib/api';

const BG_IMAGE = require('./assets/image.png');
const MICROSCOPE_IMAGE = require('./assets/microscope.png');
const { width } = Dimensions.get('window');
const NUM_COLUMNS = 2;
const CARD_SIZE = (width - 32 - 16 * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

function AppHeader({ search, setSearch }) {
  return (
    <SafeAreaView style={styles.headerSafeArea}>
      <View style={styles.logoRow}>
        <Image source={require('./assets/lele.png')} style={styles.headerLogo} resizeMode="contain" />
      </View>
      <View style={styles.headerBox}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search categories..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#b6b1a9"
        />
        <Text style={styles.sectionTitle}>Categories</Text>
      </View>
    </SafeAreaView>
  );
}

export default function CategoryTab() {
  const navigation = useNavigation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [pressedIndex, setPressedIndex] = useState(null);
  const [showDropAnim, setShowDropAnim] = useState(false);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        setError(null);
        setShowDropAnim(false);
        const res = await fetch(`${API_BASE}/api/categories`);
        if (!res.ok) throw new Error('Failed to fetch categories');
        const data = await res.json();
        setCategories(data);
        setTimeout(() => setShowDropAnim(true), 200); // trigger drop-in after data loads
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  // Animation: scale pulse for each card
  const scaleAnim = useRef(categories.map(() => new Animated.Value(1))).current;
  useEffect(() => {
    if (categories.length > 0) {
      scaleAnim.length = categories.length;
      for (let i = 0; i < categories.length; i++) {
        if (!scaleAnim[i]) scaleAnim[i] = new Animated.Value(1);
        Animated.loop(
          Animated.sequence([
            Animated.timing(scaleAnim[i], { toValue: 1.04, duration: 1200, useNativeDriver: true }),
            Animated.timing(scaleAnim[i], { toValue: 1, duration: 1200, useNativeDriver: true }),
          ])
        ).start();
      }
    }
  }, [categories]);

  // Drop-in animation for loading and real cards
  const dropAnim = useRef([]).current;
  const dropOpacity = useRef([]).current;
  useEffect(() => {
    if (showDropAnim && categories.length > 0) {
      dropAnim.length = categories.length;
      dropOpacity.length = categories.length;
      for (let i = 0; i < categories.length; i++) {
        if (!dropAnim[i]) dropAnim[i] = new Animated.Value(-160);
        if (!dropOpacity[i]) dropOpacity[i] = new Animated.Value(0);
        dropAnim[i].setValue(-160);
        dropOpacity[i].setValue(0);
        Animated.parallel([
          Animated.spring(dropAnim[i], {
            toValue: 0,
            useNativeDriver: true,
            friction: 7,
            tension: 60,
          }),
          Animated.timing(dropOpacity[i], {
            toValue: 1,
            duration: 600,
            delay: i * 120,
            useNativeDriver: true,
          })
        ]).start();
      }
    }
  }, [showDropAnim, categories]);

  const handleCategoryPress = (cat, idx) => {
    setPressedIndex(idx);
    navigation.navigate('ProductList', { category: cat.name });
    setTimeout(() => setPressedIndex(null), 600);
  };

  const filteredCategories = categories.filter(cat => cat.name.toLowerCase().includes(search.toLowerCase()));
  // Pad to fill last row
  const paddedCategories = filteredCategories.length % NUM_COLUMNS === 0
    ? filteredCategories
    : [
        ...filteredCategories,
        ...Array(NUM_COLUMNS - (filteredCategories.length % NUM_COLUMNS)).fill({ empty: true, id: Math.random() })
      ];

  return (
    <View style={styles.bgWrap}>
      <Image source={BG_IMAGE} style={styles.bgImage} resizeMode="cover" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 0 }}>
        <AppHeader search={search} setSearch={setSearch} />
        {loading && (
          <View style={styles.categoryGrid}>
            {[...Array(6)].map((_, idx) => (
              <Animated.View
                key={idx}
                style={[
                  styles.categoryCard,
                  {
                    opacity: dropOpacity[idx] || 0.5,
                    transform: [{ translateY: dropAnim[idx] || new Animated.Value(-160) }],
                  },
                ]}
              />
            ))}
          </View>
        )}
        {!loading && error ? (
          <Text style={{ color: '#b85c5c', textAlign: 'center', marginTop: 32 }}>{error}</Text>
        ) : null}
        {!loading && !error && (
          <View style={styles.categoryGrid}>
            {paddedCategories.length === 0 ? (
              <Text style={styles.emptyMsg}>No categories found.</Text>
            ) : (
              paddedCategories.map((cat, idx) =>
                cat.empty ? (
                  <View key={idx} style={styles.categoryCardEmpty} />
                ) : (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryCard, pressedIndex === idx && styles.categoryCardActive]}
                    onPress={() => handleCategoryPress(cat, idx)}
                    activeOpacity={0.85}
                  >
                    <Animated.View style={[styles.animatedCard, {
                      transform: [
                        { scale: scaleAnim[idx] || 1 },
                        { translateY: showDropAnim ? (dropAnim[idx] || new Animated.Value(0)) : 0 }
                      ],
                      opacity: showDropAnim ? (dropOpacity[idx] || 1) : 1,
                    }]}> 
                      <View style={styles.iconCircle}>
                        <Image
                          source={
                            cat.name === 'Toys'
                              ? require('./assets/toys.png')
                              : cat.name === 'Mobile'
                              ? require('./assets/smartphone.png')
                              : cat.name === 'Beauty'
                              ? require('./assets/makeup.png')
                              : cat.name === 'Home'
                              ? require('./assets/appliance.png')
                              : cat.name === 'Health & Wellness'
                              ? require('./assets/healthcare.png')
                              : cat.name === 'Industrial & Scientific'
                              ? MICROSCOPE_IMAGE
                              : { uri: cat.image || `https://source.unsplash.com/collection/190727/300x300?sig=${cat.id || idx}` }
                          }
                          style={styles.categoryImage}
                          resizeMode="contain"
                        />
                      </View>
                      <Text style={styles.categoryName}>{cat.name}</Text>
                    </Animated.View>
                  </TouchableOpacity>
                )
              )
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bgWrap: {
    flex: 1,
    backgroundColor: '#f7f4ef',
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    zIndex: -1,
  },
  headerSafeArea: { backgroundColor: 'transparent' },
  logoRow: { alignItems: 'center', paddingTop: 38, paddingBottom: 0 }, // increased top margin
  headerLogo: { width: 120, height: 40 },
  headerBox: {
    backgroundColor: '#f3ede6',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 8,
  },
  searchBar: {
    backgroundColor: '#f7f4ef',
    borderRadius: 12,
    padding: 14,
    fontSize: 17,
    color: '#3d3a36',
    borderWidth: 1,
    borderColor: '#e5e1db',
    fontFamily: 'serif',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3d3a36',
    marginLeft: 6,
    letterSpacing: 0.5,
    fontFamily: 'serif',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  categoryCard: {
    width: CARD_SIZE,
    height: CARD_SIZE * 0.95,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e1db',
    shadowColor: '#b6b1a9',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    marginTop: 0,
    transition: 'background-color 0.2s',
  },
  categoryCardActive: {
    backgroundColor: '#e0d6c6',
  },
  animatedCard: {
    alignItems: 'center',
    width: '100%',
  },
  categoryCardEmpty: {
    width: CARD_SIZE,
    height: CARD_SIZE * 0.95,
    backgroundColor: 'transparent',
    marginBottom: 18,
  },
  iconCircle: {
    width: CARD_SIZE * 0.48,
    height: CARD_SIZE * 0.48,
    borderRadius: CARD_SIZE * 0.24,
    backgroundColor: '#f3ede6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  categoryImage: {
    width: CARD_SIZE * 0.28,
    height: CARD_SIZE * 0.28,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#3d3a36',
    textAlign: 'center',
    fontFamily: 'serif',
    letterSpacing: 0.1,
    marginTop: 2,
  },
  emptyMsg: { textAlign: 'center', color: '#b6b1a9', marginTop: 32, fontSize: 18, fontFamily: 'serif' },
}); 