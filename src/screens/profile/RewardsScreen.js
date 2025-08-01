import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Modal, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, Badge, ProgressBar } from 'react-native-paper';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE } from '../../lib/api';

const RewardsScreen = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');
  const [rewardsData, setRewardsData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [redeemModal, setRedeemModal] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    const fetchRewards = async () => {
      if (!user) return;
      try {
        const rewardsRes = await fetch(`${API_BASE}/api/rewards/${user.id}`);
        const transactionsRes = await fetch(`${API_BASE}/api/rewards/${user.id}/transactions`);
        
        if (!rewardsRes.ok || !transactionsRes.ok) {
          throw new Error('Failed to fetch rewards data');
        }

        const rewards = await rewardsRes.json();
        const transactions = await transactionsRes.json();

        setRewardsData(rewards);
        setTransactions(transactions);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRewards();
  }, [user]);

  const handleRedeemPoints = () => {
    setPointsToRedeem('');
    setRedeemModal(true);
  };

  const submitRedeem = async () => {
    if (!user) return;
    const points = parseInt(pointsToRedeem, 10);
    if (!points || points <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number of points to redeem.');
      return;
    }
    if (points > (rewardsData?.points || 0)) {
      Alert.alert('Insufficient Points', `You only have ${(rewardsData?.points || 0)} points available.`);
      return;
    }
    setRedeeming(true);
    try {
      const response = await fetch(`${API_BASE}/api/rewards/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: user.id, pointsToRedeem: points }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to redeem points.');
      }
      setRedeemModal(false);
      setPointsToRedeem('');
      // Refetch rewards data
      setIsLoading(true);
      const rewardsRes = await fetch(`${API_BASE}/api/rewards/${user.id}`);
      if (rewardsRes.ok) {
        const rewards = await rewardsRes.json();
        setRewardsData(rewards);
      }
      Alert.alert('Success!', `${points} points have been redeemed. The amount has been added to your wallet.`);
    } catch (error) {
      Alert.alert('Redemption Failed', error.message);
    } finally {
      setRedeeming(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator animating={true} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text>Error: {error}</Text>
      </View>
    );
  }
  
  const { availablePoints, lifetimePoints, redeemedPoints, tier, progressToNextTier, pointsNeededForNextTier } = {
      availablePoints: rewardsData?.points || 0,
      lifetimePoints: rewardsData?.lifetimePoints || 0,
      redeemedPoints: (rewardsData?.lifetimePoints || 0) - (rewardsData?.points || 0),
      tier: 'Bronze', // Tier logic to be implemented
      progressToNextTier: 50, // Tier logic to be implemented
      pointsNeededForNextTier: 1000, // Tier logic to be implemented
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Rewards</Text>
      <Text style={styles.subHeader}>Manage your reward points</Text>

      {/* Remove tabsContainer and only show overview */}
      {/* <View style={styles.tabsContainer}>
        <Button mode={activeTab === 'overview' ? 'contained' : 'outlined'} onPress={() => setActiveTab('overview')}>
          Overview
        </Button>
        <Button mode={activeTab === 'transactions' ? 'contained' : 'outlined'} onPress={() => setActiveTab('transactions')}>
          Transactions
        </Button>
      </View> */}

      {/* Only show overview content */}
      <View>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Title>Your Reward Points</Title>
              <Badge>{tier} Tier</Badge>
            </View>
            <Paragraph>Earn points with every purchase</Paragraph>
            <View style={styles.pointsContainer}>
              <View style={styles.pointBox}>
                <Text style={styles.pointText}>{availablePoints}</Text>
                <Text style={styles.pointLabel}>Available</Text>
              </View>
              <View style={styles.pointBox}>
                <Text style={styles.pointText}>{lifetimePoints}</Text>
                <Text style={styles.pointLabel}>Lifetime</Text>
              </View>
              <View style={styles.pointBox}>
                <Text style={styles.pointText}>{redeemedPoints}</Text>
                <Text style={styles.pointLabel}>Redeemed</Text>
              </View>
            </View>
            <View style={styles.progressContainer}>
              <Text>Progress to next tier ({pointsNeededForNextTier} points needed)</Text>
              <ProgressBar progress={progressToNextTier / 100} style={styles.progressBar} />
            </View>
          </Card.Content>
          <Card.Actions>
            <Button>Learn More</Button>
            <Button onPress={handleRedeemPoints}>Redeem Points</Button>
          </Card.Actions>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>How to Earn Points</Title>
            <Paragraph>Shop & Earn: Earn points with every purchase.</Paragraph>
            <Paragraph>Write Reviews: Earn points for each product review.</Paragraph>
            <Paragraph>Special Events: Double points during special events.</Paragraph>
            <Paragraph>Referral Bonus: Refer a friend and get points.</Paragraph>
          </Card.Content>
        </Card>
      </View>
      {/* Redeem Points Modal */}
      <Modal
        visible={redeemModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setRedeemModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: 320 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Redeem Reward Points</Text>
            <Text style={{ marginBottom: 8 }}>Available: {rewardsData?.points || 0} points</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 16, marginBottom: 10 }}
              value={pointsToRedeem}
              onChangeText={setPointsToRedeem}
              placeholder="Enter points to redeem"
              keyboardType="number-pad"
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
              <TouchableOpacity onPress={() => setRedeemModal(false)} style={{ marginRight: 16 }}>
                <Text style={{ color: '#888', fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitRedeem} disabled={redeeming} style={{ backgroundColor: '#2874f0', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 22 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{redeeming ? 'Redeeming...' : 'Redeem'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subHeader: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  pointBox: {
    alignItems: 'center',
  },
  pointText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  pointLabel: {
    color: 'gray',
  },
  progressContainer: {
    marginTop: 16,
  },
  progressBar: {
    marginTop: 8,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  transactionDate: {
    fontSize: 12,
    color: 'gray',
  },
  pointsPositive: {
    color: 'green',
  },
  pointsNegative: {
    color: 'red',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
export default RewardsScreen; 