import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { AuthContext } from '../context/AuthContext';

export default function RegisterScreen({ route, navigation }) {
  const { user: authUser, setUser } = useContext(AuthContext);
  const { email: routeEmail } = route.params || {};
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(authUser?.phone || '');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState('buyer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const email = authUser?.email || routeEmail || '';

  // Keep phone in sync with AuthContext user.phone
  useEffect(() => {
    setPhone(authUser?.phone || '');
  }, [authUser?.phone]);

  const handleRegister = () => {
    setError('');
    if (!username || username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (!phone.match(/^\d{10}$/)) {
      setError('Phone number must be 10 digits');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const user = { email, username, name, phone, address, role };
      setUser(user);
      navigation.replace('Register');
    }, 1200);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Complete Registration</Text>
      <Text style={styles.subtitle}>Please provide additional information</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        editable={false}
      />
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="numeric"
        maxLength={10}
      />
      <TextInput
        style={styles.input}
        placeholder="Address"
        value={address}
        onChangeText={setAddress}
      />
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={role}
          onValueChange={setRole}
          style={styles.picker}
        >
          <Picker.Item label="Buyer" value="buyer" />
          <Picker.Item label="Seller" value="seller" />
        </Picker>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Creating Account...' : 'Complete Registration'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Email' }] })} disabled={loading}>
        <Text style={styles.linkText}>Start over</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    height: 48,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    fontSize: 16,
    marginBottom: 12,
  },
  pickerContainer: {
    width: '100%',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 12,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 48,
  },
  button: {
    width: '100%',
    height: 48,
    backgroundColor: '#2e7dff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  error: {
    color: '#e53935',
    marginBottom: 8,
    fontSize: 14,
  },
  link: {
    marginTop: 16,
  },
  linkText: {
    color: '#2e7dff',
    fontSize: 16,
  },
}); 