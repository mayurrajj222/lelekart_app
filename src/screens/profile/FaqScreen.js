import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const FAQS = [
  {
    q: 'How do I place an order on Lelekart?',
    a: 'Browse products, add them to your cart, and proceed to checkout. Follow the on-screen instructions to complete your purchase.'
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We accept all major credit/debit cards, UPI, net banking, and wallet payments.'
  },
  {
    q: 'How can I track my order?',
    a: 'After your order is shipped, you’ll receive a tracking link via email and SMS. You can also track your order in the “My Orders” section of your account.'
  },
  {
    q: 'What is the return policy?',
    a: 'We offer a 7-day easy return policy for most products. Please refer to our Returns & Refunds page for details.'
  },
  {
    q: 'How do I contact customer support?',
    a: 'You can reach us via the “Need help? Contact us” option in the app, or visit our FAQ page for more information.'
  },
];

export default function FaqScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ alignItems: 'center', paddingBottom: 32 }}>
      <Icon name="comment-question-outline" size={60} color="#6B3F1D" style={{ marginBottom: 18, marginTop: 24 }} />
      <Text style={styles.title}>Help & FAQ</Text>
      {FAQS.map((faq, idx) => (
        <View key={idx} style={styles.faqCard}>
          <Text style={styles.faqQ}>{faq.q}</Text>
          <Text style={styles.faqA}>{faq.a}</Text>
        </View>
      ))}
      <TouchableOpacity style={styles.faqBtn} onPress={() => Linking.openURL('https://www.lelekart.com/faq')}>
        <Text style={styles.faqBtnText}>Visit Full FAQ Website</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 18,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#6B3F1D',
    marginBottom: 18,
    alignSelf: 'center',
  },
  faqCard: {
    backgroundColor: '#f9f6f2',
    borderRadius: 14,
    padding: 18,
    marginBottom: 18,
    width: '100%',
    shadowColor: '#6B3F1D',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  faqQ: {
    fontWeight: 'bold',
    color: '#6B3F1D',
    fontSize: 16,
    marginBottom: 6,
  },
  faqA: {
    color: '#333',
    fontSize: 15,
    lineHeight: 22,
  },
  faqBtn: {
    backgroundColor: '#6B3F1D',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    shadowColor: '#6B3F1D',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginTop: 16,
  },
  faqBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
}); 