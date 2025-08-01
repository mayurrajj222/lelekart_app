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

export default function SellerReturnsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('last30');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [actionReason, setActionReason] = useState('');

  const fetchReturns = async (page = 1, refresh = false) => {
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

      const res = await fetch(`${API_BASE}/api/seller/returns?${params}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      
      if (refresh) {
        setReturns(data.returns || []);
      } else {
        setReturns(prev => page === 1 ? (data.returns || []) : [...prev, ...(data.returns || [])]);
      }
      
      setHasMore((data.returns || []).length === 10);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching returns:', error);
      Alert.alert('Error', 'Failed to load returns');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReturns(1, true);
  }, [user?.id]);

  useEffect(() => {
    // Debounce search
    const timeoutId = setTimeout(() => {
      if (searchTerm !== '') {
        fetchReturns(1, true);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    fetchReturns(1, true);
  }, [statusFilter, dateRange]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReturns(1, true);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchReturns(currentPage + 1, false);
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
      case 'approved':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      case 'pending':
        return '#FF9800';
      case 'refunded':
        return '#2196F3';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return 'check-circle';
      case 'rejected':
        return 'close-circle';
      case 'pending':
        return 'clock-outline';
      case 'refunded':
        return 'bank-transfer';
      default:
        return 'help-circle';
    }
  };

  const handleAction = (returnItem, action) => {
    setSelectedReturn(returnItem);
    setActionType(action);
    setActionReason('');
    setShowActionDialog(true);
  };

  const submitAction = async () => {
    if (!selectedReturn || !actionType) return;

    try {
      const res = await fetch(`${API_BASE}/api/seller/returns/${selectedReturn.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: actionType === 'approve' ? 'approved' : 'rejected',
          reason: actionReason,
        }),
      });

      if (res.ok) {
        setReturns(prev => prev.map(item => 
          item.id === selectedReturn.id 
            ? { ...item, status: actionType === 'approve' ? 'approved' : 'rejected' }
            : item
        ));
        setShowActionDialog(false);
        setSelectedReturn(null);
        setActionType(null);
        setActionReason('');
        Alert.alert('Success', `Return ${actionType === 'approve' ? 'approved' : 'rejected'} successfully`);
      } else {
        throw new Error('Failed to update return status');
      }
    } catch (error) {
      console.error('Error updating return status:', error);
      Alert.alert('Error', 'Failed to update return status');
    }
  };

  const renderReturn = ({ item }) => (
    <View style={styles.returnCard}>
      <View style={styles.returnHeader}>
        <View style={styles.returnInfo}>
          <Text style={styles.returnId}>Return #{item.id}</Text>
          <Text style={styles.returnDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Icon name={getStatusIcon(item.status)} size={16} color={getStatusColor(item.status)} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>
      
      <View style={styles.returnDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Order ID:</Text>
          <Text style={styles.detailValue}>#{item.orderId}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Product:</Text>
          <Text style={styles.detailValue} numberOfLines={2}>{item.productName}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Customer:</Text>
          <Text style={styles.detailValue}>{item.customerName}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount:</Text>
          <Text style={styles.detailValue}>{formatCurrency(item.amount || 0)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Reason:</Text>
          <Text style={styles.detailValue} numberOfLines={2}>{item.reason}</Text>
        </View>
      </View>
      
      <View style={styles.returnActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            setSelectedReturn(item);
            setShowActionDialog(true);
          }}
        >
          <Icon name="eye" size={16} color="#2196F3" />
          <Text style={styles.actionText}>View Details</Text>
        </TouchableOpacity>
        
        {item.status === 'pending' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleAction(item, 'approve')}
            >
              <Icon name="check" size={16} color="#4CAF50" />
              <Text style={[styles.actionText, { color: '#4CAF50' }]}>Approve</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleAction(item, 'reject')}
            >
              <Icon name="close" size={16} color="#F44336" />
              <Text style={[styles.actionText, { color: '#F44336' }]}>Reject</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="package-variant-closed" size={64} color="#ccc" />
      <Text style={styles.emptyText}>No returns found</Text>
      <Text style={styles.emptySubtext}>
        {searchTerm ? 'Try adjusting your search terms' : 'Returns will appear here when customers request them'}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#2874f0" />
        <Text style={styles.loadingFooterText}>Loading more returns...</Text>
      </View>
    );
  };

  if (loading && returns.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2874f0" />
        <Text style={styles.loadingText}>Loading returns...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Returns Management</Text>
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
            placeholder="Search returns..."
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
            {['all', 'pending', 'approved', 'rejected', 'refunded'].map((status) => (
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

      {/* Returns List */}
      <FlatList
        data={returns}
        renderItem={renderReturn}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.returnsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
      />

      {/* Action Dialog */}
      {showActionDialog && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {actionType === 'approve' ? 'Approve Return' : 'Reject Return'}
            </Text>
            
            {selectedReturn && (
              <View style={styles.modalDetails}>
                <Text style={styles.modalDetailText}>
                  Return #{selectedReturn.id} - {selectedReturn.productName}
                </Text>
                <Text style={styles.modalDetailText}>
                  Customer: {selectedReturn.customerName}
                </Text>
                <Text style={styles.modalDetailText}>
                  Amount: {formatCurrency(selectedReturn.amount || 0)}
                </Text>
              </View>
            )}
            
            <TextInput
              style={styles.reasonInput}
              placeholder={`Enter ${actionType === 'approve' ? 'approval' : 'rejection'} reason...`}
              value={actionReason}
              onChangeText={setActionReason}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowActionDialog(false);
                  setSelectedReturn(null);
                  setActionType(null);
                  setActionReason('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  actionType === 'approve' ? styles.approveButton : styles.rejectButton
                ]}
                onPress={submitAction}
              >
                <Text style={styles.confirmButtonText}>
                  {actionType === 'approve' ? 'Approve' : 'Reject'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  returnsList: {
    padding: 16,
  },
  returnCard: {
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
  returnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  returnInfo: {
    flex: 1,
  },
  returnId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  returnDate: {
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
  returnDetails: {
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
  returnActions: {
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
  approveButton: {
    backgroundColor: '#E8F5E8',
  },
  rejectButton: {
    backgroundColor: '#FFEBEE',
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    width: width - 40,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2874f0',
    marginBottom: 16,
  },
  modalDetails: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  modalDetailText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
}); 