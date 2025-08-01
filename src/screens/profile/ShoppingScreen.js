import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ShoppingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Go Shopping</Text>
      <Text>Browse products and start shopping!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafd' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, color: '#2874f0' },
}); 