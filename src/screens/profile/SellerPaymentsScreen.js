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

export default function SellerPaymentsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('last30');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchPaymentsSummary = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/seller/payments-summary`, {
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (error) {
      console.error('Error fetching payments summary:', error);
    }
  };

  const fetchPayments = async (page = 1, refresh = false) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        dateRange: dateRange,
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const res = await fetch(`${API_BASE}/api/seller/payments?${params}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      
      if (refresh) {
        setPayments(data.payments || []);
      } else {
        setPayments(prev => page === 1 ? (data.payments || []) : [...prev, ...(data.payments || [])]);
      }
      
      setHasMore((data.payments || []).length === 10);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching payments:', error);
      Alert.alert('Error', 'Failed to load payments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPaymentsSummary();
    fetchPayments(1, true);
  }, [user?.id]);

  useEffect(() => {
    // Debounce search
    const timeoutId = setTimeout(() => {
      if (searchTerm !== '') {
        fetchPayments(1, true);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    fetchPayments(1, true);
  }, [statusFilter, dateRange]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPaymentsSummary();
    fetchPayments(1, true);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchPayments(currentPage + 1, false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return '#4CAF50';
      case 'processing':
        return '#FF9800';
      case 'pending':
        return '#2196F3';
      case 'failed':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return 'check-circle';
      case 'processing':
        return 'clock-outline';
      case 'pending':
        return 'pause-circle';
      case 'failed':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const SummaryCard = ({ title, value, icon, color, subtitle }) => (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <View style={[styles.summaryIcon, { backgroundColor: color + '20' }]}>
          <Icon name={icon} size={24} color={color} />
        </View>
        <Text style={styles.summaryTitle}>{title}</Text>
      </View>
      <Text style={styles.summaryValue}>{value}</Text>
      {subtitle && <Text style={styles.summarySubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderPayment = ({ item }) => (
    <View style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentId}>Payment #{item.id}</Text>
          <Text style={styles.paymentDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Icon name={getStatusIcon(item.status)} size={16} color={getStatusColor(item.status)} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>
      
      <View style={styles.paymentDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount:</Text>
          <Text style={styles.detailValue}>{formatCurrency(item.amount || 0)}</Text>
        </View>
        
        {item.transactionId && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID:</Text>
            <Text style={styles.detailValue}>{item.transactionId}</Text>
          </View>
        )}
        
        {item.orderCount && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Orders:</Text>
            <Text style={styles.detailValue}>{item.orderCount} orders</Text>
          </View>
        )}
        
        {item.description && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Description:</Text>
            <Text style={styles.detailValue} numberOfLines={2}>{item.description}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.paymentActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => Alert.alert('Payment Details', `Payment ID: ${item.id}\nAmount: ${formatCurrency(item.amount || 0)}\nStatus: ${item.status}`)}
        >
          <Icon name="eye" size={16} color="#2196F3" />
          <Text style={styles.actionText}>View Details</Text>
        </TouchableOpacity>
        
        {item.status === 'pending' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('Withdraw', 'Withdrawal feature coming soon!')}
          >
            <Icon name="bank-transfer" size={16} color="#4CAF50" />
            <Text style={styles.actionText}>Withdraw</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="credit-card-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>No payments found</Text>
      <Text style={styles.emptySubtext}>
        {searchTerm ? 'Try adjusting your search terms' : 'Payments will appear here once you start selling'}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#2874f0" />
        <Text style={styles.loadingFooterText}>Loading more payments...</Text>
      </View>
    );
  };

  if (loading && payments.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2874f0" />
        <Text style={styles.loadingText}>Loading payments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Payments</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
          >
            <Icon name="refresh" size={20} color="#2874f0" />
          </TouchableOpacity>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon name="magnify" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search payments..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm ? (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Icon name="close" size={20} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Date Range Filter */}
        <View style={styles.dateFilterContainer}>
          <Text style={styles.filterLabel}>Time Period:</Text>
          <View style={styles.dateFilterButtons}>
            {[
              { key: 'last7', label: '7D' },
              { key: 'last30', label: '30D' },
              { key: 'last90', label: '90D' },
              { key: 'year', label: '1Y' },
            ].map((range) => (
              <TouchableOpacity
                key={range.key}
                style={[
                  styles.dateFilterButton,
                  dateRange === range.key && styles.dateFilterButtonActive
                ]}
                onPress={() => setDateRange(range.key)}
              >
                <Text style={[
                  styles.dateFilterButtonText,
                  dateRange === range.key && styles.dateFilterButtonTextActive
                ]}>
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Status Filter */}
        <View style={styles.statusFilterContainer}>
          <Text style={styles.filterLabel}>Status:</Text>
          <View style={styles.statusFilterButtons}>
            {['all', 'paid', 'processing', 'pending', 'failed'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusFilterButton,
                  statusFilter === status && styles.statusFilterButtonActive
                ]}
                onPress={() => setStatusFilter(status)}
              >
                <Text style={[
                  styles.statusFilterButtonText,
                  statusFilter === status && styles.statusFilterButtonTextActive
                ]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Summary Cards */}
      {summary && (
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.summaryGrid}>
            <SummaryCard
              title="Available Balance"
              value={formatCurrency(summary.availableBalance || 0)}
              icon="wallet"
              color="#4CAF50"
              subtitle="Ready for withdrawal"
            />
            <SummaryCard
              title="Total Earned"
              value={formatCurrency(summary.totalEarned || 0)}
              icon="currency-inr"
              color="#2196F3"
              subtitle="All time earnings"
            />
            <SummaryCard
              title="Pending Amount"
              value={formatCurrency(summary.pendingAmount || 0)}
              icon="clock-outline"
              color="#FF9800"
              subtitle="Processing payments"
            />
            <SummaryCard
              title="This Month"
              value={formatCurrency(summary.thisMonth || 0)}
              icon="calendar-month"
              color="#9C27B0"
              subtitle="Current month earnings"
            />
          </View>
        </View>
      )}

      {/* Payments List */}
      <FlatList
        data={payments}
        renderItem={renderPayment}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.paymentsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafd',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafd',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2874f0',
  },
  refreshButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  dateFilterContainer: {
    marginBottom: 12,
  },
  statusFilterContainer: {
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  dateFilterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  dateFilterButton: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  dateFilterButtonActive: {
    backgroundColor: '#2874f0',
  },
  dateFilterButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  dateFilterButtonTextActive: {
    color: '#fff',
  },
  statusFilterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusFilterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  statusFilterButtonActive: {
    backgroundColor: '#2874f0',
  },
  statusFilterButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statusFilterButtonTextActive: {
    color: '#fff',
  },
  summarySection: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2874f0',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryCard: {
    width: (width - 44) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  summaryTitle: {
    fontSize: 12,
    color: '#666',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2874f0',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 10,
    color: '#999',
  },
  paymentsList: {
    padding: 16,
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  paymentDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  paymentDetails: {
    padding: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  paymentActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  loadingFooterText: {
    fontSize: 14,
    color: '#666',
  },
}); 