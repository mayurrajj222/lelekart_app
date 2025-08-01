import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { API_BASE } from '../../lib/api';
import { AuthContext } from '../../context/AuthContext';

export default function WalletScreen() {
  const { user } = useContext(AuthContext);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Modal states
  const [redeemModal, setRedeemModal] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState('100');
  const [redeeming, setRedeeming] = useState(false);
  const [voucherInfo, setVoucherInfo] = useState(null);
  const [redeemSuccess, setRedeemSuccess] = useState(false);
  const [pendingRedeemSuccess, setPendingRedeemSuccess] = useState(false);

  const fetchWalletData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Fetch wallet balance
      const walletRes = await fetch(`${API_BASE}/api/wallet`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (walletRes.ok) {
        const walletData = await walletRes.json();
        setWallet(walletData);
      }

      // Fetch transactions
      const transactionsRes = await fetch(`${API_BASE}/api/wallet/transactions`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError(err.message || 'Error fetching wallet data');
      setTransactions([]);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const onRefresh = () => {
    fetchWalletData(true);
  };

  const handleRedeemCoins = async () => {
    const amount = parseInt(redeemAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (wallet && amount > wallet.balance) {
      Alert.alert('Error', 'Insufficient wallet balance');
      return;
    }

    setRedeeming(true);
    try {
      const res = await fetch(`${API_BASE}/api/wallet/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: amount,
          referenceType: 'MANUAL',
          description: 'Manual redemption'
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to redeem coins');
      }

      const result = await res.json();
      
      if (result.voucherCode && result.discountAmount) {
        setVoucherInfo({
          code: result.voucherCode,
          value: result.discountAmount
        });
      }

      setPendingRedeemSuccess(true); // Set pending flag
      setRedeemModal(false);
      setRedeemAmount('100');
      fetchWalletData(); // Refresh data
    } catch (err) {
      console.error('Error redeeming coins:', err);
      Alert.alert('Error', err.message || 'Failed to redeem coins');
    } finally {
      setRedeeming(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' • ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'credit':
        return { name: 'arrow-down', color: '#4caf50' };
      case 'debit':
        return { name: 'arrow-up', color: '#f44336' };
      case 'expired':
        return { name: 'clock-outline', color: '#ff9800' };
      default:
        return { name: 'circle', color: '#666' };
    }
  };

  useEffect(() => {
    if (user) {
      fetchWalletData();
    } else {
      setError('Please login to view your wallet');
      setLoading(false);
    }
  }, [user]);

  // Add useEffect to show redeemSuccess after modal closes
  useEffect(() => {
    if (!redeemModal && pendingRedeemSuccess) {
      setRedeemSuccess(true);
      setPendingRedeemSuccess(false);
      setTimeout(() => setRedeemSuccess(false), 2500);
      Alert.alert('Success', 'Coins redeemed successfully!');
    }
  }, [redeemModal, pendingRedeemSuccess]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2874f0" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchWalletData()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  return (
    <View style={styles.container}>
      {redeemSuccess && (
        <View style={{ backgroundColor: '#43a047', padding: 12, borderRadius: 8, margin: 16, marginBottom: 0 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Coins redeemed successfully!</Text>
        </View>
      )}
      {/* Debug: List all transaction types */}
      {safeTransactions.length > 0 && (
        <View style={{ backgroundColor: '#fffbe6', padding: 8, margin: 16, borderRadius: 8, marginBottom: 0 }}>
          <Text style={{ color: '#333', fontWeight: 'bold' }}>Transaction Types (debug):</Text>
          <Text style={{ color: '#333', fontSize: 12 }}>{safeTransactions.map(t => t.type).join(', ')}</Text>
        </View>
      )}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2874f0']}
            tintColor="#2874f0"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Wallet</Text>
        </View>

        {/* Wallet Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Icon name="wallet" size={32} color="#2874f0" />
            <Text style={styles.balanceTitle}>Wallet Balance</Text>
          </View>
          <Text style={styles.balanceAmount}>
            {wallet ? `${wallet.balance} Coins` : '0 Coins'}
          </Text>
          {wallet && wallet.balance > 0 && (
            <TouchableOpacity
              style={styles.redeemButton}
              onPress={() => setRedeemModal(true)}
            >
              <Icon name="gift" size={20} color="#fff" />
              <Text style={styles.redeemButtonText}>Redeem Coins</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Icon name="arrow-down" size={24} color="#4caf50" />
            <Text style={styles.statValue}>
              {safeTransactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0)}
            </Text>
            <Text style={styles.statLabel}>Earned</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="arrow-up" size={24} color="#f44336" />
            <Text style={styles.statValue}>
              {safeTransactions.filter(t => t.type === 'debit' || t.type === 'redeem').reduce((sum, t) => sum + Math.abs(t.amount), 0)}
            </Text>
            <Text style={styles.statLabel}>Spent</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="clock-outline" size={24} color="#ff9800" />
            <Text style={styles.statValue}>
              {safeTransactions.filter(t => t.type === 'expired').reduce((sum, t) => sum + t.amount, 0)}
            </Text>
            <Text style={styles.statLabel}>Expired</Text>
          </View>
        </View>

        {/* Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          
          {safeTransactions.length > 0 ? (
            safeTransactions.slice(0, 10).map((transaction, index) => (
              <View key={transaction.id || index} style={styles.transactionCard}>
                <View style={styles.transactionHeader}>
                  <View style={styles.transactionIcon}>
                    <Icon 
                      name={getTransactionIcon(transaction.type).name} 
                      size={20} 
                      color={getTransactionIcon(transaction.type).color} 
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionType}>
                      {transaction.type === 'credit' ? 'Earned' : 
                       transaction.type === 'debit' ? 'Spent' : 
                       transaction.type === 'expired' ? 'Expired' : 'Transaction'}
                    </Text>
                    <Text style={styles.transactionDescription}>
                      {transaction.description || 'Wallet transaction'}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {formatDate(transaction.createdAt)}
                    </Text>
                  </View>
                  <Text style={[
                    styles.transactionAmount,
                    transaction.type === 'credit' ? styles.creditAmount : 
                    transaction.type === 'debit' ? styles.debitAmount : 
                    styles.expiredAmount
                  ]}>
                    {transaction.type === 'credit' ? '+' : 
                     transaction.type === 'debit' ? '-' : ''}
                    {transaction.amount} Coins
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Icon name="wallet-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>Start shopping to earn coins</Text>
            </View>
          )}
        </View>

        {/* How It Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.howItWorks}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>Shop and earn coins with every purchase</Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>Redeem coins for discount vouchers</Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>Use vouchers on your next purchase</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Redeem Modal */}
      <Modal
        visible={redeemModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setRedeemModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Redeem Coins</Text>
              <TouchableOpacity onPress={() => setRedeemModal(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount to Redeem</Text>
                <TextInput
                  style={styles.input}
                  value={redeemAmount}
                  onChangeText={setRedeemAmount}
                  placeholder="100"
                  keyboardType="numeric"
                />
                <Text style={styles.inputHelp}>
                  Available balance: {wallet ? wallet.balance : 0} coins
                </Text>
              </View>

              {voucherInfo && (
                <View style={styles.voucherInfo}>
                  <Text style={styles.voucherTitle}>Voucher Generated!</Text>
                  <Text style={styles.voucherCode}>Code: {voucherInfo.code}</Text>
                  <Text style={styles.voucherValue}>Value: ₹{voucherInfo.value}</Text>
                </View>
              )}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setRedeemModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.redeemConfirmButton, redeeming && styles.disabledButton]}
                onPress={handleRedeemCoins}
                disabled={redeeming}
              >
                {redeeming ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.redeemConfirmButtonText}>Redeem</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafd' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  scrollView: { flex: 1 },
  
  // Header
  header: { padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#222' },
  
  // Balance Card
  balanceCard: { margin: 20, backgroundColor: '#fff', borderRadius: 12, padding: 20, elevation: 2 },
  balanceHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  balanceTitle: { fontSize: 16, color: '#666', marginLeft: 12 },
  balanceAmount: { fontSize: 32, fontWeight: 'bold', color: '#6B3F1D', marginBottom: 16 },
  redeemButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4caf50', paddingVertical: 12, borderRadius: 8 },
  redeemButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  
  // Stats
  statsContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#222', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  
  // Sections
  section: { padding: 20, backgroundColor: '#fff', marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 16 },
  
  // Transactions
  transactionCard: { backgroundColor: '#f8f9fa', borderRadius: 8, padding: 16, marginBottom: 12 },
  transactionHeader: { flexDirection: 'row', alignItems: 'center' },
  transactionIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  transactionInfo: { flex: 1 },
  transactionType: { fontSize: 16, fontWeight: '600', color: '#222' },
  transactionDescription: { fontSize: 14, color: '#666', marginTop: 2 },
  transactionDate: { fontSize: 12, color: '#999', marginTop: 2 },
  transactionAmount: { fontSize: 16, fontWeight: 'bold' },
  creditAmount: { color: '#4caf50' },
  debitAmount: { color: '#f44336' },
  expiredAmount: { color: '#ff9800' },
  
  // Empty State
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 18, color: '#666', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 8 },
  
  // How It Works
  howItWorks: { gap: 16 },
  step: { flexDirection: 'row', alignItems: 'center' },
  stepNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#6B3F1D', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  stepNumberText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  stepText: { flex: 1, fontSize: 14, color: '#666' },
  
  // Error and Loading
  errorText: { color: '#e53935', fontSize: 16, textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: '#6B3F1D', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, width: '90%', maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#222' },
  modalBody: { padding: 20, maxHeight: 400 },
  modalFooter: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderTopWidth: 1, borderTopColor: '#eee' },
  
  // Form Styles
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, backgroundColor: '#fff' },
  inputHelp: { fontSize: 12, color: '#666', marginTop: 4 },
  
  // Voucher Info
  voucherInfo: { backgroundColor: '#e8f5e8', borderRadius: 8, padding: 16, marginTop: 16 },
  voucherTitle: { fontSize: 16, fontWeight: 'bold', color: '#4caf50', marginBottom: 8 },
  voucherCode: { fontSize: 14, color: '#222', marginBottom: 4 },
  voucherValue: { fontSize: 14, color: '#222' },
  
  // Button Styles
  cancelButton: { flex: 1, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginRight: 8 },
  cancelButtonText: { textAlign: 'center', fontSize: 16, color: '#666' },
  redeemConfirmButton: { flex: 1, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#4caf50', marginLeft: 8 },
  redeemConfirmButtonText: { textAlign: 'center', fontSize: 16, color: '#fff', fontWeight: '600' },
  disabledButton: { backgroundColor: '#ccc' },
}); 