import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext({
  user: null,
  setUser: () => {},
  logout: () => {},
});

const USER_STORAGE_KEY = 'lelekart_user';

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);

  // Restore user from AsyncStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (storedUser) {
          setUserState(JSON.parse(storedUser));
        }
      } catch (e) {
        // handle error if needed
      }
    };
    loadUser();
  }, []);

  // Save user to AsyncStorage whenever it changes
  const setUser = async (userObj) => {
    setUserState(userObj);
    if (userObj) {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userObj));
    } else {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
    }
  };

  const logout = async () => {
    // Clear all auth-related state immediately
    setUserState(null);
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      // Also clear any other auth-related storage
      await AsyncStorage.removeItem('lelekart_token');
      await AsyncStorage.removeItem('lelekart_user_data');
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
} 