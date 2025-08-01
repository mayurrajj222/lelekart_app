import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { API_BASE } from '../../lib/api';

export default function ReviewsScreen() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/user/reviews`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch reviews');
        const data = await res.json();
        setReviews(data);
      } catch (err) {
        setError(err.message || 'Error fetching reviews');
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2874f0" /></View>;
  }
  if (error) {
    return <View style={styles.center}><Text style={{ color: 'red' }}>{error}</Text></View>;
  }
  if (!reviews.length) {
    return <View style={styles.center}><Text>No reviews found.</Text></View>;
  }

  return (
    <FlatList
      style={styles.list}
      data={reviews}
      keyExtractor={item => item.id?.toString() || Math.random().toString()}
      renderItem={({ item }) => (
        <View style={styles.reviewCard}>
          <Text style={styles.productName}>{item.productName || 'Product'}</Text>
          <Text style={styles.rating}>Rating: {item.rating || '-'}/5</Text>
          <Text style={styles.comment}>{item.comment || '-'}</Text>
          <Text style={styles.reviewDate}>Date: {item.date ? new Date(item.date).toLocaleDateString() : '-'}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { flex: 1, backgroundColor: '#f8fafd' },
  reviewCard: { backgroundColor: '#fff', margin: 12, padding: 18, borderRadius: 10, elevation: 2 },
  productName: { fontSize: 16, fontWeight: 'bold', color: '#2874f0' },
  rating: { fontSize: 15, color: '#444', marginTop: 4 },
  comment: { fontSize: 15, color: '#222', marginTop: 4 },
  reviewDate: { fontSize: 14, color: '#888', marginTop: 4 },
}); 