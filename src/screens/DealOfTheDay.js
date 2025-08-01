import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function DealOfTheDay({ deal, loading, onAddToCart, onGoToCart, onViewProduct, inCart }) {
  const [countdown, setCountdown] = useState({
    hours: deal?.hours || 0,
    minutes: deal?.minutes || 0,
    seconds: deal?.seconds || 0,
  });

  useEffect(() => {
    setCountdown({
      hours: deal?.hours || 0,
      minutes: deal?.minutes || 0,
      seconds: deal?.seconds || 0,
    });
  }, [deal]);

  useEffect(() => {
    if (!deal) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) seconds--;
        else if (minutes > 0) { minutes--; seconds = 59; }
        else if (hours > 0) { hours--; minutes = 59; seconds = 59; }
        else return { hours: 0, minutes: 0, seconds: 0 };
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [deal]);

  if (loading) return (
    <View style={styles.dealContainer}><ActivityIndicator size="large" color="#2874f0" /></View>
  );
  if (!deal) return null;

  return (
    <View style={styles.dealContainer}>
      <View style={styles.dealHeader}>
        <Text style={styles.dealTitle}>DEAL OF THE DAY</Text>
        <View style={styles.countdownRow}>
          <View style={styles.countdownBox}><Text style={styles.countdownNum}>{String(countdown.hours).padStart(2, '0')}</Text><Text style={styles.countdownLabel}>Hrs</Text></View>
          <Text style={styles.countdownColon}>:</Text>
          <View style={styles.countdownBox}><Text style={styles.countdownNum}>{String(countdown.minutes).padStart(2, '0')}</Text><Text style={styles.countdownLabel}>Min</Text></View>
          <Text style={styles.countdownColon}>:</Text>
          <View style={styles.countdownBox}><Text style={styles.countdownNum}>{String(countdown.seconds).padStart(2, '0')}</Text><Text style={styles.countdownLabel}>Sec</Text></View>
        </View>
      </View>
      <View style={styles.dealContent}>
        <TouchableOpacity onPress={onViewProduct} activeOpacity={0.8}>
          <Image
            source={{ uri: deal.image && deal.image.startsWith('http') ? deal.image : 'https://placehold.co/180x180?text=No+Image' }}
            style={styles.dealImageBeautiful}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <View style={styles.dealInfo}>
          <TouchableOpacity onPress={onViewProduct} activeOpacity={0.7}>
            <Text style={styles.dealProductTitle} numberOfLines={2}>{deal.title}</Text>
          </TouchableOpacity>
          <Text style={styles.dealProductSubtitle} numberOfLines={1}>{deal.subtitle}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.discountPrice}>₹{Number(deal.discountPrice).toFixed(2)}</Text>
            <Text style={styles.originalPrice}>₹{Number(deal.originalPrice).toFixed(2)}</Text>
            <Text style={styles.discountPercent}>-{deal.discountPercentage}%</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
            {!inCart ? (
              <TouchableOpacity
                style={styles.addToCartBtn}
                onPress={onAddToCart}
              >
                <Icon name="cart-plus" size={20} color="#fff" />
                <Text style={styles.addToCartText}>Add to Cart</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.addToCartBtn, { backgroundColor: '#43a047' }]}
                onPress={onGoToCart}
              >
                <Icon name="cart" size={20} color="#fff" />
                <Text style={styles.addToCartText}>Go to Cart</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dealContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  dealHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  dealTitle: { fontSize: 18, fontWeight: 'bold', color: '#e53935', letterSpacing: 1 },
  countdownRow: { flexDirection: 'row', alignItems: 'center' },
  countdownBox: { alignItems: 'center', marginHorizontal: 2 },
  countdownNum: { fontSize: 16, fontWeight: 'bold', color: '#e53935' },
  countdownLabel: { fontSize: 10, color: '#888' },
  countdownColon: { fontSize: 16, color: '#e53935', marginHorizontal: 2 },
  dealContent: { flexDirection: 'row', alignItems: 'center' },
  dealImage: { width: 90, height: 90, borderRadius: 8, backgroundColor: '#f7f7f7', marginRight: 16 },
  dealInfo: { flex: 1 },
  dealProductTitle: { fontSize: 16, fontWeight: 'bold', color: '#222', marginBottom: 2 },
  dealProductSubtitle: { fontSize: 13, color: '#888', marginBottom: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  discountPrice: { fontSize: 18, fontWeight: 'bold', color: '#2874f0', marginRight: 8 },
  originalPrice: { fontSize: 14, color: '#888', textDecorationLine: 'line-through', marginRight: 8 },
  discountPercent: { fontSize: 13, color: '#e53935', fontWeight: 'bold' },
  addToCartBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2874f0', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'flex-start' },
  addToCartText: { color: '#fff', fontWeight: 'bold', marginLeft: 8, fontSize: 15 },
  dealImageBeautiful: {
    width: 140,
    height: 140,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
    marginRight: 20,
  },
}); 