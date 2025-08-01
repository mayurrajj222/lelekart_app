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

export default function GiftCardsScreen() {
  const { user } = useContext(AuthContext);
  const [giftCards, setGiftCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Modal states
  const [checkBalanceModal, setCheckBalanceModal] = useState(false);
  const [buyGiftCardModal, setBuyGiftCardModal] = useState(false);
  const [giftCardCode, setGiftCardCode] = useState('');
  const [checkedCard, setCheckedCard] = useState(null);
  const [giftCardAmount, setGiftCardAmount] = useState('500');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [personalizedMessage, setPersonalizedMessage] = useState('');
  const [checkingBalance, setCheckingBalance] = useState(false);

  const fetchGiftCards = async (isRefresh = false) => {
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

      const res = await fetch(`${API_BASE}/api/gift-cards/user/${user.id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to fetch gift cards');
      }

      const data = await res.json();
      setGiftCards(data);
    } catch (err) {
      console.error('Error fetching gift cards:', err);
      setError(err.message || 'Error fetching gift cards');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const onRefresh = () => {
    fetchGiftCards(true);
  };

  const checkBalance = async () => {
    if (!giftCardCode.trim()) {
      Alert.alert('Error', 'Please enter a gift card code');
      return;
    }

    setCheckingBalance(true);
    try {
      const res = await fetch(`${API_BASE}/api/gift-cards/check-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: giftCardCode }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to check gift card balance');
      }

      const cardData = await res.json();
      setCheckedCard({
        code: giftCardCode,
        initialValue: cardData.initialValue,
        currentBalance: cardData.currentBalance,
        expiryDate: cardData.expiryDate,
        status: cardData.status,
      });
    } catch (err) {
      console.error('Error checking balance:', err);
      Alert.alert('Error', err.message || 'Failed to check gift card balance');
    } finally {
      setCheckingBalance(false);
    }
  };

  const handleBuyGiftCard = async () => {
    if (!recipientEmail.trim()) {
      Alert.alert('Error', 'Please enter recipient email');
      return;
    }

    Alert.alert(
      'Coming Soon',
      'The gift card purchase feature will be available soon!',
      [{ text: 'OK', onPress: () => setBuyGiftCardModal(false) }]
    );
  };

  useEffect(() => {
    if (user) {
      fetchGiftCards();
    } else {
      setError('Please login to view your gift cards');
      setLoading(false);
    }
  }, [user]);

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
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchGiftCards()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
          <Text style={styles.title}>Gift Cards</Text>
          <Text style={styles.subtitle}>Manage and purchase gift cards</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setCheckBalanceModal(true)}
          >
            <Icon name="magnify" size={20} color="#2874f0" />
            <Text style={styles.actionButtonText}>Check Balance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => setBuyGiftCardModal(true)}
          >
            <Icon name="gift" size={20} color="#fff" />
            <Text style={[styles.actionButtonText, styles.primaryButtonText]}>Buy Gift Card</Text>
          </TouchableOpacity>
        </View>

        {/* Gift Cards List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Gift Cards</Text>
          
          {giftCards.length > 0 ? (
            giftCards.map((card, index) => (
              <View key={card.id || index} style={styles.giftCard}>
                <View style={styles.cardHeader}>
                  <Icon name="credit-card" size={24} color="#2874f0" />
                  <Text style={styles.cardCode}>{card.code}</Text>
                  <View style={[styles.statusBadge, card.status === 'active' ? styles.activeBadge : styles.inactiveBadge]}>
                    <Text style={styles.statusText}>{card.status}</Text>
                  </View>
                </View>
                
                <View style={styles.cardDetails}>
                  <View style={styles.balanceRow}>
                    <Text style={styles.balanceLabel}>Initial Value:</Text>
                    <Text style={styles.balanceValue}>₹{card.initialValue}</Text>
                  </View>
                  <View style={styles.balanceRow}>
                    <Text style={styles.balanceLabel}>Current Balance:</Text>
                    <Text style={styles.balanceValue}>₹{card.currentBalance}</Text>
                  </View>
                  {card.expiryDate && (
                    <View style={styles.balanceRow}>
                      <Text style={styles.balanceLabel}>Expires:</Text>
                      <Text style={styles.balanceValue}>{new Date(card.expiryDate).toLocaleDateString()}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Icon name="gift-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No gift cards found</Text>
              <Text style={styles.emptySubtext}>Purchase your first gift card to get started</Text>
            </View>
          )}
        </View>

        {/* How It Works Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.howItWorks}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>Purchase a gift card for any amount</Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>Send it to friends and family via email</Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>They can use it to shop on Lelekart</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Check Balance Modal */}
      <Modal
        visible={checkBalanceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCheckBalanceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Check Gift Card Balance</Text>
              <TouchableOpacity onPress={() => setCheckBalanceModal(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Gift Card Code</Text>
                <TextInput
                  style={styles.input}
                  value={giftCardCode}
                  onChangeText={setGiftCardCode}
                  placeholder="Enter gift card code"
                  autoCapitalize="characters"
                />
              </View>

              {checkedCard && (
                <View style={styles.balanceResult}>
                  <Text style={styles.balanceResultTitle}>Card Balance</Text>
                  <Text style={styles.balanceResultCode}>{checkedCard.code}</Text>
                  <Text style={styles.balanceResultAmount}>₹{checkedCard.currentBalance}</Text>
                  <Text style={styles.balanceResultStatus}>Status: {checkedCard.status}</Text>
                </View>
              )}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setCheckBalanceModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.checkButton, checkingBalance && styles.disabledButton]}
                onPress={checkBalance}
                disabled={checkingBalance}
              >
                {checkingBalance ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.checkButtonText}>Check Balance</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Buy Gift Card Modal */}
      <Modal
        visible={buyGiftCardModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setBuyGiftCardModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Buy Gift Card</Text>
              <TouchableOpacity onPress={() => setBuyGiftCardModal(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={giftCardAmount}
                  onChangeText={setGiftCardAmount}
                  placeholder="500"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Recipient Email</Text>
                <TextInput
                  style={styles.input}
                  value={recipientEmail}
                  onChangeText={setRecipientEmail}
                  placeholder="Enter recipient email"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Recipient Name (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={recipientName}
                  onChangeText={setRecipientName}
                  placeholder="Enter recipient name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Personal Message (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={personalizedMessage}
                  onChangeText={setPersonalizedMessage}
                  placeholder="Add a personal message"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setBuyGiftCardModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.buyButton}
                onPress={handleBuyGiftCard}
              >
                <Text style={styles.buyButtonText}>Buy Gift Card</Text>
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
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  
  // Action Buttons
  actionButtons: { flexDirection: 'row', padding: 20, gap: 12 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff' },
  actionButtonText: { marginLeft: 8, fontSize: 14, color: '#2874f0', fontWeight: '600' },
  primaryButton: { backgroundColor: '#2874f0', borderColor: '#2874f0' },
  primaryButtonText: { color: '#fff' },
  
  // Sections
  section: { padding: 20, backgroundColor: '#fff', marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 16 },
  
  // Gift Cards
  giftCard: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e9ecef' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardCode: { flex: 1, fontSize: 16, fontWeight: 'bold', color: '#2874f0', marginLeft: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  activeBadge: { backgroundColor: '#4caf50' },
  inactiveBadge: { backgroundColor: '#f44336' },
  statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  cardDetails: { gap: 8 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  balanceLabel: { fontSize: 14, color: '#666' },
  balanceValue: { fontSize: 14, fontWeight: '600', color: '#222' },
  
  // Empty State
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 18, color: '#666', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 8 },
  
  // How It Works
  howItWorks: { gap: 16 },
  step: { flexDirection: 'row', alignItems: 'center' },
  stepNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2874f0', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  stepNumberText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  stepText: { flex: 1, fontSize: 14, color: '#666' },
  
  // Error and Loading
  errorText: { color: '#e53935', fontSize: 16, textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: '#2874f0', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
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
  textArea: { height: 80, textAlignVertical: 'top' },
  
  // Balance Result
  balanceResult: { backgroundColor: '#f8f9fa', borderRadius: 8, padding: 16, marginTop: 16 },
  balanceResultTitle: { fontSize: 16, fontWeight: 'bold', color: '#222', marginBottom: 8 },
  balanceResultCode: { fontSize: 14, color: '#2874f0', marginBottom: 4 },
  balanceResultAmount: { fontSize: 24, fontWeight: 'bold', color: '#4caf50', marginBottom: 4 },
  balanceResultStatus: { fontSize: 14, color: '#666' },
  
  // Button Styles
  cancelButton: { flex: 1, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginRight: 8 },
  cancelButtonText: { textAlign: 'center', fontSize: 16, color: '#666' },
  checkButton: { flex: 1, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#2874f0', marginLeft: 8 },
  checkButtonText: { textAlign: 'center', fontSize: 16, color: '#fff', fontWeight: '600' },
  buyButton: { flex: 1, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#4caf50', marginLeft: 8 },
  buyButtonText: { textAlign: 'center', fontSize: 16, color: '#fff', fontWeight: '600' },
  disabledButton: { backgroundColor: '#ccc' },
}); 