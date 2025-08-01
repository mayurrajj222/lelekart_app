import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE } from '../../lib/api';

const { width } = Dimensions.get('window');

export default function SellerInventoryScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sellerId: user?.id?.toString() || '',
        stock: filter,
      });
      const res = await fetch(`${API_BASE}/api/seller/products?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch inventory');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchInventory(); }, [filter]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInventory();
  };

  const renderProduct = ({ item }) => (
    <View style={styles.productCard}>
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.productStock}>Stock: {item.stock || item.stockQuantity || 0}</Text>
      <Text style={styles.productCategory}>{item.category}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterTabs}>
        {['all', 'in-stock', 'low-stock', 'out-of-stock'].map(f => (
          <TouchableOpacity key={f} style={[styles.filterTab, filter === f && styles.filterTabActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>{f.replace('-', ' ').toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#2874f0" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={item => item.id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40, color: '#888' }}>No inventory found.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafd' },
  filterTabs: { flexDirection: 'row', justifyContent: 'space-around', padding: 12, backgroundColor: '#fff' },
  filterTab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6, backgroundColor: '#f5f5f5' },
  filterTabActive: { backgroundColor: '#2874f0' },
  filterTabText: { color: '#666', fontWeight: 'bold' },
  filterTabTextActive: { color: '#fff' },
  productCard: { backgroundColor: '#fff', margin: 10, padding: 16, borderRadius: 8, elevation: 2 },
  productName: { fontSize: 16, fontWeight: 'bold', color: '#2874f0' },
  productStock: { fontSize: 15, color: '#333', marginTop: 4 },
  productCategory: { fontSize: 14, color: '#888', marginTop: 2 },
}); 